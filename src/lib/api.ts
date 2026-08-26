export type ApiRecord = Record<string, unknown>

type ApiEnvelope<T> = T & {
  success?: boolean
  ok?: boolean
  error?: string
  message?: string
}

const FALLBACK_API_URL = 'https://script.google.com/macros/s/AKfycbx_gTo9bQ14nOZq3gFdJ_EpMCRVMyrMJZoN3r2w3WUcGgOQp-mpMooxnjaOJAHXjz7YOw/exec'
const API_URL = (import.meta.env.VITE_APPS_SCRIPT_URL || FALLBACK_API_URL).replace(/\/$/, '')
const REQUEST_TIMEOUT_MS = 30_000
const MAX_RETRIES = 2

export function backendConfigured() {
  return API_URL.length > 0
}

export function usingFallbackBackend() {
  return API_URL === FALLBACK_API_URL
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status >= 500
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        ...init,
        signal: init.signal ?? controller.signal,
        cache: 'no-store',
        credentials: 'omit',
      })
      const raw = await response.text()

      let data: ApiEnvelope<T>
      try {
        data = JSON.parse(raw) as ApiEnvelope<T>
      } catch {
        throw new Error(`Backend returned invalid JSON (${response.status}).`)
      }

      if (data.success === false || data.ok === false || !response.ok) {
        const error = new Error(data.error || data.message || `Request failed (${response.status})`)
        if (!isRetryableStatus(response.status) || attempt === MAX_RETRIES) throw error
        lastError = error
        await sleep(400 * 2 ** attempt)
        continue
      }

      return data
    } catch (error) {
      lastError = error instanceof DOMException && error.name === 'AbortError'
        ? new Error('Backend request timed out. Please try again.')
        : error

      if (attempt === MAX_RETRIES) {
        throw lastError instanceof Error ? lastError : new Error('Unable to reach the backend.')
      }

      await sleep(400 * 2 ** attempt)
    } finally {
      window.clearTimeout(timeout)
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to reach the backend.')
}

function post<T>(body: ApiRecord) {
  return request<T>(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  })
}

export function getHealth() {
  return request<{ success?: true; status: string; system: string; version: string; timestamp: string }>(`${API_URL}?action=health`)
}

export function getDashboard() {
  return request<{ metrics: ApiRecord; tickets?: ApiRecord[] }>(`${API_URL}?action=dashboard`)
}

export async function getTickets(limit = 1000) {
  const result = await request<{ records?: ApiRecord[]; tickets?: ApiRecord[] }>(`${API_URL}?action=tickets&limit=${limit}`)
  return { ...result, records: result.records ?? result.tickets ?? [] }
}

export async function listRecords(table: string, limit = 500) {
  const result = await request<{ records?: ApiRecord[] }>(`${API_URL}?action=list&table=${encodeURIComponent(table)}&limit=${limit}`)
  return { ...result, records: result.records ?? [] }
}

export function getRecord(table: string, id: string) {
  return request<{ record: ApiRecord | null }>(`${API_URL}?action=get&table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`)
}

export async function searchRecords(table: string, query: string) {
  const result = await listRecords(table, 2000)
  const normalizedQuery = query.trim().toLowerCase()
  return {
    ...result,
    records: normalizedQuery
      ? result.records.filter((record) => Object.values(record).some((value) => String(value ?? '').toLowerCase().includes(normalizedQuery)))
      : result.records,
  }
}

export function getMetadata() {
  return request<{ schema: Record<string, string[]>; options?: Record<string, string[]>; selects?: Record<string, string[]> }>(`${API_URL}?action=metadata`)
}

export function createRecord(table: string, record: ApiRecord) {
  return post<{ record: ApiRecord }>({ action: 'create', table, record })
}

export function updateRecord(table: string, id: string, record: ApiRecord) {
  return post<{ record: ApiRecord }>({ action: 'update', table, id, record })
}

export function deleteRecord(table: string, id: string) {
  return post<{ deleted: boolean }>({ action: 'delete', table, id })
}

function nowIso() {
  return new Date().toISOString()
}

export async function ticketAction(
  id: string,
  action: 'assign' | 'respond' | 'pending' | 'resolve' | 'close' | 'reopen' | 'escalate',
  payload: ApiRecord = {},
) {
  const currentResult = await getRecord('Issues', id)
  const current = currentResult.record || {}
  const updates: ApiRecord = {}

  switch (action) {
    case 'assign':
      updates['Assigned Officer'] = payload.officer || payload.assignedOfficer || ''
      break
    case 'respond':
      updates.Status = 'IN_PROGRESS'
      if (!current['First Response Time']) updates['First Response Time'] = payload.firstResponseTime || nowIso()
      break
    case 'pending':
      updates.Status = 'PENDING'
      break
    case 'resolve':
      updates.Status = 'RESOLVED'
      updates['Resolution Notes'] = payload.notes || payload.resolutionNotes || ''
      updates['Root Cause'] = payload.rootCause || ''
      updates['Date Resolved'] = payload.dateResolved || nowIso()
      if (payload.attachmentUrls) updates['Attachment URLs'] = payload.attachmentUrls
      break
    case 'close':
      updates.Status = 'CLOSED'
      updates['Ticket Closed At'] = payload.closedAt || nowIso()
      if (payload.attachmentUrls) updates['Attachment URLs'] = payload.attachmentUrls
      break
    case 'reopen':
      updates.Status = 'REOPENED'
      updates['Reopen Count'] = Number(current['Reopen Count'] || 0) + 1
      break
    case 'escalate':
      updates['Escalation Required'] = 'YES'
      updates['Escalation Level'] = payload.level || payload.escalationLevel || 'L2'
      break
  }

  return updateRecord('Issues', id, updates)
}

export async function uploadAttachment(file: File) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('Unable to read attachment'))
    reader.readAsDataURL(file)
  })

  return post<{ file: { name: string; url: string; id: string; mimeType?: string; size?: number } }>({
    action: 'upload',
    name: file.name,
    mimeType: file.type,
    data,
  })
}

export { API_URL }

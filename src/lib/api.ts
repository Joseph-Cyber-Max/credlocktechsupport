export type ApiRecord = Record<string, unknown>

type ApiEnvelope<T> = T & {
  success?: boolean
  ok?: boolean
  error?: string
  message?: string
}

const API_URL = (
  import.meta.env.VITE_APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbx_gTo9bQ14nOZq3gFdJ_EpMCRVMyrMJZoN3r2w3WUcGgOQp-mpMooxnjaOJAHXjz7YOw/exec'
).replace(/\/$/, '')

export function backendConfigured() {
  return Boolean(API_URL)
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const raw = await response.text()

  let data: ApiEnvelope<T>
  try {
    data = JSON.parse(raw) as ApiEnvelope<T>
  } catch {
    throw new Error(`Backend returned invalid JSON (${response.status}).`)
  }

  const failed = data.success === false || data.ok === false || !response.ok
  if (failed) {
    throw new Error(data.error || data.message || `Request failed (${response.status})`)
  }

  return data
}

function post<T>(body: ApiRecord) {
  return request<T>(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(body),
  })
}

export function getHealth() {
  return request<{
    success?: true
    ok?: true
    status?: string
    system?: string
    version?: string
    service?: string
    timezone?: string
    timestamp?: string
    time?: string
  }>(`${API_URL}?action=health`)
}

export function getDashboard() {
  return request<{
    success?: true
    ok?: true
    metrics: ApiRecord
    tickets?: ApiRecord[]
  }>(`${API_URL}?action=dashboard`)
}

export function getTickets(limit = 1000) {
  return request<{
    success?: true
    ok?: true
    records?: ApiRecord[]
    tickets?: ApiRecord[]
    metrics?: ApiRecord
  }>(`${API_URL}?action=tickets&limit=${limit}`)
}

export async function listRecords(table: string, limit = 500) {
  const result = await request<{
    success?: true
    ok?: true
    records?: ApiRecord[]
  }>(`${API_URL}?action=list&table=${encodeURIComponent(table)}&limit=${limit}`)

  return {
    ...result,
    records: result.records || [],
  }
}

export function getRecord(table: string, id: string) {
  return request<{
    success?: true
    ok?: true
    record: ApiRecord | null
  }>(`${API_URL}?action=get&table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`)
}

export async function searchRecords(table: string, query: string) {
  // The deployed backend supports the generic list endpoint consistently.
  // Filter client-side so search works even when an older Apps Script deployment
  // has not yet exposed a dedicated `search` GET action.
  const result = await listRecords(table, 1000)
  const term = query.trim().toLowerCase()
  if (!term) return result

  return {
    ...result,
    records: result.records.filter((record) =>
      Object.values(record).some((value) =>
        String(value ?? '').toLowerCase().includes(term),
      ),
    ),
  }
}

export function getMetadata() {
  return request<{
    success?: true
    ok?: true
    schema: Record<string, string[]>
    options?: Record<string, string[]>
    selects?: Record<string, string[]>
  }>(`${API_URL}?action=metadata`)
}

export function createRecord(table: string, record: ApiRecord) {
  return post<{
    success?: true
    ok?: true
    record: ApiRecord
  }>({
    action: 'create',
    table,
    record,
  })
}

export function updateRecord(table: string, id: string, record: ApiRecord) {
  return post<{
    success?: true
    ok?: true
    record: ApiRecord
  }>({
    action: 'update',
    table,
    id,
    record,
  })
}

export function deleteRecord(table: string, id: string) {
  return post<{
    success?: true
    ok?: true
    deleted: boolean
  }>({
    action: 'delete',
    table,
    id,
  })
}

function nowIso() {
  return new Date().toISOString()
}

/**
 * Ticket lifecycle adapter.
 *
 * The live Apps Script deployment already supports the generic `update`
 * operation and derives FRT, resolution time and SLA fields from ticket
 * timestamps. Using that stable contract here keeps the React app compatible
 * with the currently deployed backend while still exposing one clean API to
 * the UI.
 */
export async function ticketAction(
  id: string,
  action: 'assign' | 'respond' | 'pending' | 'resolve' | 'close' | 'reopen' | 'escalate',
  payload: ApiRecord = {},
) {
  const currentResult = await getRecord('Issues', id)
  const current = currentResult.record || {}

  let updates: ApiRecord = {}

  switch (action) {
    case 'assign':
      updates = {
        'Assigned Officer': payload.officer || payload.assignedOfficer || '',
      }
      break

    case 'respond':
      updates = {
        Status: 'IN_PROGRESS',
      }
      break

    case 'pending':
      updates = {
        Status: 'PENDING',
      }
      break

    case 'resolve':
      updates = {
        Status: 'RESOLVED',
        'Resolution Notes': payload.notes || payload.resolutionNotes || '',
        'Root Cause': payload.rootCause || '',
        'Date Resolved': payload.dateResolved || nowIso(),
      }
      break

    case 'close':
      updates = {
        Status: 'CLOSED',
        'Ticket Closed At': payload.closedAt || nowIso(),
      }
      break

    case 'reopen':
      updates = {
        Status: 'REOPENED',
        'Reopen Count': Number(current['Reopen Count'] || 0) + 1,
      }
      break

    case 'escalate':
      updates = {
        'Escalation Required': 'YES',
        'Escalation Level': payload.level || payload.escalationLevel || 'L2',
      }
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

  return post<{
    success?: true
    ok?: true
    file: {
      name: string
      url: string
      id: string
      mimeType?: string
      size?: number
    }
  }>({
    action: 'upload',
    name: file.name,
    mimeType: file.type,
    data,
  })
}

export { API_URL }

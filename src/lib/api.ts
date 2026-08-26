export type ApiRecord = Record<string, unknown>

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

  let data: T & { success?: boolean; ok?: boolean; error?: string }
  try {
    data = JSON.parse(raw) as T & { success?: boolean; ok?: boolean; error?: string }
  } catch {
    throw new Error(`Backend returned invalid JSON (${response.status}).`)
  }

  const failed = data.success === false || data.ok === false || !response.ok
  if (failed) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  return data
}

export function getHealth() {
  return request<{
    success: true
    status: string
    system: string
    version: string
    timestamp: string
  }>(`${API_URL}?action=health`)
}

export function getDashboard() {
  return request<{
    success: true
    metrics: ApiRecord
  }>(`${API_URL}?action=dashboard`)
}

export function getTickets(limit = 1000) {
  return request<{
    success: true
    records: ApiRecord[]
  }>(`${API_URL}?action=tickets&limit=${limit}`)
}

export function listRecords(table: string, limit = 500) {
  return request<{
    success: true
    records: ApiRecord[]
  }>(`${API_URL}?action=list&table=${encodeURIComponent(table)}&limit=${limit}`)
}

export function getRecord(table: string, id: string) {
  return request<{
    success: true
    record: ApiRecord | null
  }>(`${API_URL}?action=get&table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`)
}

export function searchRecords(table: string, query: string) {
  return request<{
    success: true
    records: ApiRecord[]
  }>(`${API_URL}?action=search&table=${encodeURIComponent(table)}&q=${encodeURIComponent(query)}`)
}

export function getMetadata() {
  return request<{
    success: true
    schema: Record<string, string[]>
    options: Record<string, string[]>
  }>(`${API_URL}?action=metadata`)
}

export function createRecord(table: string, record: ApiRecord) {
  return request<{
    success: true
    record: ApiRecord
  }>(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'create',
      table,
      record,
    }),
  })
}

export function updateRecord(table: string, id: string, record: ApiRecord) {
  return request<{
    success: true
    record: ApiRecord
  }>(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'update',
      table,
      id,
      record,
    }),
  })
}

export function deleteRecord(table: string, id: string) {
  return request<{
    success: true
    deleted: boolean
  }>(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'delete',
      table,
      id,
    }),
  })
}

export function ticketAction(
  id: string,
  ticketAction: 'assign' | 'respond' | 'pending' | 'resolve' | 'close' | 'reopen' | 'escalate',
  payload: ApiRecord = {},
) {
  return request<{
    success: true
    record: ApiRecord
  }>(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'ticket',
      id,
      ticketAction,
      ...payload,
    }),
  })
}

export async function uploadAttachment(file: File) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('Unable to read attachment'))
    reader.readAsDataURL(file)
  })

  return request<{
    success: true
    file: {
      name: string
      url: string
      id: string
      mimeType?: string
      size?: number
    }
  }>(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'upload',
      name: file.name,
      mimeType: file.type,
      data,
    }),
  })
}

export { API_URL }

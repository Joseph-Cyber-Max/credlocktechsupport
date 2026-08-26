export type ApiRecord = Record<string, unknown>

const API_URL = (import.meta.env.VITE_APPS_SCRIPT_URL || '').replace(/\/$/, '')

export function backendConfigured() {
  return Boolean(API_URL)
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error('VITE_APPS_SCRIPT_URL is not configured.')
  const response = await fetch(url, init)
  const data = (await response.json()) as T & { ok?: boolean; error?: string }
  if (!response.ok || data.ok === false) throw new Error(data.error || `Request failed (${response.status})`)
  return data
}

export function getDashboard() {
  return request<{ ok: true; metrics: ApiRecord; tickets: ApiRecord[] }>(`${API_URL}?action=dashboard`)
}

export function listRecords(table: string, limit = 500) {
  return request<{ ok: true; table: string; records: ApiRecord[] }>(`${API_URL}?action=list&table=${encodeURIComponent(table)}&limit=${limit}`)
}

export function getMetadata() {
  return request<{ ok: true; schema: Record<string, string[]>; selects: Record<string, string[]> }>(`${API_URL}?action=metadata`)
}

export function createRecord(table: string, record: ApiRecord) {
  return request<{ ok: true; record: ApiRecord }>(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'create', table, record }),
  })
}

export function updateRecord(table: string, id: string, record: ApiRecord) {
  return request<{ ok: true; record: ApiRecord }>(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'update', table, id, record }),
  })
}

export function deleteRecord(table: string, id: string) {
  return request<{ ok: true; deleted: boolean }>(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'delete', table, id }),
  })
}

export async function uploadAttachment(file: File) {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error || new Error('Unable to read attachment'))
    reader.readAsDataURL(file)
  })
  return request<{ ok: true; file: { name: string; url: string; id: string } }>(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'upload', name: file.name, mimeType: file.type, data }),
  })
}

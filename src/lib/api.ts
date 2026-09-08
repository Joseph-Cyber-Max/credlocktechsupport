export type ApiRecord = Record<string, unknown>
type ApiEnvelope<T> = T & { success?: boolean; ok?: boolean; error?: string; message?: string }

const FALLBACK_API_URL = 'https://script.google.com/macros/s/AKfycbx_gTo9bQ14nOZq3gFdJ_EpMCRVMyrMJZoN3r2w3WUcGgOQp-mpMooxnjaOJAHXjz7YOw/exec'
export const API_URL = (import.meta.env.VITE_APPS_SCRIPT_URL || FALLBACK_API_URL).replace(/\/$/, '')
const TOKEN_KEY = 'credlock_support_session'

export function backendConfigured() { return Boolean(API_URL) }
export function usingFallbackBackend() { return !import.meta.env.VITE_APPS_SCRIPT_URL }
export function getSessionToken() { return localStorage.getItem(TOKEN_KEY) || '' }
export function setSessionToken(token: string) { localStorage.setItem(TOKEN_KEY, token) }
export function clearSessionToken() { localStorage.removeItem(TOKEN_KEY) }

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
  const raw = await response.text()
  let data: ApiEnvelope<T>
  try { data = JSON.parse(raw) as ApiEnvelope<T> } catch { throw new Error(`Backend returned invalid JSON (${response.status}).`) }
  if (!response.ok || data.success === false || data.ok === false) throw new Error(data.error || data.message || `Request failed (${response.status})`)
  return data
}

async function getRequest<T>(action: string, params: Record<string, unknown> = {}) {
  const query = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)])) })
  const token = getSessionToken()
  if (token) query.set('token', token)
  return parseResponse<T>(await fetch(`${API_URL}?${query.toString()}`, { cache: 'no-store', redirect: 'follow' }))
}

async function postRequest<T>(body: Record<string, unknown>) {
  const token = getSessionToken()
  const payload = token ? { ...body, token } : body
  return parseResponse<T>(await fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  }))
}

export async function login(email: string, password: string) {
  const result = await postRequest<{ token: string; user: ApiRecord }>({ action: 'login', email: email.trim(), password })
  if (!result.token) throw new Error('Backend did not return a session token.')
  setSessionToken(result.token)
  return result
}

export async function logout() {
  try { await postRequest({ action: 'logout' }) } finally { clearSessionToken() }
}

export async function getSession() {
  if (!getSessionToken()) return { authenticated: false, user: null }
  try {
    const result = await getRequest<{ authenticated: boolean; user?: ApiRecord }>('session')
    return { authenticated: Boolean(result.authenticated), user: result.user || null }
  } catch {
    clearSessionToken()
    return { authenticated: false, user: null }
  }
}

export async function getHealth() { return getRequest<{ status: string; system: string; version: string; timestamp: string }>('health') }

export async function getMetadata() {
  const data = await getRequest<{ schema: Record<string,string[]>; selects?: Record<string,string[]>; options?: Record<string,string[]> }>('metadata')
  return { schema: data.schema || {}, options: data.options || data.selects || {} }
}

export async function listRecords(table: string, limit = 500) {
  const data = await getRequest<{ table: string; records: ApiRecord[] }>('list', { table, limit })
  return { success: true, records: data.records || [] }
}

export async function getRecord(table: string, id: string) {
  const data = await getRequest<{ record: ApiRecord | null }>('get', { table, id })
  return { success: true, record: data.record || null }
}

export async function searchRecords(table: string, query: string) {
  const result = await listRecords(table, 2000)
  const q = query.trim().toLowerCase()
  return { ...result, records: q ? result.records.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))) : result.records }
}

export async function createRecord(table: string, record: ApiRecord) {
  const data = await postRequest<{ record: ApiRecord }>({ action: 'create', table, record })
  return { success: true, record: data.record }
}

export async function updateRecord(table: string, id: string, record: ApiRecord) {
  const data = await postRequest<{ record: ApiRecord }>({ action: 'update', table, id, record })
  return { success: true, record: data.record }
}

export async function deleteRecord(table: string, id: string) {
  const data = await postRequest<{ deleted: boolean }>({ action: 'delete', table, id })
  return { success: true, deleted: Boolean(data.deleted) }
}

export async function ticketAction(id: string, action: 'assign'|'respond'|'pending'|'resolve'|'close'|'reopen'|'escalate', payload: ApiRecord = {}) {
  const data = await postRequest<{ record: ApiRecord }>({ action: 'ticketAction', id, ticketAction: action, payload })
  return { success: true, record: data.record }
}

export async function getTickets(limit = 1000) {
  const data = await getRequest<{ tickets: ApiRecord[]; metrics?: ApiRecord }>('tickets', { limit })
  return { success: true, records: data.tickets || [], tickets: data.tickets || [], metrics: data.metrics || {} }
}

export async function getDashboard() {
  const data = await getRequest<{ metrics: ApiRecord; tickets: ApiRecord[] }>('dashboard', { limit: 2000 })
  return { success: true, metrics: data.metrics || {}, tickets: data.tickets || [] }
}

export async function uploadAttachment(file: File) {
  const bytes = await file.arrayBuffer()
  let binary = ''
  const chunk = 0x8000
  const view = new Uint8Array(bytes)
  for (let i = 0; i < view.length; i += chunk) binary += String.fromCharCode(...view.subarray(i, i + chunk))
  const data = await postRequest<{ file: ApiRecord }>({ action: 'upload', name: file.name, mimeType: file.type, data: btoa(binary) })
  return { success: true, file: data.file }
}

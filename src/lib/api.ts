import {
  createFirestoreRecord,
  deleteFirestoreRecord,
  getFirestoreRecord,
  listFirestoreRecords,
  updateFirestoreRecord,
  type FirestoreRecord,
} from './firestore'

export type ApiRecord = Record<string, unknown>

type ApiEnvelope<T> = T & { success?: boolean; ok?: boolean; error?: string; message?: string }

const FALLBACK_API_URL = 'https://script.google.com/macros/s/AKfycbx_gTo9bQ14nOZq3gFdJ_EpMCRVMyrMJZoN3r2w3WUcGgOQp-mpMooxnjaOJAHXjz7YOw/exec'
const API_URL = (import.meta.env.VITE_APPS_SCRIPT_URL || FALLBACK_API_URL).replace(/\/$/, '')

function asApiRecord(value: FirestoreRecord | null | undefined): ApiRecord | null {
  return value ? { ...value } : null
}

export function backendConfigured() { return true }
export function usingFallbackBackend() { return false }

export async function getHealth() {
  try {
    await listFirestoreRecords('System Config', 1)
    return { success: true as const, status: 'healthy', system: 'Credlock Technical Support', version: 'firestore-primary', timestamp: new Date().toISOString() }
  } catch {
    return { success: false as const, status: 'degraded', system: 'Credlock Technical Support', version: 'firestore-primary', timestamp: new Date().toISOString() }
  }
}

function numberValue(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function dashboardFromTickets(tickets: ApiRecord[]) {
  const totalTickets = tickets.length
  const openTickets = tickets.filter(t => ['OPEN', 'REOPENED'].includes(String(t.Status || '').toUpperCase())).length
  const inProgressTickets = tickets.filter(t => String(t.Status || '').toUpperCase() === 'IN_PROGRESS').length
  const pendingTickets = tickets.filter(t => String(t.Status || '').toUpperCase() === 'PENDING').length
  const reopenedTickets = tickets.filter(t => String(t.Status || '').toUpperCase() === 'REOPENED').length
  const resolvedTickets = tickets.filter(t => String(t.Status || '').toUpperCase() === 'RESOLVED').length
  const closedTickets = tickets.filter(t => String(t.Status || '').toUpperCase() === 'CLOSED').length
  const criticalTickets = tickets.filter(t => String(t.Priority || '').toUpperCase() === 'CRITICAL' && !['CLOSED','RESOLVED'].includes(String(t.Status || '').toUpperCase())).length
  const firstResponses = tickets.map(t => numberValue(t['First Response Minutes'] ?? t['First Response Time Minutes'])).filter(n => n > 0)
  const resolutions = tickets.map(t => numberValue(t['Resolution Minutes'] ?? t['Resolution Time Minutes'])).filter(n => n > 0)
  const slaValues = tickets.map(t => t['SLA Met']).filter(v => v !== undefined && v !== '')
  const slaMet = slaValues.filter(v => v === true || String(v).toLowerCase() === 'true' || String(v).toUpperCase() === 'YES').length
  const slaComplianceRate = slaValues.length ? Number(((slaMet / slaValues.length) * 100).toFixed(1)) : 0
  const averageFirstResponseMinutes = firstResponses.length ? firstResponses.reduce((a,b)=>a+b,0)/firstResponses.length : 0
  const averageResolutionMinutes = resolutions.length ? resolutions.reduce((a,b)=>a+b,0)/resolutions.length : 0
  const closureRate = totalTickets ? Number((((resolvedTickets + closedTickets) / totalTickets) * 100).toFixed(1)) : 0
  return { totalTickets, openTickets, inProgressTickets, pendingTickets, reopenedTickets, resolvedTickets, closedTickets, criticalTickets, averageFirstResponseMinutes, averageResolutionMinutes, closureRate, slaComplianceRate }
}

export async function getTickets(limit = 1000) {
  const records = await listFirestoreRecords('Issues', limit)
  return { success: true, records: records as ApiRecord[], tickets: records as ApiRecord[] }
}

export async function getDashboard() {
  const tickets = await listFirestoreRecords('Issues', 2000) as ApiRecord[]
  return { success: true, metrics: dashboardFromTickets(tickets), tickets: tickets.slice(0, 20) }
}

export async function listRecords(table: string, limit = 500) {
  const records = await listFirestoreRecords(table, limit)
  return { success: true, records: records as ApiRecord[] }
}

export async function getRecord(table: string, id: string) {
  return { success: true, record: asApiRecord(await getFirestoreRecord(table, id)) }
}

export async function searchRecords(table: string, query: string) {
  const result = await listRecords(table, 2000)
  const normalizedQuery = query.trim().toLowerCase()
  return { ...result, records: normalizedQuery ? result.records.filter(record => Object.values(record).some(value => String(value ?? '').toLowerCase().includes(normalizedQuery))) : result.records }
}

export async function getMetadata() {
  // Metadata remains compatible with the existing Sheets schema while records are now stored in Firestore.
  const response = await fetch(`${API_URL}?action=metadata`, { cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load ticket metadata.')
  const data = await response.json() as ApiEnvelope<{ schema: Record<string,string[]>; options?: Record<string,string[]>; selects?: Record<string,string[]> }>
  return { schema: data.schema || {}, options: data.options || data.selects || {} }
}

export async function createRecord(table: string, record: ApiRecord) {
  const created = await createFirestoreRecord(table, record)
  return { success: true, record: created as ApiRecord }
}

export async function updateRecord(table: string, id: string, record: ApiRecord) {
  const current = await getFirestoreRecord(table, id)
  const updated = current ? await updateFirestoreRecord(table, id, record) : await createFirestoreRecord(table, { ...record, id })
  return { success: true, record: (updated as ApiRecord | null) || { id, ...record } }
}

export async function deleteRecord(table: string, id: string) {
  await deleteFirestoreRecord(table, id)
  return { success: true, deleted: true }
}

function nowIso() { return new Date().toISOString() }

export async function ticketAction(id: string, action: 'assign'|'respond'|'pending'|'resolve'|'close'|'reopen'|'escalate', payload: ApiRecord = {}) {
  const current = (await getFirestoreRecord('Issues', id)) || {}
  const updates: ApiRecord = {}
  switch (action) {
    case 'assign': updates['Assigned Officer'] = payload.officer || payload.assignedOfficer || ''; break
    case 'respond': updates.Status = 'IN_PROGRESS'; if (!current['First Response Time']) updates['First Response Time'] = payload.firstResponseTime || nowIso(); break
    case 'pending': updates.Status = 'PENDING'; break
    case 'resolve': updates.Status = 'RESOLVED'; updates['Resolution Notes'] = payload.notes || payload.resolutionNotes || ''; updates['Root Cause'] = payload.rootCause || ''; updates['Date Resolved'] = payload.dateResolved || nowIso(); break
    case 'close': updates.Status = 'CLOSED'; updates['Ticket Closed At'] = payload.closedAt || nowIso(); break
    case 'reopen': updates.Status = 'REOPENED'; updates['Reopen Count'] = Number(current['Reopen Count'] || 0) + 1; break
    case 'escalate': updates['Escalation Required'] = 'YES'; updates['Escalation Level'] = payload.level || payload.escalationLevel || 'L2'; break
  }
  return updateRecord('Issues', id, updates)
}

export async function uploadAttachment(_file: File) {
  throw new Error('File and photo attachments are disabled in the current Firebase plan. Continue using ticket notes and text fields.')
}

export { API_URL }

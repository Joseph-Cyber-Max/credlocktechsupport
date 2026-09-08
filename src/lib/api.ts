import {
  createFirestoreRecord,
  deleteFirestoreRecord,
  getFirestoreRecord,
  listFirestoreRecords,
  setFirestoreRecord,
  updateFirestoreRecord,
  type FirestoreRecord,
} from './firestore'
import { getCurrentUser } from './auth'

export type ApiRecord = Record<string, unknown>
type ApiEnvelope<T> = T & { success?: boolean; ok?: boolean; error?: string; message?: string }

const FALLBACK_API_URL = 'https://script.google.com/macros/s/AKfycbx_gTo9bQ14nOZq3gFdJ_EpMCRVMyrMJZoN3r2w3WUcGgOQp-mpMooxnjaOJAHXjz7YOw/exec'
const API_URL = (import.meta.env.VITE_APPS_SCRIPT_URL || FALLBACK_API_URL).replace(/\/$/, '')

function asApiRecord(value: FirestoreRecord | null | undefined): ApiRecord | null { return value ? { ...value } : null }
export function backendConfigured() { return true }
export function usingFallbackBackend() { return false }

function requireSignedIn() {
  if (!getCurrentUser()) throw new Error('Authentication required. Please sign in to access support data.')
}

async function sheetsGet<T>(url: string): Promise<T> {
  requireSignedIn()
  const response = await fetch(url, { cache: 'no-store' })
  const raw = await response.text()
  let data: ApiEnvelope<T>
  try { data = JSON.parse(raw) as ApiEnvelope<T> } catch { throw new Error(`Backend returned invalid JSON (${response.status}).`) }
  if (!response.ok || data.success === false || data.ok === false) throw new Error(data.error || data.message || `Request failed (${response.status})`)
  return data
}

async function migrateFromSheets(table: string, limit = 2000) {
  requireSignedIn()
  const data = await sheetsGet<{ records?: ApiRecord[]; tickets?: ApiRecord[] }>(`${API_URL}?action=${table === 'Issues' ? 'tickets' : 'list'}${table === 'Issues' ? '' : `&table=${encodeURIComponent(table)}`}&limit=${limit}`)
  const records = data.records ?? data.tickets ?? []
  if (!records.length) return [] as ApiRecord[]
  const migrated: ApiRecord[] = []
  for (const record of records) {
    const sourceId = String(record.id ?? record['Record ID'] ?? record['Ticket ID'] ?? '').trim()
    try {
      const saved = sourceId
        ? await setFirestoreRecord(table, sourceId.replace(/[\\/#?]/g, '_'), record)
        : await createFirestoreRecord(table, record)
      migrated.push((saved || { ...record, id: sourceId }) as ApiRecord)
    } catch {
      // Keep migrating the remaining records if one legacy record is malformed.
    }
  }
  return migrated
}

export async function getHealth() {
  try { await listFirestoreRecords('System Config', 1); return { success: true as const, status: 'healthy', system: 'Credlock Technical Support', version: 'firestore-primary', timestamp: new Date().toISOString() } }
  catch { return { success: false as const, status: 'degraded', system: 'Credlock Technical Support', version: 'firestore-primary', timestamp: new Date().toISOString() } }
}

function numberValue(value: unknown) { const n = Number(value); return Number.isFinite(n) ? n : 0 }
function dashboardFromTickets(tickets: ApiRecord[]) {
  const totalTickets=tickets.length
  const status=tickets.map(t=>String(t.Status||'').toUpperCase())
  const openTickets=status.filter(s=>s==='OPEN'||s==='REOPENED').length
  const inProgressTickets=status.filter(s=>s==='IN_PROGRESS').length
  const pendingTickets=status.filter(s=>s==='PENDING').length
  const reopenedTickets=status.filter(s=>s==='REOPENED').length
  const resolvedTickets=status.filter(s=>s==='RESOLVED').length
  const closedTickets=status.filter(s=>s==='CLOSED').length
  const criticalTickets=tickets.filter(t=>String(t.Priority||'').toUpperCase()==='CRITICAL'&&!['CLOSED','RESOLVED'].includes(String(t.Status||'').toUpperCase())).length
  const firstResponses=tickets.map(t=>numberValue(t['First Response Minutes']??t['First Response Time Minutes'])).filter(n=>n>0)
  const resolutions=tickets.map(t=>numberValue(t['Resolution Minutes']??t['Resolution Time Minutes'])).filter(n=>n>0)
  const slaValues=tickets.map(t=>t['SLA Met']).filter(v=>v!==undefined&&v!=='')
  const slaMet=slaValues.filter(v=>v===true||String(v).toLowerCase()==='true'||String(v).toUpperCase()==='YES').length
  const slaComplianceRate=slaValues.length?Number(((slaMet/slaValues.length)*100).toFixed(1)):0
  const averageFirstResponseMinutes=firstResponses.length?firstResponses.reduce((a,b)=>a+b,0)/firstResponses.length:0
  const averageResolutionMinutes=resolutions.length?resolutions.reduce((a,b)=>a+b,0)/resolutions.length:0
  const closureRate=totalTickets?Number((((resolvedTickets+closedTickets)/totalTickets)*100).toFixed(1)):0
  return {totalTickets,openTickets,inProgressTickets,pendingTickets,reopenedTickets,resolvedTickets,closedTickets,criticalTickets,averageFirstResponseMinutes,averageResolutionMinutes,closureRate,slaComplianceRate}
}

export async function getTickets(limit=1000) { const records=await listRecords('Issues',limit); return {success:true,records:records.records,tickets:records.records} }
export async function getDashboard() { const tickets=await getTickets(2000); return {success:true,metrics:dashboardFromTickets(tickets.records),tickets:tickets.records.slice(0,20)} }

export async function listRecords(table:string,limit=500) {
  try {
    let records=await listFirestoreRecords(table,limit) as ApiRecord[]
    if (!records.length) records=await migrateFromSheets(table,limit)
    return {success:true,records}
  } catch (error) {
    // Do not silently downgrade a Firestore permission/authentication failure
    // into an unauthenticated Google Sheets read. The legacy Sheets backend is
    // only reachable by an already authenticated operator.
    if (!getCurrentUser()) throw new Error('Authentication required. Please sign in to access support data.')
    throw error
  }
}

export async function getRecord(table:string,id:string) {
  let record=asApiRecord(await getFirestoreRecord(table,id))
  if (!record) {
    const legacy=await sheetsGet<{record?:ApiRecord}>(`${API_URL}?action=get&table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`)
    if (legacy.record) { await setFirestoreRecord(table,id,legacy.record); record=legacy.record }
  }
  return {success:true,record}
}

export async function searchRecords(table:string,query:string) { const result=await listRecords(table,2000); const q=query.trim().toLowerCase(); return {...result,records:q?result.records.filter(r=>Object.values(r).some(v=>String(v??'').toLowerCase().includes(q))):result.records} }

export async function getMetadata() {
  const data=await sheetsGet<{schema:Record<string,string[]>;options?:Record<string,string[]>;selects?:Record<string,string[]>}>(`${API_URL}?action=metadata`)
  return {schema:data.schema||{},options:data.options||data.selects||{}}
}

export async function createRecord(table:string,record:ApiRecord) { const created=await createFirestoreRecord(table,record); return {success:true,record:created as ApiRecord} }
export async function updateRecord(table:string,id:string,record:ApiRecord) { const updated=await updateFirestoreRecord(table,id,record); return {success:true,record:(updated as ApiRecord|null)||{id,...record}} }
export async function deleteRecord(table:string,id:string) { await deleteFirestoreRecord(table,id); return {success:true,deleted:true} }
function nowIso(){return new Date().toISOString()}

export async function ticketAction(id:string,action:'assign'|'respond'|'pending'|'resolve'|'close'|'reopen'|'escalate',payload:ApiRecord={}) {
  const current=(await getFirestoreRecord('Issues',id))||{}
  const updates:ApiRecord={}
  switch(action){
    case 'assign':updates['Assigned Officer']=payload.officer||payload.assignedOfficer||'';break
    case 'respond':updates.Status='IN_PROGRESS';if(!current['First Response Time'])updates['First Response Time']=payload.firstResponseTime||nowIso();break
    case 'pending':updates.Status='PENDING';break
    case 'resolve':updates.Status='RESOLVED';updates['Resolution Notes']=payload.notes||payload.resolutionNotes||'';updates['Root Cause']=payload.rootCause||'';updates['Date Resolved']=payload.dateResolved||nowIso();break
    case 'close':updates.Status='CLOSED';updates['Ticket Closed At']=payload.closedAt||nowIso();break
    case 'reopen':updates.Status='REOPENED';updates['Reopen Count']=Number(current['Reopen Count']||0)+1;break
    case 'escalate':updates['Escalation Required']='YES';updates['Escalation Level']=payload.level||payload.escalationLevel||'L2';break
  }
  return updateRecord('Issues',id,updates)
}

export async function uploadAttachment(_file:File){throw new Error('File and photo attachments are disabled in the current Firebase plan. Continue using ticket notes and text fields.')}
export {API_URL}

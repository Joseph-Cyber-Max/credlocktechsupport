import { createFileRoute, Link } from '@tanstack/react-router'
import { Activity, AlertTriangle, BarChart3, Bell, BookOpen, CheckCircle2, ClipboardList, Clock3, Database, FileText, Gauge, Menu, Plus, RefreshCw, Search, Settings2, ShieldCheck, Smartphone, Trash2, UserRound, Users, X, Zap } from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { backendConfigured, createRecord, deleteRecord, getDashboard, getMetadata, listRecords, ticketAction, updateRecord, uploadAttachment, type ApiRecord } from '../lib/api'
import '../ticketing-v2.css'

export const Route = createFileRoute('/')({ component: TicketingSystem })

type Module = { key: string; label: string; table?: string; icon: typeof Activity; description: string }
type Notice = { type: 'success' | 'error'; text: string } | null

const modules: Module[] = [
  { key: 'dashboard', label: 'Command Center', icon: Gauge, description: 'Live queue, SLA and operational performance.' },
  { key: 'tickets', label: 'Tickets', table: 'Issues', icon: ClipboardList, description: 'Create, assign, triage, resolve and close support cases.' },
  { key: 'incidents', label: 'Incidents', table: 'Incidents', icon: AlertTriangle, description: 'Track service-impacting incidents and linked tickets.' },
  { key: 'todo', label: 'Todo Items', table: 'Todo Items', icon: CheckCircle2, description: 'Track operational follow-ups and ownership.' },
  { key: 'recovery', label: 'Device Recovery', table: 'Recovery Records', icon: Smartphone, description: 'Manage device recovery and IMEI records.' },
  { key: 'recoveryTasks', label: 'Recovery Tasks', table: 'Recovery Tasks', icon: Smartphone, description: 'Manage device recovery assignments.' },
  { key: 'reports', label: 'Monthly Evaluations', table: 'Monthly Evaluations', icon: BarChart3, description: 'Performance evaluations and operational KPIs.' },
  { key: 'manualReports', label: 'Manual Reports', table: 'Manual Reports', icon: FileText, description: 'Officer and team reporting records.' },
  { key: 'knowledge', label: 'Knowledge Base', table: 'Knowledge Base Articles', icon: BookOpen, description: 'Troubleshooting articles and response templates.' },
  { key: 'people', label: 'Users', table: 'Users', icon: Users, description: 'Users, roles and departmental ownership.' },
  { key: 'officers', label: 'Officers', table: 'Officers', icon: UserRound, description: 'Support officer assignments and status.' },
  { key: 'departments', label: 'Departments', table: 'Departments', icon: Users, description: 'Department ownership and operational routing.' },
  { key: 'categories', label: 'Issue Categories', table: 'Issue Categories', icon: ClipboardList, description: 'Ticket taxonomy and default priorities.' },
  { key: 'feedback', label: 'Feedback', table: 'Feedback', icon: CheckCircle2, description: 'Customer and internal ticket feedback.' },
  { key: 'meetings', label: 'Meetings', table: 'Meetings', icon: Clock3, description: 'Operational meetings and notes.' },
  { key: 'meetingItems', label: 'Meeting Items', table: 'Meeting Items', icon: ClipboardList, description: 'Actions and topics from meetings.' },
  { key: 'audit', label: 'Audit Log', table: 'AuditLog', icon: ShieldCheck, description: 'System change history.' },
  { key: 'permissions', label: 'Page Permissions', table: 'Page Permissions', icon: ShieldCheck, description: 'Role and page permissions.' },
  { key: 'internal', label: 'Internal Requests', table: 'Internal Requests', icon: FileText, description: 'Internal requests and approvals.' },
  { key: 'schedules', label: 'Staff Schedules', table: 'Staff Schedules', icon: Clock3, description: 'Staff schedules and shifts.' },
  { key: 'questions', label: 'Pending Questions', table: 'Pending Questions', icon: FileText, description: 'Questions awaiting answers.' },
  { key: 'broadcasts', label: 'Broadcasts', table: 'Broadcasts', icon: Bell, description: 'Operational alerts and announcements.' },
  { key: 'kpis', label: 'KPI Targets', table: 'KPI Targets', icon: Gauge, description: 'Targets and measurable performance goals.' },
  { key: 'bnpl', label: 'BNPL Applications', table: 'BNPL Applications', icon: Smartphone, description: 'BNPL application operations.' },
  { key: 'blueprints', label: 'Operational Blueprints', table: 'Operational Blueprints', icon: Database, description: 'Process blueprints and operating standards.' },
]

const statusOptions = ['ALL', 'OPEN', 'IN_PROGRESS', 'PENDING', 'REOPENED', 'RESOLVED', 'CLOSED']
const priorityOptions = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

function TicketingSystem() {
  const [moduleKey, setModuleKey] = useState('dashboard')
  const [metrics, setMetrics] = useState<ApiRecord>({})
  const [tickets, setTickets] = useState<ApiRecord[]>([])
  const [records, setRecords] = useState<ApiRecord[]>([])
  const [schema, setSchema] = useState<Record<string, string[]>>({})
  const [options, setOptions] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [priority, setPriority] = useState('ALL')
  const [showNew, setShowNew] = useState(false)
  const [selected, setSelected] = useState<ApiRecord | null>(null)
  const [editRecord, setEditRecord] = useState<ApiRecord | null>(null)
  const [mobile, setMobile] = useState(false)

  const activeModule = modules.find((m) => m.key === moduleKey) || modules[0]

  const refresh = async () => {
    setLoading(true)
    try {
      const [dashboard, metadata, issueResult] = await Promise.all([getDashboard(), getMetadata(), listRecords('Issues', 2000)])
      setMetrics(dashboard.metrics || {})
      setSchema(metadata.schema || {})
      setOptions(metadata.options || metadata.selects || {})
      setTickets(issueResult.records || [])
      if (activeModule.table && activeModule.table !== 'Issues') {
        const result = await listRecords(activeModule.table, 1000)
        setRecords(result.records || [])
      }
      setNotice(null)
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to reach the backend.' })
    } finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [])

  const openModule = async (key: string) => {
    setModuleKey(key); setMobile(false); setSelected(null); setSearch(''); setStatus('ALL'); setPriority('ALL')
    const next = modules.find((m) => m.key === key)
    if (!next?.table || next.table === 'Issues') return
    setLoading(true)
    try { const result = await listRecords(next.table, 1000); setRecords(result.records || []); setNotice(null) }
    catch (error) { setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Unable to load records.' }) }
    finally { setLoading(false) }
  }

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets.filter((t) => {
      const statusOk = status === 'ALL' || String(t.Status || '').toUpperCase() === status
      const priorityOk = priority === 'ALL' || String(t.Priority || '').toUpperCase() === priority
      const haystack = Object.values(t).map((v) => String(v ?? '')).join(' ').toLowerCase()
      return statusOk && priorityOk && (!term || haystack.includes(term))
    })
  }, [tickets, search, status, priority])

  return <div className="cx-app">
    <aside className={`cx-side ${mobile ? 'open' : ''}`}>
      <div className="cx-brand"><div className="cx-logo"><Zap size={20} /></div><div><strong>CredlockDesk</strong><small>Technical Support Control</small></div></div>
      <div className="cx-nav-label">Operations</div>
      <nav className="cx-nav">
        {modules.map((item) => { const Icon = item.icon; const badge = item.table === 'Issues' ? Number(metrics.openTickets || 0) : 0; return <button key={item.key} className={moduleKey === item.key ? 'active' : ''} onClick={() => void openModule(item.key)}><Icon size={17}/><span>{item.label}</span>{badge > 0 && <em>{badge}</em>}</button> })}
        <div className="cx-nav-divider" />
        <Link to="/admin" className="cx-admin-link" onClick={() => setMobile(false)}><Settings2 size={17}/><span>Admin Control Center</span></Link>
      </nav>
      <div className="cx-health"><div><span>System health</span><strong>Live</strong></div><div className="cx-healthbar"><i style={{width:`${Math.max(0,Math.min(100,Number(metrics.slaComplianceRate ?? metrics.slaCompliance ?? 0)))}%`}}/></div><small>{String(metrics.slaComplianceRate ?? metrics.slaCompliance ?? 0)}% SLA compliance</small></div>
    </aside>

    {mobile && <button className="cx-mobile-backdrop" aria-label="Close navigation" onClick={() => setMobile(false)} />}
    <main className="cx-main">
      <header className="cx-top"><div className="cx-top-left"><button className="cx-iconbtn cx-mobile" onClick={() => setMobile(true)}><Menu size={17}/></button><i className="cx-dot"/> Operations online <span>• Africa/Lagos</span></div><div className="cx-actions"><button onClick={() => void refresh()} title="Refresh"><RefreshCw size={16}/></button><button><Bell size={16}/></button><Link className="cx-admin-top" to="/admin"><Settings2 size={15}/> Admin</Link><button className="cx-primary" onClick={() => setShowNew(true)}><Plus size={16}/> New ticket</button></div></header>
      <section className="cx-content">
        <div className="cx-heading"><div><p className="cx-kicker">Credlock technical support</p><h1>{activeModule.label}</h1><p>{activeModule.description}</p></div><div className="cx-connection"><ShieldCheck size={16}/> Apps Script + Google Sheets connected</div></div>
        {notice && <div className={`cx-alert ${notice.type === 'success' ? 'cx-okalert' : ''}`}>{notice.type === 'success' ? <CheckCircle2 size={15}/> : <AlertTriangle size={15}/>} {notice.text}</div>}
        {moduleKey === 'dashboard' && <Dashboard metrics={metrics} tickets={tickets} onOpenTickets={() => void openModule('tickets')}/>} 
        {moduleKey === 'tickets' && <TicketRegister tickets={filteredTickets} loading={loading} search={search} setSearch={setSearch} status={status} setStatus={setStatus} priority={priority} setPriority={setPriority} onNew={() => setShowNew(true)} onSelect={setSelected}/>} 
        {moduleKey !== 'dashboard' && moduleKey !== 'tickets' && activeModule.table && <DataModule table={activeModule.table} records={records} schema={schema} options={options} loading={loading} onAdd={() => setEditRecord({__new:true})} onEdit={setEditRecord} onDelete={async (id) => { try { await deleteRecord(activeModule.table!, id); setNotice({type:'success',text:'Record deleted.'}); await openModule(moduleKey) } catch(e) { setNotice({type:'error',text:e instanceof Error?e.message:'Delete failed.'}) } }}/>} 
      </section>
    </main>

    {showNew && <NewTicket schema={schema} options={options} onClose={() => setShowNew(false)} onCreated={async (ticket) => { setShowNew(false); setNotice({type:'success',text:`${String(ticket['Ticket ID'] || 'Ticket')} created successfully.`}); await refresh(); setModuleKey('tickets') }}/>} 
    {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} onChanged={async (message) => { setSelected(null); setNotice({type:'success',text:message}); await refresh() }} onError={(text) => setNotice({type:'error',text})}/>} 
    {editRecord && activeModule.table && <RecordEditor table={activeModule.table} record={editRecord} schema={schema} options={options} onClose={() => setEditRecord(null)} onSaved={async () => { setEditRecord(null); setNotice({type:'success',text:'Record saved.'}); await openModule(moduleKey)}}/>}
  </div>
}

function Dashboard({metrics,tickets,onOpenTickets}:{metrics:ApiRecord;tickets:ApiRecord[];onOpenTickets:()=>void}) { const sla=Number(metrics.slaComplianceRate ?? metrics.slaCompliance ?? 0); const cards=[['Total tickets',metrics.totalTickets ?? metrics.total ?? 0,ClipboardList],['Open queue',metrics.openTickets ?? metrics.open ?? 0,Activity],['Critical queue',metrics.criticalTickets ?? metrics.critical ?? 0,AlertTriangle],['SLA compliance',`${sla}%`,Gauge]] as const; return <><div className="cx-grid cx-metrics">{cards.map(([label,value,Icon])=><article className="cx-card cx-metric" key={label}><div className="cx-metric-top"><span>{label}</span><Icon size={18}/></div><strong>{String(value)}</strong><small>Live operational measure</small></article>)}</div><div className="cx-grid cx-two"><section className="cx-card"><div className="cx-card-head"><div><h2>Queue health</h2><small>Current ticket pressure</small></div><button className="cx-secondary" onClick={onOpenTickets}>Open register</button></div><div className="cx-card-body cx-bars">{[['Open',Number(metrics.openTickets ?? 0)],['In progress',Number(metrics.inProgressTickets ?? 0)],['Pending',Number(metrics.pendingTickets ?? 0)],['Reopened',Number(metrics.reopenedTickets ?? 0)]].map(([label,value])=><div className="cx-bar-row" key={String(label)}><span>{label}</span><div className="cx-bar"><i style={{width:`${Math.min(100,Number(value))}%`}}/></div><strong>{String(value)}</strong></div>)}</div></section><section className="cx-card"><div className="cx-card-head"><div><h2>Performance</h2><small>Response and resolution</small></div><Clock3 size={18}/></div><div className="cx-card-body"><div className="cx-detail-field"><span>Average FRT</span><strong>{duration(Number(metrics.averageFirstResponseMinutes ?? 0))}</strong></div><div className="cx-detail-field"><span>Average resolution</span><strong>{duration(Number(metrics.averageResolutionMinutes ?? 0))}</strong></div><div className="cx-detail-field"><span>Closure rate</span><strong>{String(metrics.closureRate ?? 0)}%</strong></div></div></section></div><section className="cx-card" style={{marginTop:16}}><div className="cx-card-head"><div><h2>Recent tickets</h2><small>Live from Issues sheet</small></div><span>{tickets.length}</span></div><TicketTable tickets={tickets.slice().sort((a,b)=>String(b['Date Created']||'').localeCompare(String(a['Date Created']||''))).slice(0,8)} onSelect={onOpenTickets}/></section></> }
function duration(value:number){ if(!value) return '—'; if(value<60) return `${value.toFixed(1)}m`; return `${Math.floor(value/60)}h ${(value%60).toFixed(0)}m` }
function TicketRegister({tickets,loading,search,setSearch,status,setStatus,priority,setPriority,onNew,onSelect}:{tickets:ApiRecord[];loading:boolean;search:string;setSearch:(v:string)=>void;status:string;setStatus:(v:string)=>void;priority:string;setPriority:(v:string)=>void;onNew:()=>void;onSelect:(t:ApiRecord)=>void}){ return <section className="cx-card"><div className="cx-card-head"><div><h2>Ticket register</h2><small>{tickets.length} matching cases</small></div><button className="cx-primary" onClick={onNew}><Plus size={15}/> New ticket</button></div><div className="cx-toolbar"><label className="cx-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tickets, customer, IMEI, NIN..." /></label><select value={status} onChange={e=>setStatus(e.target.value)}>{statusOptions.map(v=><option key={v}>{v}</option>)}</select><select value={priority} onChange={e=>setPriority(e.target.value)}><option>ALL</option>{priorityOptions.map(v=><option key={v}>{v}</option>)}</select></div><TicketTable tickets={tickets} onSelect={onSelect} loading={loading}/></section> }
function TicketTable({tickets,onSelect,loading=false}:{tickets:ApiRecord[];onSelect:(t:ApiRecord)=>void;loading?:boolean}){ if(loading)return <div className="cx-empty">Loading records…</div>; if(!tickets.length)return <div className="cx-empty">No tickets match the current filters.</div>; return <div className="cx-table-wrap"><table className="cx-table"><thead><tr><th>Ticket</th><th>Issue</th><th>Department</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead><tbody>{tickets.map((t,i)=><tr key={String(t['Record ID']||t['Ticket ID']||i)} onClick={()=>onSelect(t)}><td><strong>{String(t['Ticket ID']||'—')}</strong><small>{String(t['Record ID']||'')}</small></td><td>{String(t['Issue Title']||'—')}</td><td>{String(t.Department||'—')}</td><td><span className={`cx-pill ${String(t.Priority||'').toLowerCase()}`}>{String(t.Priority||'—')}</span></td><td><span className="cx-status">{String(t.Status||'—')}</span></td><td>{String(t['Date Created']||'—')}</td></tr>)}</tbody></table></div> }
function DataModule({table,records,schema,options,loading,onAdd,onEdit,onDelete}:{table:string;records:ApiRecord[];schema:Record<string,string[]>;options:Record<string,string[]>;loading:boolean;onAdd:()=>void;onEdit:(r:ApiRecord)=>void;onDelete:(id:string)=>void}){const fields=(schema[table]||Object.keys(records[0]||{})).slice(0,8); return <section className="cx-card"><div className="cx-card-head"><div><h2>{table}</h2><small>{records.length} records</small></div><button className="cx-primary" onClick={onAdd}><Plus size={15}/> Add record</button></div>{loading?<div className="cx-empty">Loading records…</div>:!records.length?<div className="cx-empty">No records found.</div>:<div className="cx-table-wrap"><table className="cx-table"><thead><tr>{fields.map(f=><th key={f}>{f}</th>)}<th>Actions</th></tr></thead><tbody>{records.map((r,i)=><tr key={String(r['Record ID']||i)}>{fields.map(f=><td key={f}>{String(r[f]??'')}</td>)}<td><button className="cx-iconbtn" onClick={()=>onEdit(r)}><Settings2 size={14}/></button><button className="cx-iconbtn" onClick={()=>void onDelete(String(r['Record ID']||r.id||''))}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>}</section>}
function NewTicket({schema,options,onClose,onCreated}:{schema:Record<string,string[]>;options:Record<string,string[]>;onClose:()=>void;onCreated:(r:ApiRecord)=>void}){const [form,setForm]=useState<ApiRecord>({'Issue Title':'','Description':'','Category':'','Department':'','Reported By Email':'','Priority':'MEDIUM','Customer Name':'','Contact Phone':''});const submit=async(e:FormEvent)=>{e.preventDefault();try{const r=await createRecord('Issues',form);onCreated(r.record)}catch(err){alert(err instanceof Error?err.message:'Unable to create ticket')}};return <div className="cx-overlay"><form className="cx-modal" onSubmit={submit}><div className="cx-modal-head"><div><h2>New ticket</h2><small>Create a support case</small></div><button type="button" className="cx-iconbtn" onClick={onClose}><X size={17}/></button></div>{['Issue Title','Description','Category','Department','Reported By Email','Priority','Customer Name','Contact Phone'].map(f=><label className="cx-field" key={f}><span>{f}</span>{(options[f]||[]).length?<select value={String(form[f]||'')} onChange={e=>setForm({...form,[f]:e.target.value})}><option value="">Select…</option>{options[f].map(v=><option key={v}>{v}</option>)}</select>:<input value={String(form[f]||'')} onChange={e=>setForm({...form,[f]:e.target.value})}/>}</label>)}<div className="cx-modal-actions"><button type="button" className="cx-secondary" onClick={onClose}>Cancel</button><button className="cx-primary">Create ticket</button></div></form></div>}
function TicketModal({ticket,onClose,onChanged,onError}:{ticket:ApiRecord;onClose:()=>void;onChanged:(m:string)=>void;onError:(m:string)=>void}){const act=async(a:'assign'|'respond'|'pending'|'resolve'|'close'|'reopen'|'escalate',payload:ApiRecord={})=>{try{await ticketAction(String(ticket['Record ID']),a,payload);onChanged(`Ticket ${a} successful.`)}catch(e){onError(e instanceof Error?e.message:'Ticket action failed.')}};return <div className="cx-overlay"><div className="cx-modal"><div className="cx-modal-head"><div><p className="cx-kicker">{String(ticket['Ticket ID']||'Ticket')}</p><h2>{String(ticket['Issue Title']||'Support case')}</h2></div><button className="cx-iconbtn" onClick={onClose}><X size={17}/></button></div><div className="cx-detail-grid">{Object.entries(ticket).slice(0,16).map(([k,v])=><div className="cx-detail-field" key={k}><span>{k}</span><strong>{String(v??'—')}</strong></div>)}</div><div className="cx-modal-actions"><button className="cx-secondary" onClick={()=>void act('reopen')}>Reopen</button><button className="cx-secondary" onClick={()=>void act('pending')}>Pending</button><button className="cx-secondary" onClick={()=>void act('escalate')}>Escalate</button><button className="cx-primary" onClick={()=>void act('resolve',{resolutionNotes:'Resolved from officer workspace.'})}>Resolve</button></div></div></div>}
function RecordEditor({table,record,schema,options,onClose,onSaved}:{table:string;record:ApiRecord;schema:Record<string,string[]>;options:Record<string,string[]>;onClose:()=>void;onSaved:()=>void}){const [form,setForm]=useState<ApiRecord>({...record});const fields=(schema[table]||Object.keys(record).filter(k=>k!=='Record ID')).slice(0,16);const save=async()=>{try{if(record.__new) await createRecord(table,form); else await updateRecord(table,String(record['Record ID']||record.id),form);onSaved()}catch(e){alert(e instanceof Error?e.message:'Unable to save record')}};return <div className="cx-overlay"><div className="cx-modal"><div className="cx-modal-head"><h2>{record.__new?'Add':'Edit'} {table}</h2><button className="cx-iconbtn" onClick={onClose}><X size={17}/></button></div>{fields.map(f=><label className="cx-field" key={f}><span>{f}</span>{(options[f]||[]).length?<select value={String(form[f]??'')} onChange={e=>setForm({...form,[f]:e.target.value})}><option value="">Select…</option>{options[f].map(v=><option key={v}>{v}</option>)}</select>:<input value={String(form[f]??'')} onChange={e=>setForm({...form,[f]:e.target.value})}/>}</label>)}<div className="cx-modal-actions"><button className="cx-secondary" onClick={onClose}>Cancel</button><button className="cx-primary" onClick={()=>void save()}>Save</button></div></div></div>}

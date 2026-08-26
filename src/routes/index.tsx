import { createFileRoute } from '@tanstack/react-router'
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
    if (!next?.table) return
    if (next.table === 'Issues') return
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
      </nav>
      <div className="cx-health"><div><span>System health</span><strong>Live</strong></div><div className="cx-healthbar"><i style={{width:`${Math.max(0,Math.min(100,Number(metrics.slaComplianceRate ?? metrics.slaCompliance ?? 0)))}%`}}/></div><small>{String(metrics.slaComplianceRate ?? metrics.slaCompliance ?? 0)}% SLA compliance</small></div>
    </aside>

    <main className="cx-main">
      <header className="cx-top"><div className="cx-top-left"><button className="cx-iconbtn cx-mobile" onClick={() => setMobile(true)}><Menu size={17}/></button><i className="cx-dot"/> Operations online <span>• Africa/Lagos</span></div><div className="cx-actions"><button onClick={() => void refresh()} title="Refresh"><RefreshCw size={16}/></button><button><Bell size={16}/></button><button className="cx-primary" onClick={() => setShowNew(true)}><Plus size={16}/> New ticket</button></div></header>
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

function Dashboard({metrics,tickets,onOpenTickets}:{metrics:ApiRecord;tickets:ApiRecord[];onOpenTickets:()=>void}) {
  const sla=Number(metrics.slaComplianceRate ?? metrics.slaCompliance ?? 0)
  const cards=[['Total tickets',metrics.totalTickets ?? metrics.total ?? 0,ClipboardList],['Open queue',metrics.openTickets ?? metrics.open ?? 0,Activity],['Critical queue',metrics.criticalTickets ?? metrics.critical ?? 0,AlertTriangle],['SLA compliance',`${sla}%`,Gauge]] as const
  const queues=[['Open',Number(metrics.openTickets ?? metrics.open ?? 0)],['In progress',Number(metrics.inProgressTickets ?? 0)],['Pending',Number(metrics.pendingTickets ?? metrics.pending ?? 0)],['Reopened',Number(metrics.reopenedTickets ?? metrics.reopened ?? 0)]]
  const max=Math.max(1,Number(metrics.totalTickets ?? metrics.total ?? tickets.length))
  return <>
    <div className="cx-grid cx-metrics">{cards.map(([label,value,Icon])=><article className="cx-card cx-metric" key={label}><div className="cx-metric-top"><span>{label}</span><Icon size={18}/></div><strong>{String(value)}</strong><small>Live operational measure</small></article>)}</div>
    <div className="cx-grid cx-two">
      <section className="cx-card"><div className="cx-card-head"><div><h2>Queue health</h2><small>Current ticket pressure</small></div><button className="cx-secondary" onClick={onOpenTickets}>Open register</button></div><div className="cx-card-body cx-bars">{queues.map(([label,value])=><div className="cx-bar-row" key={label}><span>{label}</span><div className="cx-bar"><i style={{width:`${Math.min(100,Math.max(0,(value/max)*100))}%`}}/></div><strong>{value}</strong></div>)}</div></section>
      <section className="cx-card"><div className="cx-card-head"><div><h2>Performance</h2><small>Response and resolution</small></div><Clock3 size={18}/></div><div className="cx-card-body"><div className="cx-detail-field"><span>Average FRT</span><strong>{duration(Number(metrics.averageFirstResponseMinutes ?? metrics.firstResponseTime ?? 0))}</strong></div><div className="cx-detail-field" style={{marginTop:9}}><span>Average resolution</span><strong>{duration(Number(metrics.averageResolutionMinutes ?? metrics.resolutionTime ?? 0))}</strong></div><div className="cx-detail-field" style={{marginTop:9}}><span>Closure rate</span><strong>{String(metrics.closureRate ?? 0)}%</strong></div></div></section>
    </div>
    <section className="cx-card" style={{marginTop:16}}><div className="cx-card-head"><div><h2>Recent tickets</h2><small>Live from Issues sheet</small></div><span>{tickets.length}</span></div><TicketTable tickets={tickets.slice().sort((a,b)=>String(b['Date Created']||'').localeCompare(String(a['Date Created']||''))).slice(0,8)} onSelect={onOpenTickets}/><div className="cx-stat-grid">{[['Resolved',metrics.resolvedTickets ?? 0],['Closed',metrics.closedTickets ?? 0],['FRT',duration(Number(metrics.averageFirstResponseMinutes ?? 0))],['Resolution',duration(Number(metrics.averageResolutionMinutes ?? 0))]].map(([l,v])=><div className="cx-stat" key={String(l)}><span>{l}</span><strong>{String(v)}</strong></div>)}</div></section>
  </>
}

function TicketRegister({tickets,loading,search,setSearch,status,setStatus,priority,setPriority,onNew,onSelect}:{tickets:ApiRecord[];loading:boolean;search:string;setSearch:(v:string)=>void;status:string;setStatus:(v:string)=>void;priority:string;setPriority:(v:string)=>void;onNew:()=>void;onSelect:(t:ApiRecord)=>void}){
  return <section className="cx-card"><div className="cx-card-head"><div><h2>Ticket register</h2><small>{tickets.length} matching cases</small></div><button className="cx-primary" onClick={onNew}><Plus size={15}/> New ticket</button></div><div className="cx-toolbar"><label className="cx-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ticket, customer, IMEI, category..."/></label><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">All statuses</option>{statusOptions.slice(1).map(v=><option key={v}>{v}</option>)}</select><select value={priority} onChange={e=>setPriority(e.target.value)}><option value="ALL">All priorities</option>{priorityOptions.map(v=><option key={v}>{v}</option>)}</select></div>{loading?<div className="cx-loading">Loading live tickets…</div>:<TicketTable tickets={tickets} full onSelect={onSelect}/>}</section>
}

function TicketTable({tickets,full=false,onSelect}:{tickets:ApiRecord[];full?:boolean;onSelect?:(t:ApiRecord)=>void}){
 if(!tickets.length)return <div className="cx-empty"><ClipboardList size={28}/><h3>No tickets found</h3><p>Create a ticket or change the filters.</p></div>
 return <div className="cx-table-wrap"><table className="cx-table"><thead><tr><th>Ticket</th><th>Issue</th><th>Customer / Merchant</th><th>Priority</th><th>Status</th><th>Created</th>{full&&<th>SLA</th>}</tr></thead><tbody>{tickets.map((t,i)=>{const s=String(t.Status||'OPEN').toLowerCase();const p=String(t.Priority||'LOW').toLowerCase();const sla=String(t['SLA Met']??'').toUpperCase();return <tr key={String(t['Record ID']||i)} className={onSelect?'clickable':''} onClick={()=>onSelect?.(t)}><td><strong>{String(t['Ticket ID']||'—')}</strong><small>{String(t['Issue Title']||'Untitled')}</small></td><td><strong>{String(t.Category||'—')}</strong><small>{String(t.Department||t.Channel||'Web Portal')}</small></td><td><strong>{String(t['Customer Name']||t['Reported By Email']||'—')}</strong><small>{String(t['Customer / Merchant Phone']||t['Contact Phone']||'')}</small></td><td><span className={`cx-pill cx-${p}`}>{String(t.Priority||'LOW')}</span></td><td><span className={`cx-pill cx-${s}`}>{String(t.Status||'OPEN')}</span></td><td>{fmtDate(t['Date Created'])}</td>{full&&<td className={sla==='TRUE'?'cx-ok':sla==='FALSE'?'cx-bad':''}>{sla==='TRUE'?'Met':sla==='FALSE'?'Missed':'Pending'}</td>}</tr>})}</tbody></table></div>
}

function TicketModal({ticket,onClose,onChanged,onError}:{ticket:ApiRecord;onClose:()=>void;onChanged:(m:string)=>Promise<void>;onError:(m:string)=>void}){
 const [busy,setBusy]=useState(false);const [notes,setNotes]=useState(String(ticket['Resolution Notes']||''));const [rootCause,setRootCause]=useState(String(ticket['Root Cause']||''));const [attachment,setAttachment]=useState<File|null>(null);const status=String(ticket.Status||'OPEN').toUpperCase();const id=String(ticket['Record ID']||'')
 async function act(action:'assign'|'respond'|'pending'|'resolve'|'close'|'reopen'|'escalate'){
  setBusy(true);try{let payload:ApiRecord={};if(action==='assign'){const officer=window.prompt('Officer email or name',String(ticket['Assigned Officer']||''));if(!officer)return;payload.officer=officer}if(action==='resolve'){payload.notes=notes;payload.rootCause=rootCause}if(action==='escalate'){payload.level=window.prompt('Escalation level (L1/L2/L3/MANAGEMENT)',String(ticket['Escalation Level']||'L2'))||'L2'}if(attachment){const file=await uploadAttachment(attachment);payload.attachmentUrls=file.file.url}await ticketAction(id,action,payload);await onChanged(`${String(ticket['Ticket ID']||'Ticket')} ${action} completed.`)}catch(e){onError(e instanceof Error?e.message:'Ticket action failed.')}finally{setBusy(false)}}
 return <div className="cx-modal-bg"><div className="cx-modal"><div className="cx-modal-head"><div><p className="cx-kicker">Ticket details</p><h2>{String(ticket['Ticket ID']||'Ticket')}</h2></div><button onClick={onClose}><X size={18}/></button></div><div className="cx-detail"><div className="cx-detail-grid">{['Issue Title','Category','Department','Priority','Status','Assigned Officer','Customer Name','Customer / Merchant Phone','Customer Device / IMEI','SLA Target (Minutes)','FRT Minutes','Resolution Minutes','SLA Met','Reopen Count'].map(k=><div className="cx-detail-field" key={k}><span>{k}</span><strong>{String(ticket[k]??'—')}</strong></div>)}</div><div className="cx-detail-description"><h4>Description</h4><p>{String(ticket.Description||'No description provided.')}</p></div>{['OPEN','IN_PROGRESS','PENDING','REOPENED'].includes(status)&&<div className="cx-form" style={{padding:'14px 0 0'}}><label className="span2">Resolution notes<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What was done?"/></label><label className="span2">Root cause<textarea value={rootCause} onChange={e=>setRootCause(e.target.value)} placeholder="Root cause or contributing factor"/></label><label className="span2">Attachment<input type="file" onChange={e=>setAttachment(e.target.files?.[0]||null)}/></label></div>}<div className="cx-actions-row">{status==='OPEN'&&<button className="cx-secondary" disabled={busy} onClick={()=>void act('respond')}>Start work</button>}{['OPEN','IN_PROGRESS'].includes(status)&&<button className="cx-secondary" disabled={busy} onClick={()=>void act('assign')}>Assign</button>}{['OPEN','IN_PROGRESS'].includes(status)&&<button className="cx-secondary" disabled={busy} onClick={()=>void act('pending')}>Pending</button>}{['OPEN','IN_PROGRESS','PENDING','REOPENED'].includes(status)&&<button className="cx-primary" disabled={busy} onClick={()=>void act('resolve')}>{busy?'Saving…':'Resolve'}</button>}{status==='RESOLVED'&&<button className="cx-primary" disabled={busy} onClick={()=>void act('close')}>Close</button>}{['RESOLVED','CLOSED'].includes(status)&&<button className="cx-secondary" disabled={busy} onClick={()=>void act('reopen')}>Reopen</button>}{status!=='CLOSED'&&<button className="cx-secondary" disabled={busy} onClick={()=>void act('escalate')}>Escalate</button>}</div></div></div></div>
}

function NewTicket({schema,options,onClose,onCreated}:{schema:Record<string,string[]>;options:Record<string,string[]>;onClose:()=>void;onCreated:(t:ApiRecord)=>Promise<void>}){
 const [saving,setSaving]=useState(false);const [error,setError]=useState('')
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError('');const d=new FormData(e.currentTarget);const record:ApiRecord={'Issue Title':d.get('title')||'','Description':d.get('description')||'','Category':d.get('category')||'App / Login Issue','Department':d.get('department')||'Technical Support','Reported By Email':d.get('email')||'','Priority':d.get('priority')||'HIGH','Status':'OPEN','Customer Name':d.get('customer')||'','Customer / Merchant Phone':d.get('phone')||'','Customer Device / IMEI':d.get('imei')||'','Customer Loan / Application Reference':d.get('reference')||'','Source':d.get('source')||'Web Portal','Channel':d.get('source')||'Web Portal','Subject Type':d.get('subject')||'Customer','NIN Number':d.get('nin')||''};try{const result=await createRecord('Issues',record);await onCreated(result.record)}catch(err){setError(err instanceof Error?err.message:'Unable to create ticket.')}finally{setSaving(false)}}
 const cats=options.Category||options['Category Name']||['App / Login Issue','Device / IMEI','BNPL Operations','Merchant Support','Payment / Reversal','Collections'];const deps=options.Department||options['Department Name']||['Technical Support','Collections'];
 return <div className="cx-modal-bg"><div className="cx-modal"><div className="cx-modal-head"><div><p className="cx-kicker">Case intake</p><h2>Create support ticket</h2></div><button onClick={onClose}><X size={18}/></button></div>{error&&<div className="cx-alert" style={{margin:'14px 18px 0'}}>{error}</div>}<form className="cx-form" onSubmit={submit}><label className="span2">Issue title<input name="title" required placeholder="e.g. Manager App cannot sync policy"/></label><label className="span2">Description<textarea name="description" required placeholder="Describe the issue, error message and troubleshooting already attempted."/></label><label>Category<select name="category">{cats.map(v=><option key={v}>{v}</option>)}</select></label><label>Priority<select name="priority">{priorityOptions.map(v=><option key={v}>{v}</option>)}</select></label><label>Department<select name="department">{deps.map(v=><option key={v}>{v}</option>)}</select></label><label>Subject type<select name="subject"><option>Customer</option><option>Merchant</option><option>Internal</option></select></label><label>Reported by email<input name="email" type="email"/></label><label>Source<select name="source"><option>Web Portal</option><option>WhatsApp</option><option>Email</option><option>Phone</option><option>Walk-In</option><option>Merchant Support Portal</option></select></label><label>Customer name<input name="customer"/></label><label>Phone<input name="phone"/></label><label>Device / IMEI<input name="imei"/></label><label>Loan / Application reference<input name="reference"/></label><label>NIN number<input name="nin"/></label><div className="cx-modal-foot" style={{gridColumn:'1/-1',margin:'0 -18px -18px'}}><button type="button" className="cx-secondary" onClick={onClose}>Cancel</button><button className="cx-primary" disabled={saving}>{saving?'Creating…':'Create ticket'}</button></div></form></div></div>
}

function DataModule({table,records,schema,options,loading,onAdd,onEdit,onDelete}:{table:string;records:ApiRecord[];schema:Record<string,string[]>;options:Record<string,string[]>;loading:boolean;onAdd:()=>void;onEdit:(r:ApiRecord)=>void;onDelete:(id:string)=>Promise<void>}){
 const [q,setQ]=useState('');const fields=(schema[table]||Object.keys(records[0]||{})).filter(f=>f!=='Record ID');const filtered=records.filter(r=>!q||Object.values(r).some(v=>String(v??'').toLowerCase().includes(q.toLowerCase())))
 return <section className="cx-card"><div className="cx-card-head"><div><h2>{table}</h2><small>{records.length} records • Google Sheets</small></div><button className="cx-primary" onClick={onAdd}><Plus size={15}/> Add record</button></div><div className="cx-toolbar"><label className="cx-search"><Search size={15}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={`Search ${table}...`}/></label></div>{loading?<div className="cx-loading">Loading records…</div>:!filtered.length?<div className="cx-empty"><Database size={28}/><h3>No records</h3><p>Add the first record to this module.</p></div>:<div className="cx-table-wrap"><table className="cx-table"><thead><tr>{fields.slice(0,9).map(f=><th key={f}>{f}</th>)}<th>Actions</th></tr></thead><tbody>{filtered.map((r,i)=><tr key={String(r['Record ID']||i)}>{fields.slice(0,9).map(f=><td key={f}>{formatValue(r[f])}</td>)}<td><button className="cx-iconbtn" onClick={()=>onEdit(r)} title="Edit"><Settings2 size={14}/></button>{table!=='AuditLog'&&<button className="cx-iconbtn" onClick={()=>{if(window.confirm('Delete this record?'))void onDelete(String(r['Record ID']||''))}} title="Delete"><Trash2 size={14}/></button>}</td></tr>)}</tbody></table></div>}</section>
}

function RecordEditor({table,record,schema,options,onClose,onSaved}:{table:string;record:ApiRecord;schema:Record<string,string[]>;options:Record<string,string[]>;onClose:()=>void;onSaved:()=>Promise<void>}){
 const isNew=Boolean(record.__new);const fields=(schema[table]||Object.keys(record)).filter(f=>f!=='Record ID').filter(f=>f!=='__new');const [values,setValues]=useState<ApiRecord>(()=>({...record}));const [saving,setSaving]=useState(false);const [error,setError]=useState('')
 async function save(e:FormEvent){e.preventDefault();setSaving(true);setError('');try{if(isNew){await createRecord(table,values)}else{await updateRecord(table,String(record['Record ID']),values)}await onSaved()}catch(err){setError(err instanceof Error?err.message:'Unable to save record.')}finally{setSaving(false)}}
 return <div className="cx-modal-bg"><div className="cx-modal"><div className="cx-modal-head"><div><p className="cx-kicker">{isNew?'Create':'Edit'} record</p><h2>{table}</h2></div><button onClick={onClose}><X size={18}/></button></div>{error&&<div className="cx-alert" style={{margin:'14px 18px 0'}}>{error}</div>}<form className="cx-form" onSubmit={save}>{fields.map((field)=><Field key={field} field={field} value={values[field]} options={options} onChange={v=>setValues(prev=>({...prev,[field]:v}))}/>)}<div className="cx-modal-foot" style={{gridColumn:'1/-1',margin:'0 -18px -18px'}}><button type="button" className="cx-secondary" onClick={onClose}>Cancel</button><button className="cx-primary" disabled={saving}>{saving?'Saving…':'Save record'}</button></div></form></div></div>
}

function Field({field,value,options,onChange}:{field:string;value:unknown;options:Record<string,string[]>;onChange:(v:string)=>void}){const list=options[field]||options[field.replace(/\s+/g,'')]||[];const val=String(value??'');if(list.length>0)return <label>{field}<select value={val} onChange={e=>onChange(e.target.value)}><option value="">—</option>{list.map(v=><option key={v}>{v}</option>)}</select></label>;const long=/description|notes|message|content|steps|template|details|reason|summary|path/i.test(field);return <label className={long?'span2':''}>{field}{long?<textarea value={val} onChange={e=>onChange(e.target.value)}/>:<input value={val} onChange={e=>onChange(e.target.value)}/>}</label>}

function duration(n:number){if(!Number.isFinite(n)||n<=0)return '0m';if(n<60)return `${n.toFixed(1)}m`;return `${Math.floor(n/60)}h ${Math.round(n%60)}m`}
function fmtDate(v:unknown){if(!v)return '—';const d=new Date(String(v));return Number.isNaN(d.getTime())?String(v):d.toLocaleString('en-NG',{dateStyle:'medium',timeStyle:'short'})}
function formatValue(v:unknown){if(v===null||v===undefined||v==='')return '—';if(typeof v==='object')return JSON.stringify(v);return String(v)}

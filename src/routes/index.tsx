import { createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Gauge,
  Layers3,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Smartphone,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  backendConfigured,
  createRecord,
  getDashboard,
  getMetadata,
  listRecords,
  ticketAction,
  updateRecord,
  type ApiRecord,
} from '../lib/api'
import '../ticketing.css'

export const Route = createFileRoute('/')({ component: TicketingSystem })

type Module =
  | 'dashboard'
  | 'tickets'
  | 'incidents'
  | 'recovery'
  | 'reports'
  | 'knowledge'
  | 'people'
  | 'broadcasts'
  | 'settings'

type Notice = { tone: 'success' | 'error'; text: string } | null

const modules: { id: Module; label: string; icon: typeof Activity }[] = [
  { id: 'dashboard', label: 'Command Center', icon: Gauge },
  { id: 'tickets', label: 'Tickets', icon: ClipboardList },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'recovery', label: 'Device Recovery', icon: Smartphone },
  { id: 'reports', label: 'Reports & KPIs', icon: BarChart3 },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'people', label: 'Users & Officers', icon: Users },
  { id: 'broadcasts', label: 'Broadcasts', icon: Bell },
  { id: 'settings', label: 'System Settings', icon: Settings2 },
]

const ticketStatuses = ['ALL', 'OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REOPENED']
const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

function TicketingSystem() {
  const [module, setModule] = useState<Module>('dashboard')
  const [metrics, setMetrics] = useState<ApiRecord>({})
  const [tickets, setTickets] = useState<ApiRecord[]>([])
  const [records, setRecords] = useState<ApiRecord[]>([])
  const [schema, setSchema] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [showNew, setShowNew] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<ApiRecord | null>(null)
  const [mobileNav, setMobileNav] = useState(false)

  const refresh = async () => {
    setLoading(true)
    try {
      const [dashboard, metadata, ticketResult] = await Promise.all([
        getDashboard(),
        getMetadata(),
        listRecords('Issues', 1000),
      ])
      setMetrics(dashboard.metrics)
      setSchema(metadata.schema)
      setTickets(ticketResult.records)
      setNotice(null)
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to reach the Google Sheets backend.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const openModule = async (next: Module) => {
    setModule(next)
    setMobileNav(false)
    setSelectedTicket(null)

    if (next === 'dashboard' || next === 'tickets') return

    const table = tableForModule(next)
    if (!table) return

    setLoading(true)
    try {
      const result = await listRecords(table, 500)
      setRecords(result.records)
      setNotice(null)
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to load records.',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchesStatus = status === 'ALL' || String(ticket.Status || '').toUpperCase() === status
      const searchable = [
        ticket['Ticket ID'],
        ticket['Issue Title'],
        ticket['Customer Name'],
        ticket['Customer / Merchant Phone'],
        ticket['Customer Device / IMEI'],
        ticket.Category,
        ticket.Priority,
        ticket.Status,
        ticket['Assigned Officer'],
      ]
        .map((value) => String(value || ''))
        .join(' ')
        .toLowerCase()
      return matchesStatus && (!term || searchable.includes(term))
    })
  }, [tickets, search, status])

  const showNotice = (tone: 'success' | 'error', text: string) => {
    setNotice({ tone, text })
  }

  return (
    <div className="ticket-app">
      <aside className={`ticket-sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="ticket-brand">
          <div className="brand-icon"><Zap size={19} fill="currentColor" /></div>
          <div>
            <strong>Credlock<span>Desk</span></strong>
            <small>Technical support control</small>
          </div>
        </div>
        <button className="sidebar-close" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={19} /></button>
        <p className="nav-label">Operations</p>
        <nav>
          {modules.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.id} className={module === item.id ? 'active' : ''} onClick={() => void openModule(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id === 'tickets' && Number(metrics.openTickets || 0) > 0 && <em>{String(metrics.openTickets)}</em>}
              </button>
            )
          })}
        </nav>
        <div className="sidebar-health">
          <div>
            <span><Activity size={14} /> System health</span>
            <strong>Live</strong>
          </div>
          <div className="health-bar"><i style={{ width: `${Number(metrics.slaComplianceRate ?? 0)}%` }} /></div>
          <small>{String(metrics.slaComplianceRate ?? 0)}% SLA compliance</small>
        </div>
        <div className="sidebar-user">
          <div className="avatar">TS</div>
          <div>
            <strong>Technical Support</strong>
            <small>Credlock operations</small>
          </div>
          <ChevronDown size={15} />
        </div>
      </aside>

      {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      <main className="ticket-main">
        <header className="ticket-topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button>
          <div className="online"><i /> Operations online <span>• Africa/Lagos</span></div>
          <div className="top-actions">
            <button onClick={() => void refresh()} title="Refresh"><RefreshCw size={17} /></button>
            <button title="Notifications"><Bell size={17} /></button>
            <button className="new-button" onClick={() => setShowNew(true)}><Plus size={17} /> New ticket</button>
          </div>
        </header>

        {notice && (
          <div className={`notice notice-${notice.tone}`}>
            {notice.tone === 'success' ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss"><X size={15} /></button>
          </div>
        )}

        {!backendConfigured() && (
          <div className="config-banner">
            <ShieldCheck size={18} />
            <div><strong>Google Sheets backend unavailable</strong><span>The Apps Script endpoint is not configured.</span></div>
          </div>
        )}

        <section className="ticket-content">
          <div className="content-head">
            <div>
              <p className="kicker">Credlock technical support</p>
              <h1>{titleForModule(module)}</h1>
              <p>{descriptionForModule(module)}</p>
            </div>
            <div className="head-badge">
              <ShieldCheck size={17} />
              <span><strong>Google Sheets backend</strong><small>AJAX API connected</small></span>
            </div>
          </div>

          {module === 'dashboard' && (
            <Dashboard metrics={metrics} tickets={tickets} onTickets={() => void openModule('tickets')} />
          )}

          {module === 'tickets' && (
            <TicketRegister
              tickets={filteredTickets}
              loading={loading}
              search={search}
              setSearch={setSearch}
              status={status}
              setStatus={setStatus}
              onNew={() => setShowNew(true)}
              onSelect={setSelectedTicket}
            />
          )}

          {module !== 'dashboard' && module !== 'tickets' && (
            <GenericModule module={module} records={records} loading={loading} schema={schema} />
          )}
        </section>
      </main>

      {showNew && (
        <NewTicket
          onClose={() => setShowNew(false)}
          onCreated={async (created) => {
            setShowNew(false)
            setNotice({ tone: 'success', text: `${String(created['Ticket ID'])} created successfully.` })
            await refresh()
            setModule('tickets')
          }}
        />
      )}

      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onChanged={async (message) => {
            setNotice({ tone: 'success', text: message })
            setSelectedTicket(null)
            await refresh()
          }}
          onError={(message) => showNotice('error', message)}
        />
      )}
    </div>
  )
}

function Dashboard({ metrics, tickets, onTickets }: { metrics: ApiRecord; tickets: ApiRecord[]; onTickets: () => void }) {
  const cards = [
    ['Open tickets', metrics.openTickets ?? 0, Activity],
    ['Critical queue', metrics.criticalTickets ?? 0, AlertTriangle],
    ['SLA compliance', `${metrics.slaComplianceRate ?? 0}%`, Gauge],
    ['Avg. resolution', formatDuration(Number(metrics.averageResolutionMinutes ?? 0)), Clock3],
  ] as const

  return (
    <>
      <div className="metric-grid">
        {cards.map(([label, value, Icon]) => (
          <article className="metric-card" key={label}>
            <div className="metric-top"><span>{label}</span><Icon size={19} /></div>
            <strong>{String(value)}</strong>
            <small>Live operational measure</small>
          </article>
        ))}
      </div>

      <div className="dashboard-two">
        <section className="panel">
          <div className="panel-title">
            <div><p className="kicker">Queue health</p><h2>Issue families</h2></div>
            <button className="link-button" onClick={onTickets}>View register →</button>
          </div>
          <Queue label="Open" value={Number(metrics.openTickets || 0)} max={Math.max(Number(metrics.totalTickets || 1), 1)} />
          <Queue label="In progress" value={Number(metrics.inProgressTickets || 0)} max={Math.max(Number(metrics.totalTickets || 1), 1)} />
          <Queue label="Pending" value={Number(metrics.pendingTickets || 0)} max={Math.max(Number(metrics.totalTickets || 1), 1)} />
          <Queue label="Reopened" value={Number(metrics.reopenedTickets || 0)} max={Math.max(Number(metrics.totalTickets || 1), 1)} />
        </section>

        <section className="panel insight">
          <div className="insight-icon"><Zap size={20} /></div>
          <p className="kicker">Support intelligence</p>
          <h2>{Number(metrics.criticalTickets || 0) ? 'Critical tickets need action' : 'Queue is stable'}</h2>
          <p>
            {Number(metrics.criticalTickets || 0)
              ? `${metrics.criticalTickets} critical ticket(s) require attention.`
              : 'The live Google Sheets queue, SLA engine and ticket lifecycle are connected.'}
          </p>
          <button onClick={onTickets}>Review tickets <span>→</span></button>
        </section>
      </div>

      <section className="panel recent">
        <div className="panel-title">
          <div><p className="kicker">Latest activity</p><h2>Recent tickets</h2></div>
          <span className="count-chip">{tickets.length}</span>
        </div>
        <MiniTable tickets={tickets.slice().sort(sortByNewest).slice(0, 7)} />
      </section>

      <div className="stat-strip">
        {[
          ['Total', metrics.totalTickets],
          ['Open', metrics.openTickets],
          ['Resolved', metrics.resolvedTickets],
          ['Closed', metrics.closedTickets],
          ['Closure', `${metrics.closureRate ?? 0}%`],
          ['FRT', formatDuration(Number(metrics.averageFirstResponseMinutes ?? 0))],
          ['Resolution', formatDuration(Number(metrics.averageResolutionMinutes ?? 0))],
          ['Reopened', metrics.reopenedTickets],
        ].map(([label, value]) => (
          <div key={String(label)}><span>{label}</span><strong>{String(value ?? 0)}</strong></div>
        ))}
      </div>
    </>
  )
}

function Queue({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="queue-line">
      <span>{label}</span>
      <div><i style={{ width: `${Math.min(100, Math.max(value ? 7 : 0, (value / max) * 100))}%` }} /></div>
      <strong>{value}</strong>
    </div>
  )
}

function TicketRegister({
  tickets,
  loading,
  search,
  setSearch,
  status,
  setStatus,
  onNew,
  onSelect,
}: {
  tickets: ApiRecord[]
  loading: boolean
  search: string
  setSearch: (value: string) => void
  status: string
  setStatus: (value: string) => void
  onNew: () => void
  onSelect: (ticket: ApiRecord) => void
}) {
  return (
    <section className="panel register">
      <div className="panel-title">
        <div><p className="kicker">Case flow</p><h2>Ticket register</h2></div>
        <button className="new-button" onClick={onNew}><Plus size={16} /> New ticket</button>
      </div>

      <div className="toolbar">
        <label>
          <Search size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket, customer, IMEI..." />
        </label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {ticketStatuses.map((value) => <option key={value} value={value}>{value === 'ALL' ? 'All statuses' : value}</option>)}
        </select>
      </div>

      {loading ? <LoadingRows /> : <MiniTable tickets={tickets} full onSelect={onSelect} />}
    </section>
  )
}

function MiniTable({ tickets, full = false, onSelect }: { tickets: ApiRecord[]; full?: boolean; onSelect?: (ticket: ApiRecord) => void }) {
  if (!tickets.length) {
    return <div className="empty"><ClipboardList size={28} /><h3>No tickets found</h3><p>Create a ticket or change your filters.</p></div>
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Issue</th>
            <th>Customer / Merchant</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
            {full && <th>SLA</th>}
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket, index) => {
            const sla = String(ticket['SLA Met'] ?? '').toUpperCase()
            return (
              <tr key={String(ticket['Record ID'] || index)} onClick={() => onSelect?.(ticket)} className={onSelect ? 'clickable-row' : undefined}>
                <td>
                  <strong>#{String(ticket['Ticket ID'] || '—')}</strong>
                  <small>{String(ticket['Issue Title'] || 'Untitled issue')}</small>
                </td>
                <td>
                  <span>{String(ticket.Category || '—')}</span>
                  <small>{String(ticket.Source || ticket.Channel || 'Web Portal')}</small>
                </td>
                <td>
                  <strong>{String(ticket['Customer Name'] || ticket['Reported By Email'] || '—')}</strong>
                  <small>{String(ticket['Customer / Merchant Phone'] || ticket['Contact Phone'] || '')}</small>
                </td>
                <td><span className={`pill priority-${String(ticket.Priority || 'LOW').toLowerCase()}`}>{String(ticket.Priority || 'LOW')}</span></td>
                <td><span className={`pill status-${String(ticket.Status || 'OPEN').toLowerCase()}`}>{String(ticket.Status || 'OPEN')}</span></td>
                <td>{formatDate(ticket['Date Created'])}</td>
                {full && <td><span className={sla === 'TRUE' ? 'sla-ok' : sla === 'FALSE' ? 'sla-risk' : 'sla-neutral'}>{sla === 'TRUE' ? 'Met' : sla === 'FALSE' ? 'Missed' : 'Pending'}</span></td>}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TicketDetails({
  ticket,
  onClose,
  onChanged,
  onError,
}: {
  ticket: ApiRecord
  onClose: () => void
  onChanged: (message: string) => Promise<void>
  onError: (message: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState(String(ticket['Resolution Notes'] || ''))
  const [rootCause, setRootCause] = useState(String(ticket['Root Cause'] || ''))

  const recordId = String(ticket['Record ID'] || '')
  const status = String(ticket.Status || 'OPEN').toUpperCase()

  async function runAction(action: 'assign' | 'respond' | 'pending' | 'resolve' | 'close' | 'reopen' | 'escalate') {
    setBusy(true)
    try {
      const payload: ApiRecord = {}
      if (action === 'assign') payload.officer = window.prompt('Officer email', String(ticket['Assigned Officer'] || '')) || ''
      if (action === 'resolve') {
        payload.notes = resolutionNotes
        payload.rootCause = rootCause
      }
      if (action === 'escalate') payload.level = window.prompt('Escalation level', String(ticket['Escalation Level'] || 'L2')) || 'L2'
      await ticketAction(recordId, action, payload)
      await onChanged(`Ticket ${String(ticket['Ticket ID'])} updated successfully.`)
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to update ticket.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal ticket-details-modal">
        <div className="modal-head">
          <div>
            <p className="kicker">Ticket details</p>
            <h2>{String(ticket['Ticket ID'] || 'Ticket')}</h2>
          </div>
          <button onClick={onClose} aria-label="Close"><X /></button>
        </div>

        <div className="ticket-detail-grid">
          <DetailField label="Title" value={ticket['Issue Title']} />
          <DetailField label="Category" value={ticket.Category} />
          <DetailField label="Priority" value={ticket.Priority} />
          <DetailField label="Status" value={ticket.Status} />
          <DetailField label="Customer" value={ticket['Customer Name']} />
          <DetailField label="Customer / Merchant Phone" value={ticket['Customer / Merchant Phone']} />
          <DetailField label="IMEI / Device" value={ticket['Customer Device / IMEI']} />
          <DetailField label="Assigned Officer" value={ticket['Assigned Officer']} />
          <DetailField label="SLA Target" value={`${String(ticket['SLA Target (Minutes)'] || 0)} minutes`} />
          <DetailField label="FRT" value={formatDuration(Number(ticket['FRT Minutes'] || 0))} />
          <DetailField label="Resolution" value={formatDuration(Number(ticket['Resolution Minutes'] || 0))} />
          <DetailField label="SLA" value={String(ticket['SLA Met'] || 'Pending')} />
        </div>

        <div className="detail-block">
          <strong>Description</strong>
          <p>{String(ticket.Description || 'No description provided.')}</p>
        </div>

        {(status === 'OPEN' || status === 'IN_PROGRESS' || status === 'PENDING' || status === 'REOPENED') && (
          <div className="form-grid">
            <label className="span-2">
              Resolution notes
              <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="Resolution details" />
            </label>
            <label className="span-2">
              Root cause
              <textarea value={rootCause} onChange={(e) => setRootCause(e.target.value)} placeholder="Root cause" />
            </label>
          </div>
        )}

        <div className="modal-actions action-bar">
          {status === 'OPEN' && <button className="secondary" disabled={busy} onClick={() => void runAction('respond')}>Start work</button>}
          {(status === 'OPEN' || status === 'IN_PROGRESS') && <button className="secondary" disabled={busy} onClick={() => void runAction('assign')}>Assign</button>}
          {(status === 'IN_PROGRESS' || status === 'OPEN') && <button className="secondary" disabled={busy} onClick={() => void runAction('pending')}>Mark pending</button>}
          {(status === 'OPEN' || status === 'IN_PROGRESS' || status === 'PENDING' || status === 'REOPENED') && <button className="new-button" disabled={busy} onClick={() => void runAction('resolve')}>{busy ? 'Saving…' : 'Resolve ticket'}</button>}
          {status === 'RESOLVED' && <button className="new-button" disabled={busy} onClick={() => void runAction('close')}>Close ticket</button>}
          {(status === 'RESOLVED' || status === 'CLOSED') && <button className="secondary" disabled={busy} onClick={() => void runAction('reopen')}>Reopen</button>}
          {status !== 'CLOSED' && <button className="secondary" disabled={busy} onClick={() => void runAction('escalate')}>Escalate</button>}
        </div>
      </div>
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: unknown }) {
  return <div className="detail-field"><span>{label}</span><strong>{formatCell(value) || '—'}</strong></div>
}

function GenericModule({ module, records, loading, schema }: { module: Module; records: ApiRecord[]; loading: boolean; schema: Record<string, string[]> }) {
  const table = tableForModule(module)
  const fields = table ? (schema[table] || []).filter((field) => field !== 'Record ID').slice(0, 10) : []

  return (
    <section className="panel generic">
      <div className="panel-title">
        <div><p className="kicker">{table}</p><h2>Operational records</h2></div>
        <span className="count-chip">{records.length}</span>
      </div>
      {loading ? <LoadingRows /> : !records.length ? (
        <div className="empty"><Layers3 size={28} /><h3>No records yet</h3><p>This module is ready for Google Sheets data.</p></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr>{fields.map((field) => <th key={field}>{field}</th>)}</tr></thead>
            <tbody>{records.map((row, index) => <tr key={String(row['Record ID'] || index)}>{fields.map((field) => <td key={field}>{formatCell(row[field])}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function NewTicket({ onClose, onCreated }: { onClose: () => void; onCreated: (ticket: ApiRecord) => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const data = new FormData(event.currentTarget)
    const record: ApiRecord = {
      'Issue Title': data.get('title') || '',
      Description: data.get('description') || '',
      Category: data.get('category') || 'App / Login Issue',
      Priority: data.get('priority') || 'MEDIUM',
      Status: 'OPEN',
      'Reported By Email': data.get('email') || '',
      'Customer Name': data.get('customer') || '',
      'Customer / Merchant Phone': data.get('phone') || '',
      'Customer Device / IMEI': data.get('imei') || '',
      'Customer Loan / Application Reference': data.get('loanReference') || '',
      Source: data.get('source') || 'Web Portal',
      Channel: data.get('source') || 'Web Portal',
      'Subject Type': data.get('subject') || 'Customer',
      Department: data.get('department') || 'Technical Support',
    }

    try {
      const created = await createRecord('Issues', record)
      await onCreated(created.record)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create ticket.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head">
          <div><p className="kicker">Case intake</p><h2>Create support ticket</h2></div>
          <button onClick={onClose} aria-label="Close"><X /></button>
        </div>
        {error && <div className="form-error"><AlertTriangle size={16} />{error}</div>}
        <form onSubmit={submit}>
          <div className="form-grid">
            <label>Issue title<input name="title" required placeholder="e.g. Manager App cannot sync policy" /></label>
            <label>Reported by email<input name="email" type="email" placeholder="officer@credlock.com" /></label>
            <label className="span-2">Description<textarea name="description" required placeholder="Describe the issue, error message and what has already been tried." /></label>
            <label>Category<select name="category"><option>App / Login Issue</option><option>Device / IMEI</option><option>BNPL Operations</option><option>Merchant Support</option><option>Payment / Reversal</option><option>Collections</option></select></label>
            <label>Priority<select name="priority">{priorities.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Customer / Merchant<select name="subject"><option>Customer</option><option>Merchant</option><option>Internal</option></select></label>
            <label>Source<select name="source"><option>Web Portal</option><option>WhatsApp</option><option>Email</option><option>Phone</option><option>Walk-In</option><option>Merchant Support Portal</option></select></label>
            <label>Department<input name="department" defaultValue="Technical Support" /></label>
            <label>Customer name<input name="customer" /></label>
            <label>Phone<input name="phone" /></label>
            <label>Device / IMEI<input name="imei" placeholder="IMEI or device reference" /></label>
            <label>Loan / Application reference<input name="loanReference" /></label>
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button className="new-button" disabled={submitting}>{submitting ? 'Creating…' : <><Plus size={16} /> Create ticket</>}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LoadingRows() {
  return <div className="loading-rows">{[1, 2, 3, 4, 5].map((item) => <div key={item}><i /><i /><i /></div>)}</div>
}

function tableForModule(module: Module) {
  return ({
    tickets: 'Issues',
    incidents: 'Incidents',
    recovery: 'Recovery Records',
    reports: 'Monthly Evaluations',
    knowledge: 'Knowledge Base Articles',
    people: 'Users',
    broadcasts: 'Broadcasts',
    settings: 'Page Permissions',
  } as Record<string, string>)[module]
}

function titleForModule(module: Module) {
  return ({
    dashboard: 'Command Center',
    tickets: 'Ticket Register',
    incidents: 'Incident Management',
    recovery: 'Device Recovery',
    reports: 'Reports & KPI Performance',
    knowledge: 'Knowledge Base',
    people: 'Users & Officers',
    broadcasts: 'Broadcast Center',
    settings: 'System Settings',
  } as Record<string, string>)[module]
}

function descriptionForModule(module: Module) {
  return ({
    dashboard: 'Monitor ticket pressure, SLAs, response time and support performance.',
    tickets: 'Search, triage, assign, resolve and close every technical support case.',
    incidents: 'Track service-impacting incidents and their linked tickets.',
    recovery: 'Manage device recovery records, IMEI and recovery activity.',
    reports: 'Review team performance, CSAT, FCR, NPS and operational KPIs.',
    knowledge: 'Centralise troubleshooting steps, response templates and escalation paths.',
    people: 'Manage users, officers and departmental ownership.',
    broadcasts: 'Publish operational alerts, policy updates and training notices.',
    settings: 'Control page permissions and administrative configuration.',
  } as Record<string, string>)[module]
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })
}

function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '0m'
  if (minutes < 60) return `${minutes.toFixed(2)}m`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder >= 0.01 ? `${hours}h ${remainder.toFixed(0)}m` : `${hours}h`
}

function sortByNewest(a: ApiRecord, b: ApiRecord) {
  return String(b['Date Created'] || '').localeCompare(String(a['Date Created'] || ''))
}

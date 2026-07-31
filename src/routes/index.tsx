import { createFileRoute } from '@tanstack/react-router'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bell,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Gauge,
  LayoutDashboard,
  Menu,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TicketCheck,
  UploadCloud,
  UserRound,
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  attachmentTypes,
  emptyMetrics,
  escalationOptions,
  rootCauseOptions,
  statusOptions,
  ticketCategories,
  troubleshootingOptions,
  type Metrics,
  type Ticket,
} from '../ticket-config'

export const Route = createFileRoute('/')({ component: OperationsDesk })

type View = 'dashboard' | 'tickets' | 'new'
type Notice = { tone: 'success' | 'error'; message: string } | null

const navItems = [
  { id: 'dashboard' as const, label: 'Command center', icon: LayoutDashboard },
  { id: 'tickets' as const, label: 'All tickets', icon: TicketCheck },
  { id: 'new' as const, label: 'Create ticket', icon: Plus },
]

const metricCards = [
  { key: 'open' as const, label: 'Open tickets', icon: Activity, accent: 'cobalt' },
  { key: 'critical' as const, label: 'Critical queue', icon: AlertTriangle, accent: 'coral' },
  { key: 'slaCompliance' as const, label: 'SLA compliance', icon: Gauge, accent: 'lime', suffix: '%' },
  { key: 'resolutionTime' as const, label: 'Avg. resolution', icon: Clock3, accent: 'ink', suffix: 'h' },
]

function OperationsDesk() {
  const [view, setView] = useState<View>('dashboard')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState<Notice>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [mobileNav, setMobileNav] = useState(false)

  const loadTickets = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tickets')
      if (!response.ok) throw new Error('Unable to load operations data.')
      const data = (await response.json()) as { tickets: Ticket[]; metrics: Metrics }
      setTickets(data.tickets)
      setMetrics(data.metrics)
    } catch {
      setNotice({ tone: 'error', message: 'The live queue is unavailable. Refresh to try again.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTickets()
  }, [loadTickets])

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchesSearch = !term || [ticket.ticketNumber, ticket.title, ticket.customerName, ticket.category, ticket.merchantName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
      return matchesSearch && (statusFilter === 'All statuses' || ticket.status === statusFilter)
    })
  }, [search, statusFilter, tickets])

  const changeView = (nextView: View) => {
    setView(nextView)
    setMobileNav(false)
    setNotice(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Zap size={18} fill="currentColor" /></div>
          <div><strong>Resolve<span>HQ</span></strong><small>Operations control</small></div>
        </div>
        <button className="sidebar-close" type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X /></button>
        <nav className="primary-nav" aria-label="Primary navigation">
          <p className="eyebrow">Workspace</p>
          {navItems.map((item) => (
            <button key={item.id} type="button" className={view === item.id ? 'active' : ''} onClick={() => changeView(item.id)}>
              <item.icon size={18} /><span>{item.label}</span>{item.id === 'tickets' && <em>{metrics.open}</em>}
            </button>
          ))}
        </nav>
        <div className="sidebar-signal">
          <div className="signal-head"><span><CircleDot size={15} /> System signal</span><strong>Live</strong></div>
          <div className="signal-bar"><i style={{ width: `${metrics.slaCompliance}%` }} /></div>
          <p>{metrics.slaCompliance}% SLA health across the current queue.</p>
        </div>
        <div className="agent-card">
          <div className="avatar">AO</div>
          <div><strong>Ada Okafor</strong><small>Technical support officer</small></div>
          <ChevronDown size={16} />
        </div>
      </aside>

      {mobileNav && <button className="nav-scrim" type="button" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}

      <main className="main-panel">
        <header className="topbar">
          <button className="mobile-menu" type="button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu /></button>
          <div className="topbar-title"><span className="live-dot" /> Operations online <small>Last sync just now</small></div>
          <div className="topbar-actions">
            <button type="button" className="icon-button" onClick={() => void loadTickets()} aria-label="Refresh tickets"><RefreshCw size={18} /></button>
            <button type="button" className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button>
            <button type="button" className="primary-button compact" onClick={() => changeView('new')}><Plus size={17} /> New ticket</button>
          </div>
        </header>

        {notice && <div className={`notice notice-${notice.tone}`}><span>{notice.tone === 'success' ? <CheckCircle2 /> : <AlertTriangle />}</span>{notice.message}<button type="button" onClick={() => setNotice(null)}><X size={16} /></button></div>}

        {view === 'new' ? (
          <TicketForm
            onCancel={() => changeView('dashboard')}
            onCreated={(ticket) => {
              setNotice({ tone: 'success', message: `${ticket.ticketNumber} was created with automatic triage recommendations.` })
              setView('dashboard')
              void loadTickets()
            }}
          />
        ) : (
          <div className="page-content">
            <section className="page-heading">
              <div><p className="eyebrow">Friday, 31 July 2026</p><h1>{view === 'dashboard' ? 'Command center' : 'Ticket register'}</h1><p>{view === 'dashboard' ? 'See pressure points, protect SLAs, and move every case forward.' : 'Search, filter, and review the complete operations queue.'}</p></div>
              <div className="heading-badge"><Bot size={19} /><span><strong>AI triage active</strong><small>Pattern checks on every ticket</small></span></div>
            </section>

            {view === 'dashboard' && (
              <>
                <section className="metrics-grid">
                  {metricCards.map((card) => (
                    <article className={`metric-card accent-${card.accent}`} key={card.key}>
                      <div className="metric-icon"><card.icon size={20} /></div>
                      <p>{card.label}</p>
                      <div className="metric-value">{loading ? <span className="skeleton short" /> : <>{metrics[card.key]}{card.suffix}</>}</div>
                      <span className="metric-foot">Live operational measure <ArrowUpRight size={14} /></span>
                    </article>
                  ))}
                </section>

                <section className="dashboard-grid">
                  <article className="panel queue-panel">
                    <div className="panel-head"><div><p className="eyebrow">Workload</p><h2>Queue by issue family</h2></div><span className="period-chip">Live</span></div>
                    <QueueBars metrics={metrics} />
                  </article>
                  <article className="panel ai-panel">
                    <div className="ai-orbit"><Sparkles size={22} /></div>
                    <p className="eyebrow">AI field note</p>
                    <h2>{metrics.imeiValidation > 0 ? 'IMEI checks need attention' : 'Queue is ready for triage'}</h2>
                    <p>{metrics.imeiValidation > 0 ? `${metrics.imeiValidation} ticket${metrics.imeiValidation === 1 ? '' : 's'} request IMEI validation. Reconcile portal and device records before a replacement or unlock.` : 'New tickets are checked for repeat customers, duplicate cases, IMEI mismatches, and SLA risk.'}</p>
                    <button type="button" onClick={() => changeView('tickets')}>Review flagged work <ArrowUpRight size={16} /></button>
                  </article>
                </section>
                <section className="detail-metrics" aria-label="Detailed dashboard metrics">
                  {[
                    ['Total tickets', metrics.total],
                    ['Pending', metrics.pending],
                    ['Closed', metrics.closed],
                    ['First response', `${metrics.firstResponseTime}m`],
                    ['IMEI requests', metrics.imeiValidation],
                    ['Device changes', metrics.deviceChanges],
                    ['Duplicate payments', metrics.duplicatePayments],
                    ['Officer performance', `${metrics.officerPerformance}%`],
                    ['Merchant performance', `${metrics.merchantPerformance}%`],
                    ['Recurring issues', metrics.recurringIssues],
                    ['AI insights', metrics.aiInsights],
                  ].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
                </section>
              </>
            )}

            <section className="panel ticket-panel">
              <div className="panel-head ticket-panel-head">
                <div><p className="eyebrow">Case flow</p><h2>{view === 'dashboard' ? 'Recent tickets' : 'All tickets'}</h2></div>
                {view === 'dashboard' ? <button className="text-button" type="button" onClick={() => changeView('tickets')}>View register <ArrowUpRight size={15} /></button> : <span className="record-count">{filteredTickets.length} records</span>}
              </div>
              <div className="table-tools">
                <label className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, customer, merchant..." /></label>
                <label className="select-wrap"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={16} /></label>
              </div>
              <TicketTable tickets={view === 'dashboard' ? filteredTickets.slice(0, 6) : filteredTickets} loading={loading} onCreate={() => changeView('new')} />
            </section>
          </div>
        )}
      </main>
    </div>
  )
}

function QueueBars({ metrics }: { metrics: Metrics }) {
  const queue = [
    { label: 'Technical', value: metrics.technicalIssues, color: 'var(--cobalt)' },
    { label: 'Customer', value: metrics.customerIssues, color: 'var(--coral)' },
    { label: 'Loan', value: metrics.loanIssues, color: 'var(--lime-dark)' },
    { label: 'Merchant', value: metrics.merchantIssues, color: 'var(--ochre)' },
  ]
  const maximum = Math.max(...queue.map((item) => item.value), 1)
  return <div className="queue-bars">{queue.map((item) => <div className="queue-row" key={item.label}><span>{item.label}</span><div><i style={{ width: `${Math.max((item.value / maximum) * 100, item.value ? 8 : 0)}%`, background: item.color }} /></div><strong>{item.value}</strong></div>)}</div>
}

function TicketTable({ tickets, loading, onCreate }: { tickets: Ticket[]; loading: boolean; onCreate: () => void }) {
  if (loading) return <div className="table-loading">{[1, 2, 3, 4].map((item) => <div className="skeleton-row" key={item}><span className="skeleton" /><span className="skeleton" /><span className="skeleton short" /></div>)}</div>
  if (!tickets.length) return <div className="empty-state"><div><TicketCheck size={28} /></div><h3>No tickets in this view</h3><p>Create the first case or adjust the filters to see more work.</p><button className="primary-button" type="button" onClick={onCreate}><Plus size={17} /> Create ticket</button></div>

  return (
    <div className="table-scroll"><table><thead><tr><th>Ticket</th><th>Customer / merchant</th><th>Issue</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead><tbody>{tickets.map((ticket) => <tr key={ticket.id}><td><strong className="ticket-id">{ticket.ticketNumber}</strong><span className="ticket-title">{ticket.title}</span></td><td><strong>{ticket.customerName}</strong><span>{ticket.merchantName || ticket.customerPhone}</span></td><td><span className="issue-cell"><Smartphone size={15} />{ticket.category}</span></td><td><span className={`priority priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span></td><td><span className={`status status-${ticket.status.toLowerCase().replaceAll(' ', '-')}`}><i />{ticket.status}</span></td><td><span>{formatDate(ticket.createdAt)}</span></td></tr>)}</tbody></table></div>
  )
}

function TicketForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (ticket: Ticket) => void }) {
  const [category, setCategory] = useState('App Crash')
  const [priority, setPriority] = useState('Medium')
  const [status, setStatus] = useState('Pending')
  const [imeiRequired, setImeiRequired] = useState(false)
  const [validationResult, setValidationResult] = useState('Match')
  const [troubleshooting, setTroubleshooting] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [attachmentCategory, setAttachmentCategory] = useState('Screenshot')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const toggleTroubleshooting = (item: string) => setTroubleshooting((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])
  const showDeviceChange = category === 'Device Change' || category === 'Device Replacement'
  const showLoan = category.includes('Loan') || ['BNPL Operations', 'Down Payment', 'Outstanding Balance', 'Collections', 'Repayment'].includes(category)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const form = event.currentTarget
    const values = new FormData(form)
    const payload = Object.fromEntries(values.entries()) as Record<string, string | File>
    delete payload.attachments
    const body = new FormData()
    body.set('payload', JSON.stringify({ ...payload, category, priority, status, imeiValidationRequired: imeiRequired, validationResult, troubleshooting }))
    body.set('attachmentCategory', attachmentCategory)
    files.forEach((file) => body.append('attachments', file))

    try {
      const response = await fetch('/api/tickets', { method: 'POST', body })
      const data = (await response.json()) as { ticket?: Ticket; error?: string }
      if (!response.ok || !data.ticket) throw new Error(data.error || 'Ticket creation failed.')
      onCreated(data.ticket)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Ticket creation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="ticket-form" onSubmit={submit}>
      <div className="form-hero"><button className="back-button" type="button" onClick={onCancel}><X size={18} /> Close</button><div><p className="eyebrow">New operations case</p><h1>Create a precise ticket.</h1><p>Capture enough context for the next team to act without another call.</p></div><div className="form-progress"><span>Required fields</span><strong>5</strong></div></div>
      {error && <div className="form-error"><AlertTriangle size={18} />{error}</div>}
      <div className="form-layout">
        <div className="form-sections">
          <FormSection number="01" title="Ticket essentials" subtitle="Ownership, urgency, and issue classification.">
            <div className="field-grid cols-2"><Field label="Ticket title" required><input name="title" required placeholder="e.g. Device remains locked after repayment" /></Field><Field label="Issue category" required><Select value={category} onChange={setCategory} options={[...ticketCategories]} /></Field><Field label="Priority"><Segmented value={priority} onChange={setPriority} options={['Low', 'Medium', 'High', 'Critical']} /></Field><Field label="Resolution status"><Select value={status} onChange={setStatus} options={statusOptions} /></Field><Field label="Assigned officer"><input name="assignedOfficer" placeholder="Officer name" /></Field><Field label="Escalated to"><Select name="escalatedTo" options={['Not escalated', ...escalationOptions]} /></Field></div>
          </FormSection>

          <FormSection number="02" title="Customer & merchant" subtitle="Identify the people and partner connected to the case.">
            <div className="field-grid cols-2"><Field label="Customer name" required><input name="customerName" required placeholder="Full name" /></Field><Field label="Phone number" required><input name="customerPhone" required inputMode="tel" placeholder="+234..." /></Field><Field label="Merchant name"><input name="merchantName" placeholder="Merchant or store" /></Field><Field label="NIN"><input name="customerNin" placeholder="National identity number" /></Field><Field label="BVN"><input name="customerBvn" placeholder="Bank verification number" /></Field></div>
          </FormSection>

          <FormSection number="03" title="IMEI validation" subtitle="Reconcile device and portal identity before action.">
            <div className="binary-question"><div><strong>IMEI validation required?</strong><span>Turn this on for validation, duplicate IMEI, enrollment, lock, and device-change cases.</span></div><label className="switch"><input type="checkbox" checked={imeiRequired} onChange={(event) => setImeiRequired(event.target.checked)} /><span /></label></div>
            {imeiRequired && <div className="conditional-fields"><div className="field-grid cols-2"><Field label="Correct IMEI"><input name="correctImei" inputMode="numeric" /></Field><Field label="Incorrect IMEI"><input name="incorrectImei" inputMode="numeric" /></Field><Field label="Portal IMEI"><input name="portalImei" inputMode="numeric" /></Field><Field label="Device IMEI"><input name="deviceImei" inputMode="numeric" /></Field><Field label="Validation result"><Segmented value={validationResult} onChange={setValidationResult} options={['Match', 'Mismatch']} /></Field><Field label="Reason"><input name="imeiReason" placeholder="Explain the discrepancy or request" /></Field></div></div>}
          </FormSection>

          {showDeviceChange && <FormSection number="04" title="Device change" subtitle="Preserve the audit trail between devices."><div className="field-grid cols-2"><Field label="Old IMEI"><input name="oldImei" inputMode="numeric" /></Field><Field label="New IMEI"><input name="newImei" inputMode="numeric" /></Field><Field label="Reason for change" wide><textarea name="deviceChangeReason" rows={3} placeholder="Why is this device being changed?" /></Field></div></FormSection>}

          {showLoan && <FormSection number="05" title="Loan information" subtitle="Capture the financial position at the time of the issue."><div className="field-grid cols-3"><Field label="Loan amount"><input name="loanAmount" type="number" min="0" step="0.01" /></Field><Field label="Outstanding balance"><input name="outstandingBalance" type="number" min="0" step="0.01" /></Field><Field label="Due balance"><input name="dueBalance" type="number" min="0" step="0.01" /></Field><Field label="Loan status"><input name="loanStatus" placeholder="Active, overdue, closed..." /></Field><Field label="Loan date"><input name="loanDate" type="date" /></Field><Field label="Due date"><input name="dueDate" type="date" /></Field></div></FormSection>}

          <FormSection number="06" title="Issue narrative" subtitle="Describe the event, reproduction path, and outcome clearly.">
            <div className="field-grid"><Field label="Issue description" required wide hint="Describe the issue in detail."><textarea name="description" required rows={5} placeholder="What happened, when did it start, and who is affected?" /></Field><Field label="Steps to reproduce" wide><textarea name="stepsToReproduce" rows={4} placeholder="1. Open the app..." /></Field><Field label="Expected result" wide><textarea name="expectedResult" rows={3} placeholder="What should have happened?" /></Field><Field label="Actual result" wide><textarea name="actualResult" rows={3} placeholder="What happened instead? Include exact error text." /></Field></div>
          </FormSection>

          <FormSection number="07" title="Troubleshooting done" subtitle="Prevent repeated work by recording completed checks.">
            <div className="check-grid">{troubleshootingOptions.map((item) => <label className={troubleshooting.includes(item) ? 'checked' : ''} key={item}><input type="checkbox" checked={troubleshooting.includes(item)} onChange={() => toggleTroubleshooting(item)} /><span><Check size={14} /></span>{item}</label>)}</div>
          </FormSection>

          <FormSection number="08" title="Evidence & resolution" subtitle="Attach proof, record the cause, and outline the fix.">
            <div className="field-grid cols-2"><Field label="Attachment type"><Select value={attachmentCategory} onChange={setAttachmentCategory} options={attachmentTypes} /></Field><Field label="Root cause analysis"><Select name="rootCause" options={['Select root cause', ...rootCauseOptions]} /></Field><Field label="Resolution" wide><textarea name="resolution" rows={4} placeholder="Document the resolution or next action." /></Field></div>
            <label className="upload-zone"><input name="attachments" type="file" multiple accept="image/*,video/*,.pdf,.txt,.log" onChange={(event) => setFiles(Array.from(event.target.files || []))} /><UploadCloud size={26} /><strong>{files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'Drop evidence here or browse'}</strong><span>Images, video, PDF, TXT or LOG · max 10 MB each</span></label>
            {files.length > 0 && <div className="file-list">{files.map((file) => <span key={`${file.name}-${file.size}`}><Paperclip size={14} />{file.name}<small>{formatBytes(file.size)}</small></span>)}</div>}
          </FormSection>

          <FormSection number="09" title="Approval trail" subtitle="Record reviewers now or complete this after resolution.">
            <div className="approval-grid"><ApprovalCard role="Technical Support Officer" name="approvalTechnicalOfficer" /><ApprovalCard role="Operations Manager" name="approvalOperationsManager" /><ApprovalCard role="Technical Manager" name="approvalTechnicalManager" /></div>
            <div className="field-grid cols-2 approval-fields"><Field label="Approval date"><input name="approvalDate" type="date" /></Field><Field label="Remarks"><input name="approvalRemarks" placeholder="Approval remarks" /></Field></div>
          </FormSection>
        </div>

        <aside className="recommendation-card">
          <div className="recommendation-title"><span><Sparkles size={19} /></span><div><p className="eyebrow">Automatic</p><h2>AI recommendation</h2></div></div>
          <p>Recommendations are generated when the ticket is submitted using issue type, IMEI state, priority, and previous cases.</p>
          <ul><li><ShieldCheck size={17} /><span><strong>Duplicate scan</strong>Customer, IMEI, and category history</span></li><li><Smartphone size={17} /><span><strong>Identity check</strong>Portal versus device IMEI</span></li><li><Clock3 size={17} /><span><strong>SLA target</strong>Priority-based response window</span></li><li><Bot size={17} /><span><strong>Next best action</strong>Suggested troubleshooting and owner</span></li></ul>
          <div className="recommendation-preview"><span>Current signal</span><strong>{priority === 'Critical' ? 'Immediate triage' : imeiRequired && validationResult === 'Mismatch' ? 'IMEI mismatch review' : 'Standard assessment'}</strong></div>
        </aside>
      </div>
      <div className="form-actions"><div><ShieldCheck size={18} /><span>Files are stored securely with the case record.</span></div><button className="secondary-button" type="button" onClick={onCancel}>Cancel</button><button className="primary-button submit-button" type="submit" disabled={submitting}>{submitting ? <><RefreshCw className="spin" size={17} /> Creating...</> : <><Send size={17} /> Create ticket</>}</button></div>
    </form>
  )
}

function FormSection({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="form-section"><div className="section-heading"><span>{number}</span><div><h2>{title}</h2><p>{subtitle}</p></div></div><div className="section-body">{children}</div></section>
}

function Field({ label, hint, required, wide, children }: { label: string; hint?: string; required?: boolean; wide?: boolean; children: React.ReactNode }) {
  return <label className={`field ${wide ? 'field-wide' : ''}`}><span>{label}{required && <em>*</em>}</span>{children}{hint && <small>{hint}</small>}</label>
}

function Select({ options, value, onChange, name }: { options: readonly string[]; value?: string; onChange?: (value: string) => void; name?: string }) {
  return <span className="select-wrap field-select"><select name={name} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={16} /></span>
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <span className="segmented">{options.map((option) => <button type="button" className={option === value ? 'active' : ''} onClick={() => onChange(option)} key={option}>{option}</button>)}</span>
}

function ApprovalCard({ role, name }: { role: string; name: string }) {
  return <label className="approval-card"><span><UserRound size={17} />{role}</span><input name={name} placeholder="Approver name" /></label>
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, Bot, ChevronRight, Clock3, Database, Inbox, MessageCircle, Search, Settings2, ShieldCheck, Smartphone, Ticket, Users, Zap } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { firebaseConfigured } from '../lib/firebaseRest'
import '../workspace.css'

export const Route = createFileRoute('/workspace')({ component: Workspace })

type Queue = { label: string; value: number; tone: 'blue' | 'lime' | 'amber' | 'coral' }

const queues: Queue[] = [
  { label: 'Open', value: 18, tone: 'blue' },
  { label: 'In progress', value: 11, tone: 'lime' },
  { label: 'Pending', value: 7, tone: 'amber' },
  { label: 'Escalated', value: 3, tone: 'coral' },
]

const conversations = [
  { name: 'Adewale Motors', preview: 'The device enrollment failed again.', time: '2m', unread: 3, ticket: 'TKT-000143', priority: 'HIGH' },
  { name: 'Ibrahim Yusuf', preview: 'Please confirm my repayment date.', time: '9m', unread: 1, ticket: 'TKT-000142', priority: 'MEDIUM' },
  { name: 'TechZone Ilorin', preview: 'I need help with a merchant login.', time: '21m', unread: 0, ticket: 'TKT-000141', priority: 'HIGH' },
  { name: 'Maryam Bello', preview: 'Can I change my guarantor?', time: '42m', unread: 0, ticket: '', priority: 'LOW' },
]

function Workspace() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(conversations[0])
  const filtered = useMemo(() => conversations.filter(c => `${c.name} ${c.preview} ${c.ticket}`.toLowerCase().includes(search.toLowerCase())), [search])

  return <div className="workspace-page">
    <header className="workspace-hero">
      <div className="workspace-title"><div className="workspace-mark"><Zap size={20}/></div><div><p className="workspace-eyebrow">Credlock operations</p><h1>Support Command Center</h1><p>One workspace for tickets, conversations, AI triage, devices and team operations.</p></div></div>
      <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}><div className="workspace-health"><span className="health-dot"/> Systems healthy <strong>{firebaseConfigured ? 'Firebase primary' : 'Sheets connected'}</strong></div><Link to="/admin" style={{display:'inline-flex',alignItems:'center',gap:7,padding:'10px 13px',borderRadius:11,border:'1px solid #d7e1ef',background:'#fff',color:'#0b5cff',textDecoration:'none',fontSize:12,fontWeight:800}}><Settings2 size={16}/> Admin</Link></div>
    </header>

    <section className="workspace-kpis">
      <article><span>Total tickets</span><strong>124</strong><small>+12 today</small><Ticket/></article>
      <article><span>Open queue</span><strong>18</strong><small>5 due within 1 hour</small><Inbox/></article>
      <article><span>SLA compliance</span><strong>96.4%</strong><small>+2.1% this week</small><ShieldCheck/></article>
      <article><span>AI triage</span><strong>82%</strong><small>tickets auto-classified</small><Bot/></article>
    </section>

    <section className="workspace-main-grid">
      <div className="workspace-panel queue-panel">
        <div className="panel-title"><div><span>Operations</span><h2>Queue health</h2></div><button>View tickets <ChevronRight size={15}/></button></div>
        <div className="queue-list">{queues.map(q => <div className="queue-item" key={q.label}><div className={`queue-icon ${q.tone}`}><Activity size={16}/></div><div className="queue-copy"><strong>{q.label}</strong><small>{q.value} cases</small></div><div className="queue-track"><i className={q.tone} style={{ width: `${Math.min(100, q.value * 4)}%` }}/></div><b>{q.value}</b></div>)}</div>
        <div className="queue-foot"><span><Clock3 size={14}/> Avg FRT <strong>11m</strong></span><span><Zap size={14}/> Avg resolution <strong>4h 18m</strong></span><span><AlertTriangle size={14}/> Breaches <strong>2</strong></span></div>
      </div>

      <aside className="workspace-panel ai-card"><div className="ai-badge"><Bot size={16}/> CREDLOCK AI</div><h2>Let AI handle the first mile.</h2><p>Classify incoming conversations, detect duplicates, extract customer/device data and create support tickets automatically.</p><div className="ai-stats"><div><strong>82%</strong><span>Auto-triaged</span></div><div><strong>94%</strong><span>Confidence</span></div></div><button>Open AI workspace <ChevronRight size={15}/></button></aside>
    </section>

    <section className="workspace-panel inbox-panel">
      <div className="panel-title"><div><span>Omnichannel inbox</span><h2>Customer conversations</h2></div><div className="panel-tools"><div className="workspace-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, ticket or message"/></div><button className="ghost-btn"><MessageCircle size={15}/> WhatsApp</button></div></div>
      <div className="inbox-layout">
        <div className="conversation-list">{filtered.map(c => <button className={`conversation ${selected.name === c.name ? 'active' : ''}`} key={c.name} onClick={() => setSelected(c)}><div className="conversation-avatar">{c.name.split(' ').map(x => x[0]).join('').slice(0,2)}</div><div className="conversation-body"><div><strong>{c.name}</strong><small>{c.time}</small></div><p>{c.preview}</p><div className="conversation-meta"><span>{c.ticket || 'No ticket'}</span><em className={c.priority.toLowerCase()}>{c.priority}</em></div></div>{c.unread > 0 && <b className="unread">{c.unread}</b>}</button>)}</div>
        <div className="thread-preview"><div className="thread-head"><div className="conversation-avatar large">{selected.name.split(' ').map(x => x[0]).join('').slice(0,2)}</div><div><strong>{selected.name}</strong><small>WhatsApp · {selected.ticket || 'Conversation only'}</small></div><button className="ghost-btn"><Users size={15}/> Assign</button></div><div className="thread-messages"><div className="bubble inbound">Hi, I tried enrolling the phone twice and it still fails.<small>08:42</small></div><div className="bubble ai"><Bot size={13}/> AI classified: <strong>Device Enrollment · HIGH</strong><small>08:42</small></div><div className="bubble outbound">Thanks. Please send the IMEI displayed on the device so I can check the enrollment record.<small>08:43 · Delivered</small></div></div><div className="thread-footer"><span>AI suggestion ready</span><button className="send-btn">Send response</button></div></div>
      </div>
    </section>

    <section className="workspace-tiles">
      <article><Smartphone/><div><span>Device operations</span><strong>IMEI & recovery</strong><small>Enrollment, duplicates and recovery tasks</small></div><ChevronRight/></article>
      <article><Database/><div><span>Data layer</span><strong>Firebase + Sheets</strong><small>Primary realtime data with reporting mirror</small></div><ChevronRight/></article>
      <article><ShieldCheck/><div><span>Governance</span><strong>Audit & permissions</strong><small>Roles, access and immutable activity trail</small></div><ChevronRight/></article>
    </section>
  </div>
}

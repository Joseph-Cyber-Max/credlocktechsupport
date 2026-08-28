import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Activity, ArrowLeft, Database, KeyRound, LockKeyhole, RefreshCw, Search, ServerCog, ShieldCheck, Users, UserCog, Building2, SlidersHorizontal, FileClock } from 'lucide-react'
import { firebaseConfigured, firebaseSignIn } from '../lib/firebaseRest'
import { listPrimary, type DataSource } from '../lib/dataLayer'
import type { ApiRecord } from '../lib/api'
import '../admin.css'

export const Route = createFileRoute('/admin')({ component: AdminCenter })

type AdminTab = { id: string; label: string; icon: typeof Users; collection: string; description: string }
const tabs: AdminTab[] = [
  { id: 'users', label: 'Users', icon: Users, collection: 'Users', description: 'Accounts, roles and access ownership.' },
  { id: 'officers', label: 'Officers', icon: UserCog, collection: 'Officers', description: 'Officer availability and assignments.' },
  { id: 'departments', label: 'Departments', icon: Building2, collection: 'Departments', description: 'Operational ownership and routing.' },
  { id: 'permissions', label: 'Permissions', icon: ShieldCheck, collection: 'Page Permissions', description: 'Page-level access controls.' },
  { id: 'config', label: 'System Config', icon: SlidersHorizontal, collection: 'System Config', description: 'Runtime settings and operational defaults.' },
  { id: 'audit', label: 'Audit Log', icon: FileClock, collection: 'AuditLog', description: 'Traceable administrative activity.' },
]

function AdminCenter() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState<string | undefined>()
  const [tab, setTab] = useState('users')
  const [records, setRecords] = useState<ApiRecord[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [source, setSource] = useState<DataSource>('GOOGLE_SHEETS')

  const active = tabs.find((item) => item.id === tab) || tabs[0]

  const load = async (authToken = token) => {
    setLoading(true); setError('')
    try {
      const data = await listPrimary(active.collection, 1000, authToken)
      setRecords(data)
      setSource(firebaseConfigured && authToken ? 'FIREBASE' : 'GOOGLE_SHEETS')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load administration data.')
    } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [active.collection])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return records
    return records.filter((record) => Object.values(record).some((value) => String(value ?? '').toLowerCase().includes(term)))
  }, [records, query])

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    if (!firebaseConfigured) { setError('Firebase is not configured. Administration is currently backed by Google Sheets. Configure Firebase before enabling authenticated admin access.'); return }
    try {
      const auth = await firebaseSignIn(email.trim(), password)
      setToken(auth.idToken)
      setPassword('')
      await load(auth.idToken)
    } catch (err) { setError(err instanceof Error ? err.message : 'Admin sign-in failed.') }
  }

  return <div className="admin-page">
    <header className="admin-topbar">
      <div className="admin-brand"><div className="admin-mark"><ServerCog size={20}/></div><div><span>Credlock</span><strong>Admin Control Center</strong></div></div>
      <div className="admin-top-actions"><span className={`admin-source ${source === 'FIREBASE' ? 'primary' : ''}`}><Database size={14}/> {source === 'FIREBASE' ? 'Firebase primary' : 'Sheets fallback'}</span><Link to="/workspace" className="admin-back"><ArrowLeft size={15}/> Workspace</Link></div>
    </header>

    <main className="admin-content">
      <section className="admin-hero"><div><p>System administration</p><h1>Control access, people and platform settings.</h1><span>Centralized governance for Credlock support operations.</span></div><div className="admin-status"><Activity size={16}/><div><strong>Control plane</strong><small>{firebaseConfigured ? 'Firebase authentication available' : 'Google Sheets mode'}</small></div></div></section>

      {!token && <section className="admin-auth"><div className="auth-copy"><LockKeyhole size={22}/><div><h2>Administrator sign-in</h2><p>Use Firebase Authentication before managing protected administrative resources.</p></div></div><form onSubmit={signIn}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" autoComplete="username" required/><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoComplete="current-password" required/><button type="submit"><KeyRound size={15}/> Sign in</button></form></section>}

      <section className="admin-layout">
        <aside className="admin-nav">{tabs.map((item) => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setQuery('') }}><Icon size={17}/><span>{item.label}<small>{item.description}</small></span></button> })}</aside>
        <section className="admin-panel"><div className="admin-panel-head"><div><p>Administration / {active.label}</p><h2>{active.label}</h2><span>{active.description}</span></div><button className="admin-refresh" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/> Refresh</button></div><div className="admin-tools"><label><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${active.label.toLowerCase()}...`}/></label><span>{filtered.length} records</span></div>{error && <div className="admin-error">{error}</div>}<div className="admin-table-wrap"><table><thead><tr><th>Record</th><th>Name / Title</th><th>Role / Status</th><th>Department</th><th>Identifier</th></tr></thead><tbody>{filtered.slice(0, 200).map((record, index) => <tr key={String(record.id || record['Record ID'] || index)}><td><code>{String(record.id || record['Record ID'] || '—')}</code></td><td><strong>{String(record.Name || record['Full Name'] || record.Title || record['Issue Title'] || 'Untitled')}</strong></td><td><span className="admin-pill">{String(record.Role || record.Status || record['Account Status'] || '—')}</span></td><td>{String(record.Department || '—')}</td><td>{String(record.Email || record['Email Address'] || record['User ID'] || '—')}</td></tr>)}{!loading && filtered.length === 0 && <tr><td colSpan={5} className="empty">No records found.</td></tr>}</tbody></table></div></section>
      </section>
    </main>
  </div>
}

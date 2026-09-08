import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Activity, ArrowLeft, Database, RefreshCw, Search, ServerCog, ShieldCheck, Users, UserCog, Building2, SlidersHorizontal, FileClock, LogOut } from 'lucide-react'
import { useFirebaseAuth, signOutUser } from '../lib/auth'
import { getPrimary, listPrimary, type DataSource } from '../lib/dataLayer'
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
  const { user, loading: authLoading } = useFirebaseAuth()
  const [profile, setProfile] = useState<ApiRecord | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [tab, setTab] = useState('users')
  const [records, setRecords] = useState<ApiRecord[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const source: DataSource = 'GOOGLE_SHEETS'
  const active = tabs.find(item => item.id === tab) || tabs[0]

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      if (!user) { setProfile(null); setProfileLoading(false); return }
      setProfileLoading(true)
      try {
        const users = await listPrimary('Users', 2000)
        const next = users.find(item => String(item.Email || '').trim().toLowerCase() === String(user.email || '').trim().toLowerCase()) || null
        if (!cancelled) setProfile(next)
      } catch {
        if (!cancelled) setProfile(null)
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    }
    void loadProfile()
    return () => { cancelled = true }
  }, [user?.email])

  const isAdmin = String(profile?.Role || profile?.role || '').toUpperCase() === 'ADMIN'

  const load = async () => {
    if (!user || !isAdmin) return
    setLoading(true); setError('')
    try { setRecords(await listPrimary(active.collection, 1000)) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load administration data.') }
    finally { setLoading(false) }
  }

  useEffect(() => { if (isAdmin) void load() }, [active.collection, user?.email, isAdmin])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return term ? records.filter(record => Object.values(record).some(value => String(value ?? '').toLowerCase().includes(term))) : records
  }, [records, query])

  if (authLoading || profileLoading) return <div className="admin-page"><main className="admin-content"><section className="admin-hero"><div><p>System administration</p><h1>Loading control center…</h1></div></section></main></div>
  if (!user) return <div className="admin-page"><main className="admin-content"><section className="admin-auth"><h2>Authentication required</h2><p>Sign in from the main Credlock Support screen before opening administration.</p><Link to="/" className="admin-back"><ArrowLeft size={15}/> Back to workspace</Link></section></main></div>
  if (!isAdmin) return <div className="admin-page"><main className="admin-content"><section className="admin-auth"><h2>Administrator access required</h2><p>Your staff account is authenticated, but it is not provisioned with the ADMIN role required for this control center.</p><div className="admin-top-actions"><span className="admin-user">{user.email || user.uid}</span><button className="admin-back" onClick={() => void signOutUser()}><LogOut size={15}/> Sign out</button><Link to="/" className="admin-back"><ArrowLeft size={15}/> Workspace</Link></div></section></main></div>

  return <div className="admin-page">
    <header className="admin-topbar"><div className="admin-brand"><div className="admin-mark"><ServerCog size={20}/></div><div><span>Credlock</span><strong>Admin Control Center</strong></div></div><div className="admin-top-actions"><span className="admin-source primary"><Database size={14}/> {source === 'GOOGLE_SHEETS' ? 'Google Sheets primary' : 'Backend unavailable'}</span><span className="admin-user">{user.email || user.uid}</span><button className="admin-back" onClick={() => void signOutUser()}><LogOut size={15}/> Sign out</button><Link to="/" className="admin-back"><ArrowLeft size={15}/> Workspace</Link></div></header>
    <main className="admin-content">
      <section className="admin-hero"><div><p>System administration</p><h1>Control access, people and platform settings.</h1><span>Google Apps Script + Google Sheets are now the application data backend.</span></div><div className="admin-status"><Activity size={16}/><div><strong>Control plane</strong><small>Authenticated administrator session</small></div></div></section>
      <section className="admin-layout">
        <aside className="admin-nav">{tabs.map(item => { const Icon=item.icon; return <button key={item.id} className={tab===item.id?'active':''} onClick={()=>{setTab(item.id);setQuery('')}}><Icon size={17}/><span>{item.label}<small>{item.description}</small></span></button> })}</aside>
        <section className="admin-panel"><div className="admin-panel-head"><div><p>Administration / {active.label}</p><h2>{active.label}</h2><span>{active.description}</span></div><button className="admin-refresh" onClick={()=>void load()} disabled={loading}><RefreshCw size={15} className={loading?'spin':''}/> Refresh</button></div><div className="admin-tools"><label><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${active.label.toLowerCase()}...`}/></label><span>{filtered.length} records</span></div>{error&&<div className="admin-error">{error}</div>}<div className="admin-table-wrap"><table><thead><tr><th>Record</th><th>Name / Title</th><th>Role / Status</th><th>Department</th><th>Identifier</th></tr></thead><tbody>{filtered.slice(0,200).map((record,index)=><tr key={String(record.id||record['Record ID']||index)}><td><code>{String(record.id||record['Record ID']||'—')}</code></td><td><strong>{String(record.Name||record['Full Name']||record.Title||record['Issue Title']||record['Issue Title']||'Untitled')}</strong></td><td><span className="admin-pill">{String(record.Role||record.Status||record['Account Status']||'—')}</span></td><td>{String(record.Department||'—')}</td><td>{String(record.Email||record['Email Address']||record['User ID']||'—')}</td></tr>)}{!loading&&filtered.length===0&&<tr><td colSpan={5} className="empty">No records found.</td></tr>}</tbody></table></div></section>
      </section>
    </main>
  </div>
}

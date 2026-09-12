import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { FormEvent, type ReactNode, useState } from 'react'
import { LogOut, ShieldCheck } from 'lucide-react'
import { authErrorMessage, signIn, signOutUser, useSupportAuth } from '../lib/auth'
import '../styles.css'
import '../auth.css'
import '../session-bar.css'
import '../ui-overrides.css'

export const Route = createRootRoute({
  head: () => ({ meta: [
    { charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#0b1220' }, { title: 'Credlock Support — Technical Operations' },
    { name: 'description', content: 'Credlock Technical Support ticketing, SLA management, device support, BNPL operations, recovery, reporting and team operations.' },
  ], links: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700;800&display=swap' },
  ] }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) { return <html lang="en"><head><HeadContent /></head><body><AuthGate>{children}</AuthGate><Scripts /></body></html> }

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useSupportAuth()
  if (loading) return <div className="credlock-login-loading">Loading Credlock Support…</div>
  if (!user) return <LoginScreen />
  return <><div className="credlock-session-bar"><div><strong>{String(user.Email || 'Authorized user')}</strong><span>{String(user.Role || 'STAFF')} · {String(user.Department || 'Technical Support')}</span></div><button type="button" onClick={() => void handleLogout()} title="Sign out"><LogOut size={15}/> Logout</button></div>{children}</>
}

async function handleLogout() { await signOutUser(); window.location.reload() }

function LoginScreen() {
  const [email, setEmail] = useState(''); const [passcode, setPasscode] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('')
    if (!/^\d{4}$/.test(passcode)) { setError('Passcode must be exactly 4 digits.'); return }
    setBusy(true)
    try { await signIn(email, passcode); window.location.reload() } catch (err) { setError(authErrorMessage(err)) } finally { setBusy(false) }
  }
  return <main className="credlock-login-shell">
    <section className="credlock-login-card" aria-label="Credlock Support sign in">
      <div className="credlock-login-brand"><div className="credlock-login-mark">C</div><div><h1>Credlock Support</h1><p>Technical Operations Centre</p></div></div>
      <h2>Welcome back.</h2><p>Enter your work email and 4-digit passcode to access the support workspace.</p>
      {error && <div className="credlock-login-error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="credlock-login-field"><label htmlFor="credlock-email">WORK EMAIL</label><input id="credlock-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder="you@credlock.com" required /></div>
        <div className="credlock-login-field"><label htmlFor="credlock-passcode">4-DIGIT PASSCODE</label><div className="credlock-passcode-wrap"><ShieldCheck size={18} aria-hidden="true" /><input id="credlock-passcode" type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4} minLength={4} value={passcode} onChange={e=>setPasscode(e.target.value.replace(/\D/g, '').slice(0,4))} autoComplete="one-time-code" placeholder="••••" aria-describedby="passcode-hint" required /></div><small id="passcode-hint">Enter exactly 4 digits.</small></div>
        <button className="credlock-login-button" type="submit" disabled={busy}>{busy ? 'Verifying…' : 'Access Support Centre  →'}</button>
      </form>
      <div className="credlock-login-footer">Restricted workspace · Authorized Credlock personnel only</div>
    </section>
  </main>
}
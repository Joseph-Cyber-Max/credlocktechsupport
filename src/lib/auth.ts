import { useEffect, useState } from 'react'
import { clearSessionToken, getSession, login as apiLogin, logout as apiLogout, type ApiRecord } from './api'

export type SupportUser = ApiRecord & { Email?: string; Role?: string; Status?: string; Department?: string }

export function useSupportAuth() {
  const [user, setUser] = useState<SupportUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void getSession().then(session => {
      if (!active) return
      setUser(session.authenticated ? (session.user as SupportUser | null) : null)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return { user, loading }
}

export async function signIn(email: string, password: string) {
  const result = await apiLogin(email, password)
  return result.user
}

export async function signOutUser() {
  await apiLogout()
}

export function getCurrentUser() {
  return null
}

export function authErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to sign in.'
}

export function subscribeToAuth(callback: (user: SupportUser | null) => void) {
  let cancelled = false
  void getSession().then(session => { if (!cancelled) callback(session.authenticated ? session.user as SupportUser : null) })
  return () => { cancelled = true }
}

export { clearSessionToken }

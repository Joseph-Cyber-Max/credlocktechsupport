import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { firebaseAuth } from './firebase'

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(firebaseAuth.currentUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  return { user, loading }
}

export async function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
}

export async function signOutUser() {
  await signOut(firebaseAuth)
}

export function authErrorMessage(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? String((error as { code?: unknown }).code) : ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.'
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.'
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact an administrator.'
    default:
      return error instanceof Error ? error.message : 'Unable to sign in.'
  }
}

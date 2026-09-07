import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { firebaseAuth } from './firebase'

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback)
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email.trim(), password)
}

export function createAccount(email: string, password: string) {
  return createUserWithEmailAndPassword(firebaseAuth, email.trim(), password)
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(firebaseAuth, email.trim())
}

export function signOutUser() {
  return signOut(firebaseAuth)
}

export function getCurrentUser() {
  return firebaseAuth.currentUser
}

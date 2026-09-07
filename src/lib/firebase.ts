import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
} from 'firebase/app'
import {
  getAuth,
  initializeAuth,
  indexedDBLocalPersistence,
  type Auth,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Browser-safe Firebase configuration. Values can be supplied at deploy time;
// the existing Credlock project values remain the development fallback.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD44rLEm-i8-VLabaQTRD1c9ok8zxypCvw',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'credlock-technical-support.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'credlock-technical-support',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'credlock-technical-support.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '69083322876',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:69083322876:web:bb3b9bca8c206b5572ba79',
}

export const firebaseApp: FirebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig)

// TanStack Start prerenders the SPA shell during the build. Firebase Auth's
// default getAuth() setup assumes a browser, so use explicit dependencies for
// server-side evaluation and normal browser persistence for the real client.
export const firebaseAuth: Auth = (() => {
  if (typeof window === 'undefined') {
    return initializeAuth(firebaseApp, { persistence: [] })
  }

  try {
    return initializeAuth(firebaseApp, { persistence: [indexedDBLocalPersistence] })
  } catch {
    return getAuth(firebaseApp)
  }
})()

export const firestore = getFirestore(firebaseApp)
export const firebaseProjectId = firebaseConfig.projectId

export default firebaseApp

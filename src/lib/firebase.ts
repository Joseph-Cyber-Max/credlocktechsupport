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

// Firebase Web configuration is safe to ship to the browser. Security is enforced
// by Firebase Authentication and Firestore Security Rules, not by hiding this config.
const firebaseConfig = {
  apiKey: 'AIzaSyD44rLEm-i8-VLabaQTRD1c9ok8zxypCvw',
  authDomain: 'credlock-technical-support.firebaseapp.com',
  projectId: 'credlock-technical-support',
  storageBucket: 'credlock-technical-support.firebasestorage.app',
  messagingSenderId: '69083322876',
  appId: '1:69083322876:web:bb3b9bca8c206b5572ba79',
}

export const firebaseApp: FirebaseApp = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig)

// TanStack Start prerenders the SPA shell during the build. Firebase Auth's
// default getAuth() setup assumes a browser, so use explicit dependencies for
// server-side evaluation and normal browser persistence for the real client.
export const firebaseAuth: Auth = (() => {
  try {
    if (typeof window === 'undefined') {
      return initializeAuth(firebaseApp, { persistence: [] })
    }
    return getAuth(firebaseApp)
  } catch {
    return getAuth(firebaseApp)
  }
})()

export const firestore = getFirestore(firebaseApp)
export const firebaseProjectId = firebaseConfig.projectId

export default firebaseApp

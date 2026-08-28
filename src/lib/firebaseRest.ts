export type FirebaseRecord = Record<string, unknown>

type AuthResponse = { idToken: string; refreshToken: string; localId: string; expiresIn: string }

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined
const databaseUrl = (import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined)?.replace(/\/$/, '')

export const firebaseConfigured = Boolean(apiKey && databaseUrl)

function requireConfig() {
  if (!apiKey || !databaseUrl) throw new Error('Firebase is not configured. Add VITE_FIREBASE_API_KEY and VITE_FIREBASE_DATABASE_URL in Netlify.')
  return { apiKey, databaseUrl }
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, cache: 'no-store' })
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } }
  if (!response.ok || data.error) throw new Error(data.error?.message || `Firebase request failed (${response.status})`)
  return data
}

export async function firebaseSignIn(email: string, password: string) {
  const { apiKey: key } = requireConfig()
  return jsonRequest<AuthResponse>(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
}

export async function firebaseGet<T extends FirebaseRecord = FirebaseRecord>(path: string, idToken?: string) {
  const { databaseUrl: base } = requireConfig()
  const auth = idToken ? `?auth=${encodeURIComponent(idToken)}` : ''
  return jsonRequest<T | null>(`${base}/${path.replace(/^\//, '')}.json${auth}`)
}

export async function firebaseSet(path: string, value: FirebaseRecord, idToken: string) {
  const { databaseUrl: base } = requireConfig()
  return jsonRequest<FirebaseRecord>(`${base}/${path.replace(/^\//, '')}.json?auth=${encodeURIComponent(idToken)}`, { method: 'PUT', body: JSON.stringify(value) })
}

export async function firebasePatch(path: string, value: FirebaseRecord, idToken: string) {
  const { databaseUrl: base } = requireConfig()
  return jsonRequest<FirebaseRecord>(`${base}/${path.replace(/^\//, '')}.json?auth=${encodeURIComponent(idToken)}`, { method: 'PATCH', body: JSON.stringify(value) })
}

export async function firebasePush(path: string, value: FirebaseRecord, idToken: string) {
  const { databaseUrl: base } = requireConfig()
  return jsonRequest<FirebaseRecord & { name: string }>(`${base}/${path.replace(/^\//, '')}.json?auth=${encodeURIComponent(idToken)}`, { method: 'POST', body: JSON.stringify(value) })
}

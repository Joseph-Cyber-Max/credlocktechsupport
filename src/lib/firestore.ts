import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { firestore } from './firebase'

export type FirestoreRecord = Record<string, unknown>

function collectionRef(table: string) {
  return collection(firestore, table)
}

function cleanRecord(record: FirestoreRecord) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  )
}

/** Read records from a Firestore collection. */
export async function listFirestoreRecords(table: string, max = 500) {
  const constraints: QueryConstraint[] = [firestoreLimit(Math.min(Math.max(max, 1), 2000))]
  if (table === 'Issues') constraints.unshift(orderBy('Date Created', 'desc'))

  try {
    const snapshot = await getDocs(query(collectionRef(table), ...constraints))
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  } catch (error) {
    // If a legacy collection has no Date Created index/field, fall back to an
    // unordered read rather than making the entire module unusable.
    if (table === 'Issues') {
      const snapshot = await getDocs(query(collectionRef(table), firestoreLimit(Math.min(Math.max(max, 1), 2000))))
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
    }
    throw error
  }
}

export async function getFirestoreRecord(table: string, id: string) {
  const snapshot = await getDoc(doc(firestore, table, id))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function createFirestoreRecord(table: string, record: FirestoreRecord) {
  const data = cleanRecord({
    ...record,
    createdAt: record.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  const reference = await addDoc(collectionRef(table), data)
  return { id: reference.id, ...record }
}

export async function setFirestoreRecord(table: string, id: string, record: FirestoreRecord) {
  const data = cleanRecord({ ...record, updatedAt: serverTimestamp() })
  await setDoc(doc(firestore, table, id), data, { merge: true })
  return getFirestoreRecord(table, id)
}

export async function updateFirestoreRecord(table: string, id: string, record: FirestoreRecord) {
  const data = cleanRecord({ ...record, updatedAt: serverTimestamp() })
  await updateDoc(doc(firestore, table, id), data)
  return getFirestoreRecord(table, id)
}

export async function deleteFirestoreRecord(table: string, id: string) {
  await deleteDoc(doc(firestore, table, id))
  return true
}

export function isFirestoreRecord(value: unknown): value is DocumentData {
  return typeof value === 'object' && value !== null
}

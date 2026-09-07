import { createFirestoreRecord, deleteFirestoreRecord, getFirestoreRecord, listFirestoreRecords, updateFirestoreRecord } from './firestore'
import { createRecord, listRecords, updateRecord, type ApiRecord } from './api'

export type DataSource = 'FIREBASE' | 'GOOGLE_SHEETS'

export function primarySource(): DataSource { return 'FIREBASE' }

export async function listPrimary(collection: string, limit = 500): Promise<ApiRecord[]> {
  try { return await listFirestoreRecords(collection, limit) as ApiRecord[] }
  catch { const result = await listRecords(collection, limit); return result.records }
}

export async function createPrimary(collection: string, record: ApiRecord): Promise<ApiRecord> {
  try { return await createFirestoreRecord(collection, record) as ApiRecord }
  catch { const result = await createRecord(collection, record); return result.record }
}

export async function updatePrimary(collection: string, id: string, record: ApiRecord): Promise<ApiRecord> {
  try { return await updateFirestoreRecord(collection, id, record) as ApiRecord }
  catch { const result = await updateRecord(collection, id, record); return result.record }
}

export async function replacePrimary(collection: string, id: string, record: ApiRecord): Promise<ApiRecord> {
  try { return await updateFirestoreRecord(collection, id, record) as ApiRecord }
  catch { const result = await updateRecord(collection, id, record); return result.record }
}

export async function deletePrimary(collection: string, id: string) {
  try { await deleteFirestoreRecord(collection, id); return true }
  catch { return false }
}

export async function getPrimary(collection: string, id: string) {
  try { return await getFirestoreRecord(collection, id) as ApiRecord | null }
  catch { return null }
}

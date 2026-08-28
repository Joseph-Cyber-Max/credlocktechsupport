import { firebaseConfigured, firebaseGet, firebasePatch, firebasePush, firebaseSet } from './firebaseRest'
import { createRecord, listRecords, updateRecord, type ApiRecord } from './api'

export type DataSource = 'FIREBASE' | 'GOOGLE_SHEETS'

export function primarySource(): DataSource {
  return firebaseConfigured ? 'FIREBASE' : 'GOOGLE_SHEETS'
}

export async function listPrimary(collection: string, limit = 500, idToken?: string): Promise<ApiRecord[]> {
  if (firebaseConfigured && idToken) {
    const value = await firebaseGet<Record<string, ApiRecord>>(collection, idToken)
    return Object.entries(value || {}).slice(0, limit).map(([id, record]) => ({ id, ...record }))
  }
  const result = await listRecords(collection, limit)
  return result.records
}

export async function createPrimary(collection: string, record: ApiRecord, idToken?: string): Promise<ApiRecord> {
  if (firebaseConfigured && idToken) return firebasePush(collection, record, idToken)
  const result = await createRecord(collection, record)
  return result.record
}

export async function updatePrimary(collection: string, id: string, record: ApiRecord, idToken?: string): Promise<ApiRecord> {
  if (firebaseConfigured && idToken) return firebasePatch(`${collection}/${id}`, record, idToken)
  const result = await updateRecord(collection, id, record)
  return result.record
}

export async function replacePrimary(collection: string, id: string, record: ApiRecord, idToken: string): Promise<ApiRecord> {
  if (!firebaseConfigured) return updatePrimary(collection, id, record)
  return firebaseSet(`${collection}/${id}`, record, idToken)
}

import { createRecord, deleteRecord, getRecord, listRecords, updateRecord, type ApiRecord } from './api'

export type DataSource = 'GOOGLE_SHEETS'

export function primarySource(): DataSource { return 'GOOGLE_SHEETS' }

export async function listPrimary(collection: string, limit = 500): Promise<ApiRecord[]> {
  const result = await listRecords(collection, limit)
  return result.records
}

export async function createPrimary(collection: string, record: ApiRecord): Promise<ApiRecord> {
  const result = await createRecord(collection, record)
  return result.record
}

export async function updatePrimary(collection: string, id: string, record: ApiRecord): Promise<ApiRecord> {
  const result = await updateRecord(collection, id, record)
  return result.record
}

export async function replacePrimary(collection: string, id: string, record: ApiRecord): Promise<ApiRecord> {
  const result = await updateRecord(collection, id, record)
  return result.record
}

export async function deletePrimary(collection: string, id: string) {
  const result = await deleteRecord(collection, id)
  return result.deleted
}

export async function getPrimary(collection: string, id: string) {
  const result = await getRecord(collection, id)
  return result.record
}

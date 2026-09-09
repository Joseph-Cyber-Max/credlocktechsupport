import {
  createRecord,
  getRecord,
  getTickets,
  listRecords,
  ticketAction,
  updateRecord,
  uploadAttachment,
  type ApiRecord,
  type TicketAction,
} from './api'

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'REOPENED' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export type Ticket = ApiRecord & {
  'Record ID': string
  'Ticket ID'?: string
  Status?: TicketStatus
  Priority?: TicketPriority
  'Assigned Officer'?: string
}

export type TicketFilters = {
  query?: string
  status?: TicketStatus | 'ALL'
  priority?: TicketPriority | 'ALL'
  category?: string
  officer?: string
  department?: string
  source?: string
}

const OPEN_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'PENDING', 'REOPENED']

export async function fetchTicketQueue(limit = 2000) {
  return getTickets(limit)
}

export async function fetchTicket(id: string) {
  const result = await getRecord('Issues', id)
  return result.record as Ticket | null
}

export async function createTicket(input: ApiRecord) {
  return createRecord('Issues', {
    ...input,
    Status: input.Status || 'OPEN',
    'Subject Type': input['Subject Type'] || 'Customer',
    Source: input.Source || 'Web Portal',
  })
}

export async function updateTicket(id: string, changes: ApiRecord) {
  return updateRecord('Issues', id, changes)
}

export async function runTicketAction(id: string, action: TicketAction, payload: ApiRecord = {}) {
  return ticketAction(id, action, payload)
}

export async function assignTicket(id: string, officer: string, reason = '') {
  return runTicketAction(id, 'assign', { officer, reason })
}

export async function respondToTicket(id: string, message: string) {
  return runTicketAction(id, 'respond', { message, firstResponseTime: new Date().toISOString() })
}

export async function setTicketPending(id: string, reason: string) {
  return runTicketAction(id, 'pending', { reason })
}

export async function resolveTicket(id: string, resolutionNotes: string, rootCause = '') {
  return runTicketAction(id, 'resolve', { resolutionNotes, rootCause, notes: resolutionNotes })
}

export async function closeTicket(id: string, reason = '') {
  return runTicketAction(id, 'close', { reason })
}

export async function reopenTicket(id: string, reason: string) {
  return runTicketAction(id, 'reopen', { reason })
}

export async function escalateTicket(id: string, level: string, reason: string) {
  return runTicketAction(id, 'escalate', { level, reason })
}

export function filterTickets(tickets: Ticket[], filters: TicketFilters) {
  const query = String(filters.query || '').trim().toLowerCase()
  return tickets.filter(ticket => {
    const status = String(ticket.Status || '').toUpperCase()
    const priority = String(ticket.Priority || '').toUpperCase()
    const matchesQuery = !query || Object.values(ticket).some(value => String(value ?? '').toLowerCase().includes(query))
    const matchesStatus = !filters.status || filters.status === 'ALL' || status === filters.status
    const matchesPriority = !filters.priority || filters.priority === 'ALL' || priority === filters.priority
    const matchesCategory = !filters.category || String(ticket.Category || '') === filters.category
    const matchesOfficer = !filters.officer || String(ticket['Assigned Officer'] || '') === filters.officer
    const matchesDepartment = !filters.department || String(ticket.Department || '') === filters.department
    const matchesSource = !filters.source || String(ticket.Source || '') === filters.source
    return matchesQuery && matchesStatus && matchesPriority && matchesCategory && matchesOfficer && matchesDepartment && matchesSource
  })
}

export function ticketAgeMinutes(ticket: Ticket, now = Date.now()) {
  const created = new Date(String(ticket['Date Created'] || '')).getTime()
  return created && !Number.isNaN(created) ? Math.max(0, (now - created) / 60000) : 0
}

export function isOpenTicket(ticket: Ticket) {
  return OPEN_STATUSES.includes(String(ticket.Status || '').toUpperCase() as TicketStatus)
}

export function isSlaAtRisk(ticket: Ticket, threshold = 0.8, now = Date.now()) {
  const target = Number(ticket['SLA Target (Minutes)'] || 0)
  if (!target || !isOpenTicket(ticket)) return false
  return ticketAgeMinutes(ticket, now) >= target * threshold
}

export function isSlaBreached(ticket: Ticket, now = Date.now()) {
  const target = Number(ticket['SLA Target (Minutes)'] || 0)
  if (!target || !isOpenTicket(ticket)) return false
  return ticketAgeMinutes(ticket, now) > target
}

export function queueSummary(tickets: Ticket[]) {
  return tickets.reduce((summary, ticket) => {
    const status = String(ticket.Status || '').toUpperCase()
    const priority = String(ticket.Priority || '').toUpperCase()
    if (OPEN_STATUSES.includes(status as TicketStatus)) summary.open += 1
    if (status === 'PENDING') summary.pending += 1
    if (status === 'IN_PROGRESS') summary.inProgress += 1
    if (status === 'REOPENED') summary.reopened += 1
    if (priority === 'CRITICAL' && OPEN_STATUSES.includes(status as TicketStatus)) summary.critical += 1
    if (isSlaAtRisk(ticket)) summary.atRisk += 1
    if (isSlaBreached(ticket)) summary.breached += 1
    return summary
  }, { open: 0, pending: 0, inProgress: 0, reopened: 0, critical: 0, atRisk: 0, breached: 0 })
}

export async function fetchOfficers() {
  const result = await listRecords('Officers', 1000)
  return result.records
}

export async function fetchCategories() {
  const result = await listRecords('Issue Categories', 1000)
  return result.records
}

export async function attachToTicket(file: File) {
  return uploadAttachment(file)
}

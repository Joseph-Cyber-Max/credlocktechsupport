import type { Ticket } from './ticketService'
import { isOpenTicket, isSlaAtRisk, isSlaBreached } from './ticketService'

export function sortTicketsByUrgency(tickets: Ticket[]) {
  const rank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
  return [...tickets].sort((a, b) => {
    const priority = (rank[String(b.Priority || '').toUpperCase()] || 0) - (rank[String(a.Priority || '').toUpperCase()] || 0)
    if (priority) return priority
    const sla = Number(isSlaBreached(b)) - Number(isSlaBreached(a))
    if (sla) return sla
    return String(b['Date Created'] || '').localeCompare(String(a['Date Created'] || ''))
  })
}

export function ticketsByOfficer(tickets: Ticket[]) {
  return tickets.filter(isOpenTicket).reduce<Record<string, number>>((out, ticket) => {
    const officer = String(ticket['Assigned Officer'] || 'Unassigned').trim() || 'Unassigned'
    out[officer] = (out[officer] || 0) + 1
    return out
  }, {})
}

export function ticketsByCategory(tickets: Ticket[]) {
  return tickets.reduce<Record<string, number>>((out, ticket) => {
    const category = String(ticket.Category || 'Uncategorized').trim() || 'Uncategorized'
    out[category] = (out[category] || 0) + 1
    return out
  }, {})
}

export function slaBuckets(tickets: Ticket[]) {
  return tickets.reduce((out, ticket) => {
    if (!isOpenTicket(ticket)) return out
    if (isSlaBreached(ticket)) out.breached += 1
    else if (isSlaAtRisk(ticket)) out.atRisk += 1
    else out.healthy += 1
    return out
  }, { healthy: 0, atRisk: 0, breached: 0 })
}

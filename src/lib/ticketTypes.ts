export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'PENDING', 'REOPENED', 'RESOLVED', 'CLOSED'] as const
export const TICKET_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const
export const ESCALATION_LEVELS = ['L1', 'L2', 'L3', 'MANAGEMENT'] as const
export const TICKET_CHANNELS = ['Web Portal', 'WhatsApp', 'Email', 'Phone', 'Walk-In', 'Merchant Support Portal', 'AI Assistant'] as const
export const SUBJECT_TYPES = ['Customer', 'Merchant'] as const

export type TicketStatus = typeof TICKET_STATUSES[number]
export type TicketPriority = typeof TICKET_PRIORITIES[number]
export type EscalationLevel = typeof ESCALATION_LEVELS[number]
export type TicketChannel = typeof TICKET_CHANNELS[number]
export type SubjectType = typeof SUBJECT_TYPES[number]

export interface TicketForm {
  'Issue Title': string
  Description: string
  Category: string
  Department: string
  'Reported By Email': string
  'Assigned Officer': string
  Priority: TicketPriority
  Status: TicketStatus
  'Customer Name': string
  'NIN Number': string
  'Contact Phone': string
  'Customer / Merchant Phone': string
  'Customer Device / IMEI': string
  'Customer Loan / Application Reference': string
  'Has Foneflex Loan': string
  'Foneflex Request Type': string
  'Subject Type': SubjectType
  Source: TicketChannel | string
  'Action Reason': string
  'Resolution Notes': string
  'Root Cause': string
  'Escalation Required': string
  'Escalation Level': EscalationLevel | string
}

export interface TicketEvent {
  timestamp: string
  action: string
  actor: string
  reason?: string
  severity?: string
  oldValue?: string
  newValue?: string
}

export interface TicketMetrics {
  slaTargetMinutes: number
  firstResponseMinutes: number
  resolutionMinutes: number
  ageMinutes: number
  slaPercent: number
  atRisk: boolean
  breached: boolean
}

import { getStore } from '@netlify/blobs'
import type { Config, Context } from '@netlify/functions'
import { desc, eq, or } from 'drizzle-orm'
import { db } from '../../db/index.js'
import { tickets, type ApprovalRecord, type AttachmentRecord } from '../../db/schema.js'

type TicketPayload = {
  title: string
  category: string
  priority?: string
  status?: string
  customerName: string
  customerPhone: string
  customerNin?: string
  customerBvn?: string
  merchantName?: string
  assignedOfficer?: string
  imeiValidationRequired?: boolean
  correctImei?: string
  incorrectImei?: string
  portalImei?: string
  deviceImei?: string
  validationResult?: string
  imeiReason?: string
  oldImei?: string
  newImei?: string
  deviceChangeReason?: string
  loanAmount?: string
  outstandingBalance?: string
  dueBalance?: string
  loanStatus?: string
  loanDate?: string
  dueDate?: string
  description: string
  stepsToReproduce?: string
  expectedResult?: string
  actualResult?: string
  troubleshooting?: string[]
  rootCause?: string
  resolution?: string
  escalatedTo?: string
  approvalTechnicalOfficer?: string
  approvalOperationsManager?: string
  approvalTechnicalManager?: string
  approvalDate?: string
  approvalRemarks?: string
}

const json = (value: unknown, status = 200) => Response.json(value, { status })

function clean(value?: string) {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function makeTicketNumber() {
  const date = new Date()
  const stamp = `${String(date.getUTCFullYear()).slice(-2)}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`
  return `OPS-${stamp}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
}

async function recommend(payload: TicketPayload) {
  const recommendations: string[] = []
  const phone = clean(payload.customerPhone)
  const imei = clean(payload.deviceImei) || clean(payload.portalImei) || clean(payload.newImei)

  if (payload.validationResult === 'Mismatch' || (payload.portalImei && payload.deviceImei && payload.portalImei !== payload.deviceImei)) {
    recommendations.push('IMEI mismatch detected — pause device actions until the portal and physical device records are reconciled.')
  }

  if (phone || imei) {
    const matches = await db
      .select({ ticketNumber: tickets.ticketNumber, category: tickets.category })
      .from(tickets)
      .where(
        or(
          phone ? eq(tickets.customerPhone, phone) : undefined,
          imei ? eq(tickets.deviceImei, imei) : undefined,
          imei ? eq(tickets.newImei, imei) : undefined,
        ),
      )
      .limit(3)

    if (matches.length > 0) {
      recommendations.push(`Similar history found in ${matches.map((match) => match.ticketNumber).join(', ')} — review before creating duplicate work.`)
    }
  }

  if (payload.category.includes('Payment')) {
    recommendations.push('Confirm transaction reference, amount, payment channel, and receipt before initiating a reversal or refund.')
  } else if (payload.category.includes('Device') || payload.category.includes('IMEI')) {
    recommendations.push('Verify IMEI, Android ID, connectivity, enrollment state, and the latest policy sync timestamp.')
  } else if (payload.category.includes('Loan') || payload.category.includes('Balance')) {
    recommendations.push('Reconcile the loan ledger, agreement, down payment, repayments, and current due balance.')
  } else {
    recommendations.push('Capture exact timestamps, affected user details, and reproducible steps before escalation.')
  }

  const priority = payload.priority || 'Medium'
  recommendations.push(
    priority === 'Critical'
      ? 'Priority recommendation: immediate technical triage with a 15-minute first response target.'
      : priority === 'High'
        ? 'SLA recommendation: acknowledge within 30 minutes and provide an owner within 1 hour.'
        : 'SLA recommendation: acknowledge within 2 hours and update the requester within 1 business day.',
  )

  return recommendations
}

async function getTickets() {
  const rows = await db.select().from(tickets).orderBy(desc(tickets.createdAt)).limit(100)
  const now = Date.now()
  const closed = rows.filter((ticket) => ['Resolved', 'Closed'].includes(ticket.status))
  const resolutionHours = closed
    .filter((ticket) => ticket.resolvedAt)
    .map((ticket) => (new Date(ticket.resolvedAt!).getTime() - new Date(ticket.createdAt).getTime()) / 3_600_000)
  const responseMinutes = rows.map((ticket) => ticket.firstResponseMinutes).filter((value): value is number => value !== null)
  const assignedTickets = rows.filter((ticket) => ticket.assignedOfficer)
  const merchantTickets = rows.filter((ticket) => ticket.merchantName)
  const categoryCounts = rows.reduce<Record<string, number>>((counts, ticket) => {
    counts[ticket.category] = (counts[ticket.category] || 0) + 1
    return counts
  }, {})
  const slaCompliant = rows.filter((ticket) => {
    const ageHours = (now - new Date(ticket.createdAt).getTime()) / 3_600_000
    const target = ticket.priority === 'Critical' ? 0.25 : ticket.priority === 'High' ? 1 : 4
    return ticket.firstResponseMinutes !== null ? ticket.firstResponseMinutes / 60 <= target : ageHours <= target
  }).length

  return {
    tickets: rows,
    metrics: {
      total: rows.length,
      open: rows.filter((ticket) => !['Resolved', 'Closed'].includes(ticket.status)).length,
      pending: rows.filter((ticket) => ticket.status === 'Pending').length,
      closed: closed.length,
      critical: rows.filter((ticket) => ticket.priority === 'Critical').length,
      slaCompliance: rows.length ? Math.round((slaCompliant / rows.length) * 100) : 100,
      imeiValidation: rows.filter((ticket) => ticket.imeiValidationRequired).length,
      deviceChanges: rows.filter((ticket) => ticket.category === 'Device Change').length,
      duplicatePayments: rows.filter((ticket) => ticket.category === 'Duplicate Payment').length,
      merchantIssues: rows.filter((ticket) => ticket.category.includes('Merchant')).length,
      customerIssues: rows.filter((ticket) => ticket.category.includes('Customer')).length,
      loanIssues: rows.filter((ticket) => ticket.category.includes('Loan') || ticket.category.includes('Balance')).length,
      technicalIssues: rows.filter((ticket) => ['App Crash', 'Sync Error', 'API Error', 'Server Error', 'Report Bug'].includes(ticket.category)).length,
      resolutionTime: resolutionHours.length ? Math.round(resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length) : 0,
      firstResponseTime: responseMinutes.length ? Math.round(responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length) : 0,
      officerPerformance: rows.length ? Math.round((assignedTickets.length / rows.length) * 100) : 100,
      merchantPerformance: merchantTickets.length ? Math.round((merchantTickets.filter((ticket) => ['Resolved', 'Closed'].includes(ticket.status)).length / merchantTickets.length) * 100) : 100,
      recurringIssues: Object.values(categoryCounts).filter((count) => count > 1).length,
      aiInsights: rows.filter((ticket) => ticket.aiRecommendations.length > 0).length,
    },
  }
}

async function createTicket(req: Request) {
  const formData = await req.formData()
  const payloadRaw = formData.get('payload')
  if (typeof payloadRaw !== 'string') return json({ error: 'Ticket payload is required.' }, 400)

  const payload = JSON.parse(payloadRaw) as TicketPayload
  if (!payload.title?.trim() || !payload.category || !payload.customerName?.trim() || !payload.customerPhone?.trim() || !payload.description?.trim()) {
    return json({ error: 'Title, category, customer, phone number, and issue description are required.' }, 400)
  }

  const ticketNumber = makeTicketNumber()
  const attachmentRecords: AttachmentRecord[] = []
  const store = getStore('ticket-attachments')
  const files = formData.getAll('attachments').filter((item): item is File => item instanceof File && item.size > 0).slice(0, 8)

  for (const file of files) {
    if (file.size > 10 * 1024 * 1024) return json({ error: `${file.name} exceeds the 10 MB attachment limit.` }, 400)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const key = `${ticketNumber}/${crypto.randomUUID()}-${safeName}`
    await store.set(key, file)
    attachmentRecords.push({
      name: file.name,
      key,
      type: file.type || 'application/octet-stream',
      size: file.size,
      category: typeof formData.get('attachmentCategory') === 'string' ? String(formData.get('attachmentCategory')) : 'Other',
    })
  }

  const aiRecommendations = await recommend(payload)
  const approvalRoles = [
    ['Technical Support Officer', clean(payload.approvalTechnicalOfficer)],
    ['Operations Manager', clean(payload.approvalOperationsManager)],
    ['Technical Manager', clean(payload.approvalTechnicalManager)],
  ] as const
  const approvals: ApprovalRecord[] = approvalRoles.flatMap(([role, name]) => name ? [{
    role,
    name,
    date: clean(payload.approvalDate) || '',
    remarks: clean(payload.approvalRemarks) || '',
  }] : [])
  const [ticket] = await db
    .insert(tickets)
    .values({
      ticketNumber,
      title: payload.title.trim(),
      category: payload.category,
      priority: payload.priority || 'Medium',
      status: payload.status || 'Pending',
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      customerNin: clean(payload.customerNin),
      customerBvn: clean(payload.customerBvn),
      merchantName: clean(payload.merchantName),
      assignedOfficer: clean(payload.assignedOfficer),
      imeiValidationRequired: Boolean(payload.imeiValidationRequired),
      correctImei: clean(payload.correctImei),
      incorrectImei: clean(payload.incorrectImei),
      portalImei: clean(payload.portalImei),
      deviceImei: clean(payload.deviceImei),
      validationResult: clean(payload.validationResult),
      imeiReason: clean(payload.imeiReason),
      oldImei: clean(payload.oldImei),
      newImei: clean(payload.newImei),
      deviceChangeReason: clean(payload.deviceChangeReason),
      loanAmount: clean(payload.loanAmount),
      outstandingBalance: clean(payload.outstandingBalance),
      dueBalance: clean(payload.dueBalance),
      loanStatus: clean(payload.loanStatus),
      loanDate: clean(payload.loanDate),
      dueDate: clean(payload.dueDate),
      description: payload.description.trim(),
      stepsToReproduce: clean(payload.stepsToReproduce),
      expectedResult: clean(payload.expectedResult),
      actualResult: clean(payload.actualResult),
      troubleshooting: payload.troubleshooting || [],
      attachments: attachmentRecords,
      rootCause: clean(payload.rootCause),
      resolution: clean(payload.resolution),
      escalatedTo: clean(payload.escalatedTo),
      aiRecommendations,
      approvals,
    })
    .returning()

  return json({ ticket }, 201)
}

async function updateTicket(req: Request, id: number) {
  const payload = (await req.json()) as { status?: string; resolution?: string; rootCause?: string; escalatedTo?: string }
  const isResolved = payload.status && ['Resolved', 'Closed'].includes(payload.status)
  const [ticket] = await db
    .update(tickets)
    .set({
      status: payload.status,
      resolution: clean(payload.resolution),
      rootCause: clean(payload.rootCause),
      escalatedTo: clean(payload.escalatedTo),
      resolvedAt: isResolved ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, id))
    .returning()
  return ticket ? json({ ticket }) : json({ error: 'Ticket not found.' }, 404)
}

export default async function handler(req: Request, context: Context) {
  try {
    if (req.method === 'GET') return json(await getTickets())
    if (req.method === 'POST') return createTicket(req)
    if (req.method === 'PATCH' && context.params.id) return updateTicket(req, Number(context.params.id))
    return json({ error: 'Method not allowed.' }, 405)
  } catch (error) {
    console.error('Ticket API error', error instanceof Error ? error.message : 'Unknown error')
    return json({ error: 'The ticket service could not complete the request.' }, 500)
  }
}

export const config: Config = {
  path: ['/api/tickets', '/api/tickets/:id'],
}

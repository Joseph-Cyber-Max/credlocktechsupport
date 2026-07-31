import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export type AttachmentRecord = {
  name: string
  key: string
  type: string
  size: number
  category: string
}

export type ApprovalRecord = {
  role: string
  name: string
  date: string
  remarks: string
}

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  ticketNumber: text('ticket_number').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  priority: text('priority').notNull().default('Medium'),
  status: text('status').notNull().default('Pending'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerNin: text('customer_nin'),
  customerBvn: text('customer_bvn'),
  merchantName: text('merchant_name'),
  assignedOfficer: text('assigned_officer'),
  imeiValidationRequired: boolean('imei_validation_required').notNull().default(false),
  correctImei: text('correct_imei'),
  incorrectImei: text('incorrect_imei'),
  portalImei: text('portal_imei'),
  deviceImei: text('device_imei'),
  validationResult: text('validation_result'),
  imeiReason: text('imei_reason'),
  oldImei: text('old_imei'),
  newImei: text('new_imei'),
  deviceChangeReason: text('device_change_reason'),
  loanAmount: numeric('loan_amount', { precision: 14, scale: 2 }),
  outstandingBalance: numeric('outstanding_balance', { precision: 14, scale: 2 }),
  dueBalance: numeric('due_balance', { precision: 14, scale: 2 }),
  loanStatus: text('loan_status'),
  loanDate: date('loan_date'),
  dueDate: date('due_date'),
  description: text('description').notNull(),
  stepsToReproduce: text('steps_to_reproduce'),
  expectedResult: text('expected_result'),
  actualResult: text('actual_result'),
  troubleshooting: jsonb('troubleshooting').$type<string[]>().notNull().default([]),
  attachments: jsonb('attachments').$type<AttachmentRecord[]>().notNull().default([]),
  rootCause: text('root_cause'),
  resolution: text('resolution'),
  escalatedTo: text('escalated_to'),
  aiRecommendations: jsonb('ai_recommendations').$type<string[]>().notNull().default([]),
  approvals: jsonb('approvals').$type<ApprovalRecord[]>().notNull().default([]),
  firstResponseMinutes: integer('first_response_minutes'),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

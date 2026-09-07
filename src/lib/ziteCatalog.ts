/**
 * Canonical feature/data catalog imported from the Credlock Zite workspace.
 *
 * Zite workspace: CREDLOCK TECH. SUPPORT TRACKING SYSTEM
 * This catalog is intentionally schema-only: production user/customer records
 * must not be committed to this public repository. Runtime data belongs in
 * Firebase Firestore; Google Sheets remains the secondary reporting mirror.
 */
export const ZITE_WORKSPACE_ID = '87521331c6e88543'

export type FeatureArea =
  | 'identity'
  | 'ticketing'
  | 'operations'
  | 'knowledge'
  | 'performance'
  | 'workforce'
  | 'governance'
  | 'reporting'

export type ZiteCollection = {
  name: string
  feature: FeatureArea
  primaryKey: string
  recordCount: number
}

export const ZITE_COLLECTIONS: ZiteCollection[] = [
  { name: 'Users', feature: 'identity', primaryKey: 'Email', recordCount: 58 },
  { name: 'Zite Users', feature: 'identity', primaryKey: 'Name', recordCount: 67 },
  { name: 'Departments', feature: 'identity', primaryKey: 'Department Name', recordCount: 42 },
  { name: 'Officers', feature: 'identity', primaryKey: 'Officer Name', recordCount: 4 },
  { name: 'Page Permissions', feature: 'governance', primaryKey: 'Page Key', recordCount: 24 },
  { name: 'Issue Categories', feature: 'ticketing', primaryKey: 'Category Name', recordCount: 150 },
  { name: 'Issues', feature: 'ticketing', primaryKey: 'Issue Title', recordCount: 1570 },
  { name: 'Ticket Activity', feature: 'ticketing', primaryKey: 'Activity ID', recordCount: 0 },
  { name: 'Feedback', feature: 'ticketing', primaryKey: 'Feedback ID', recordCount: 641 },
  { name: 'SLA Policies', feature: 'ticketing', primaryKey: 'Policy Name', recordCount: 4 },
  { name: 'Incidents', feature: 'operations', primaryKey: 'Incident Title', recordCount: 47 },
  { name: 'Todo Items', feature: 'operations', primaryKey: 'Task', recordCount: 38 },
  { name: 'Internal Requests', feature: 'operations', primaryKey: 'Request Title', recordCount: 3 },
  { name: 'Recovery Records', feature: 'operations', primaryKey: 'Device Name', recordCount: 3 },
  { name: 'Recovery Tasks', feature: 'operations', primaryKey: 'Task Title', recordCount: 3 },
  { name: 'Knowledge Base', feature: 'knowledge', primaryKey: 'Article Title', recordCount: 10 },
  { name: 'Knowledge Base Articles', feature: 'knowledge', primaryKey: 'Title', recordCount: 7 },
  { name: 'Meetings', feature: 'governance', primaryKey: 'Meeting Title', recordCount: 3 },
  { name: 'Meeting Items', feature: 'governance', primaryKey: 'Topic', recordCount: 1 },
  { name: 'AuditLog', feature: 'governance', primaryKey: 'Action', recordCount: 160 },
  { name: 'Monthly Evaluations', feature: 'performance', primaryKey: 'Evaluation ID', recordCount: 3 },
  { name: 'Staff Schedules', feature: 'workforce', primaryKey: 'Schedule Title', recordCount: 381 },
  { name: 'Pending Questions', feature: 'knowledge', primaryKey: 'Question', recordCount: 0 },
  { name: 'Broadcasts', feature: 'governance', primaryKey: 'Title', recordCount: 0 },
  { name: 'KPI Targets', feature: 'performance', primaryKey: 'Target Name', recordCount: 3 },
  { name: 'Manual Reports', feature: 'reporting', primaryKey: 'Report Date', recordCount: 0 },
  { name: 'BNPL Applications', feature: 'operations', primaryKey: 'Application ID', recordCount: 0 },
  { name: 'Operational Blueprints', feature: 'operations', primaryKey: 'Blueprint', recordCount: 0 },
]

export const ZITE_FEATURES = [
  'Command Center and live ticket queue',
  'Ticket intake, assignment, SLA, escalation, resolution, closure and reopen',
  'Customer and merchant support',
  'Ticket activity and customer feedback',
  'Incident management and escalation',
  'Device recovery and recovery task management',
  'BNPL application operations',
  'Knowledge base and response templates',
  'Meetings and action items',
  'Internal staff requests',
  'Todo/task management',
  'Staff schedules and workforce planning',
  'Monthly staff evaluations and KPI scoring',
  'KPI targets and operational reporting',
  'Broadcasts and pending questions',
  'Page-level permissions and role governance',
  'Audit logging',
  'WhatsApp/omnichannel ticket linkage',
  'AI-assisted triage architecture',
] as const

export const ZITE_MIGRATION_POLICY = {
  source: 'ZITE',
  primaryBackend: 'FIRESTORE',
  secondaryBackend: 'GOOGLE_SHEETS',
  preserveOriginalIds: true,
  legacySourceField: 'legacySource',
  migrationTimestampField: 'migratedAt',
  attachmentsToFirebaseStorage: false,
} as const

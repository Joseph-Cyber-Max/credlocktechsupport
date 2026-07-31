export const ticketCategories = [
  'Reset',
  'App Crash',
  'App Installation',
  'Sync Error',
  'API Error',
  'Server Error',
  'Device Enrollment',
  'Device De-enrollment',
  'Device Change',
  'Device Replacement',
  'Device Locked',
  'Device Unlock',
  'IMEI Validation',
  'Duplicate IMEI',
  'Android ID Issue',
  'FDX Issue',
  'Knox Issue',
  'FieldX Issue',
  'Manager App Issue',
  'Policy Sync',
  'Remote Lock',
  'Remote Unlock',
  'Location Issue',
  'Fingerprint Issue',
  'Face Unlock Issue',
  'BNPL Operations',
  'Loan Creation',
  'Loan Approval',
  'Loan Rejection',
  'Customer Verification',
  'Merchant Verification',
  'Merchant Registration',
  'Merchant Wallet',
  'Merchant Commission',
  'Device Delivery',
  'Loan Agreement',
  'Down Payment',
  'Outstanding Balance',
  'Collections',
  'Repayment',
  'Duplicate Payment',
  'Wrong Payment',
  'Refund',
  'Payment Reversal',
  'Customer Issues',
  'Wrong Customer Details',
  'Wrong NIN',
  'Wrong BVN',
  'Wrong Address',
  'Wrong Phone Number',
  'Wrong Guarantor',
  'Customer Complaint',
  'Fraud Suspicion',
  'Feature Request',
  'General Inquiry',
  'Report Bug',
  'Suggestion',
  'Other',
] as const

export const troubleshootingOptions = [
  'Restarted Device',
  'Cleared Cache',
  'Reinstalled App',
  'Synced Policy',
  'Verified IMEI',
  'Verified Android ID',
  'Checked Server',
  'Checked Internet',
  'Contacted Merchant',
  'Contacted Customer',
  'Other',
]

export const statusOptions = [
  'Pending',
  'Under Investigation',
  'Waiting for Merchant',
  'Waiting for Customer',
  'Escalated',
  'Resolved',
  'Closed',
]

export const escalationOptions = [
  'Technical Team',
  'Operations',
  'Development Team',
  'Product Team',
  'Compliance',
  'Collections',
  'Management',
]

export const rootCauseOptions = [
  'Human Error',
  'System Bug',
  'Server Error',
  'Network',
  'Merchant Error',
  'Customer Error',
  'Device Issue',
  'Fraud',
  'Unknown',
]

export const attachmentTypes = [
  'Screenshot',
  'Screen Recording',
  'Error Log',
  'Loan Agreement',
  'Customer Picture',
  'Device Picture',
  'IMEI Screenshot',
  'Payment Receipt',
  'Video',
]

export type Ticket = {
  id: number
  ticketNumber: string
  title: string
  category: string
  priority: string
  status: string
  customerName: string
  customerPhone: string
  merchantName?: string | null
  assignedOfficer?: string | null
  validationResult?: string | null
  description: string
  aiRecommendations: string[]
  createdAt: string
}

export type Metrics = {
  total: number
  open: number
  pending: number
  closed: number
  critical: number
  slaCompliance: number
  imeiValidation: number
  deviceChanges: number
  duplicatePayments: number
  merchantIssues: number
  customerIssues: number
  loanIssues: number
  technicalIssues: number
  resolutionTime: number
  firstResponseTime: number
  officerPerformance: number
  merchantPerformance: number
  recurringIssues: number
  aiInsights: number
}

export const emptyMetrics: Metrics = {
  total: 0,
  open: 0,
  pending: 0,
  closed: 0,
  critical: 0,
  slaCompliance: 100,
  imeiValidation: 0,
  deviceChanges: 0,
  duplicatePayments: 0,
  merchantIssues: 0,
  customerIssues: 0,
  loanIssues: 0,
  technicalIssues: 0,
  resolutionTime: 0,
  firstResponseTime: 0,
  officerPerformance: 100,
  merchantPerformance: 100,
  recurringIssues: 0,
  aiInsights: 0,
}

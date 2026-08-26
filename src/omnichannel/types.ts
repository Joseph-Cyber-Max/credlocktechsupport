export type ConversationChannel = 'WHATSAPP' | 'WEB' | 'EMAIL' | 'PHONE' | 'OTHER'
export type ConversationStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED'
export type MessageDirection = 'INBOUND' | 'OUTBOUND'
export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'LOCATION' | 'CONTACT' | 'INTERACTIVE' | 'SYSTEM'

export interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  channel: ConversationChannel
  tags?: string[]
}

export interface Message {
  id: string
  conversationId: string
  direction: MessageDirection
  type: MessageType
  body?: string
  mediaUrl?: string
  timestamp: string
  status?: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  senderName?: string
}

export interface Conversation {
  id: string
  channel: ConversationChannel
  contactId: string
  status: ConversationStatus
  subject?: string
  ticketId?: string
  assignedOfficer?: string
  unreadCount: number
  lastMessageAt?: string
  aiTicketCreated?: boolean
}

export interface AiClassification {
  ticketRequired: boolean
  confidence: number
  summary: string
  category?: string
  department?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  sentiment?: 'POSITIVE' | 'NEUTRAL' | 'FRUSTRATED' | 'ANGRY'
  suggestedAction?: string
}

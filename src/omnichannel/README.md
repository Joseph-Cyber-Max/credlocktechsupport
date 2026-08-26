# Credlock Omnichannel Support

This module defines the production architecture for WhatsApp + AI + ticketing.

## Components
- Conversation inbox and unified threads
- WhatsApp Cloud API adapter boundary
- Webhook verification/event ingestion boundary
- Contacts, conversations, messages, media, templates and delivery states
- Ticket linking and automatic ticket creation
- AI classification, summarization, priority/category/department suggestions
- Officer notes, assignment, tags and escalation
- Audit trail and idempotent webhook processing

## Security
WhatsApp access tokens and OpenAI API keys must never be placed in React/Vite client code. Store them in server-side secrets. Google Apps Script remains the Sheet integration boundary.

## Required backend tables
WhatsApp Accounts, WhatsApp Contacts, WhatsApp Conversations, WhatsApp Messages, WhatsApp Media, WhatsApp Templates, Conversation Participants, Conversation Tags, Conversation Events, AI Classifications, AI Actions, Omnichannel Threads, Message Delivery Status, Webhook Events.

## Automatic ticket policy
Incoming messages are analyzed server-side. A ticket may be created when the classifier determines that the conversation represents a support issue and confidence is above the configured threshold. Sensitive actions remain officer-approved.

## Deployment
The React application is deployed by Netlify from GitHub `main`. Provider credentials are configured as server-side environment variables; they are not committed to Git.

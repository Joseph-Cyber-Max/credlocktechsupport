# WhatsApp + AI Production Setup

## 1. Meta
Create/configure a Meta Business portfolio, WhatsApp Business Account and phone number. Enable the WhatsApp Cloud API and generate the required server-side credentials.

## 2. Webhook
Configure the Meta webhook callback to the server-side webhook endpoint. Verify the webhook challenge and validate incoming signatures. Process message events idempotently using the provider message ID.

## 3. Secrets
Never put WhatsApp access tokens, app secrets, webhook secrets, or OpenAI API keys in React/Vite source. Store them in a server-side secret manager/environment.

## 4. Data model
Provision the omnichannel tables listed in `src/omnichannel/README.md`. Keep the existing Issues table and link conversations by Conversation ID/Ticket ID.

## 5. AI
Send normalized inbound messages to the server-side AI classifier. Require structured output. Configure a confidence threshold for automatic ticket creation. Keep sensitive actions officer-approved.

## 6. Frontend
The React omnichannel inbox is intentionally provider-agnostic. It can display conversations and provide the officer workflow before live credentials are configured.

## 7. Production checklist
- Verify webhook
- Verify inbound message persistence
- Verify outbound send
- Verify delivery/read callbacks
- Verify media handling
- Verify idempotency
- Verify AI classification
- Verify automatic ticket creation
- Verify ticket/conversation linkage
- Verify audit logs
- Verify rate limits and retry handling
- Verify mobile layout

# Credlock primary/secondary data architecture

## Decision
Firebase Realtime Database is the primary application backend. Google Sheets + Apps Script remains the secondary operational/reporting backend.

Swift is not a backend technology; it is a programming language used for native Apple applications. If a native iOS officer app is added later, Swift can consume the same backend APIs.

## Responsibilities

### Firebase — primary
- authenticated application users
- roles and permissions
- tickets and ticket events
- omnichannel conversations/messages
- AI classifications and actions
- realtime officer queues
- customer/merchant profiles
- attachments metadata
- notifications and presence
- idempotency and operational state

### Google Sheets + Apps Script — secondary
- reporting mirror
- management exports
- existing TicketDB compatibility
- manual operations and audit-friendly spreadsheet views
- legacy integrations

## Sync rule
Firebase is the source of truth for new application transactions. Successful writes are mirrored to Apps Script/Google Sheets asynchronously. A failed mirror must not make the primary ticket transaction fail; it should enter a retry queue.

## Firebase configuration
Set these Netlify environment variables for the browser-safe Firebase configuration:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`

Firebase Security Rules must enforce authenticated access and role/ownership boundaries. Never put service-account credentials in Vite environment variables.

## Migration
Existing Google Sheet records should be imported into Firebase with their original Record ID and Ticket ID retained. Each migrated record should include `legacySource: GOOGLE_SHEETS` and `migratedAt` metadata. Do not delete the Sheet records until reconciliation is complete.

## Frontend
The application uses React + TypeScript + Vite. The `/workspace` route provides the advanced responsive operations command center. The existing ticket register remains compatible with Apps Script while the Firebase-first data layer is introduced incrementally.

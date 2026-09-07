# Credlock primary/secondary data architecture

## Decision
Firebase **Cloud Firestore** is the primary application backend. Google Sheets + Apps Script remains the secondary operational/reporting backend.

The Zite workspace is the legacy/source schema used for the feature and data migration. Its production records are not committed to this public repository.

## Current Zite inventory
The connected workspace `87521331c6e88543` contains 26 operational tables and the following populated record volumes at the migration baseline: Users 58, Zite Users 67, Departments 42, Issue Categories 150, Officers 4, Issues 1,570, Feedback 641, Meetings 3, Meeting Items 1, AuditLog 160, Incidents 47, Todo Items 38, Internal Requests 3, Knowledge Base Articles 7, Recovery Records 3, Recovery Tasks 3, Monthly Evaluations 3, Staff Schedules 381, KPI Targets 3, Knowledge Base 10 and SLA Policies 4. Broadcasts, Pending Questions, Manual Reports and Ticket Activity were empty at that baseline.

The canonical application feature/schema inventory is maintained in `src/lib/ziteCatalog.ts`.

## Responsibilities

### Firebase — primary
- authenticated application users and staff profiles
- roles and permissions
- tickets, ticket activity and feedback
- SLA policies and ticket lifecycle metrics
- incidents and recovery operations
- customer/merchant support data
- knowledge base and response workflows
- workforce schedules and evaluations
- meetings, internal requests, todos and broadcasts
- KPI targets and operational state
- omnichannel conversation metadata
- audit/governance state

Firebase Storage remains disabled by design. Attachments are represented as metadata only until a separately approved storage strategy exists.

### Google Sheets + Apps Script — secondary
- reporting mirror
- management exports
- existing TicketDB compatibility
- manual operations and audit-friendly spreadsheet views
- legacy integrations

### Zite — migration source
Zite is treated as a migration source, not as the runtime application database. Original IDs/record IDs must be preserved in migration metadata. Migrated records should include `legacySource: ZITE` and `migratedAt`.

## Sync rule
Firebase is the source of truth for new application transactions. Successful writes may be mirrored to Apps Script/Google Sheets asynchronously. A failed mirror must not make the primary ticket transaction fail.

## User migration and security
Zite user/profile data can be migrated as non-secret profile metadata (name, email, role, department and status). **Passwords are never copied into Firestore or GitHub.** Firebase Authentication accounts must be provisioned through Firebase Auth. A user's Firestore profile is keyed by their Firebase Auth UID.

Firestore Security Rules require an authenticated active staff profile for operational data. Only an ADMIN profile may change roles/status or perform destructive operations.

## Firebase configuration
Set these browser-safe environment variables when deployment configuration is available:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Never put Firebase service-account keys, WhatsApp access tokens or OpenAI API keys in Vite environment variables or source control.

## Migration status
Schema/feature parity is now catalogued and the application is Firestore-first. The remaining production migration step is a privileged server-side import of Zite records into Firestore. That step requires a Firebase server credential with Firestore write access and must run outside the public browser bundle. This repository intentionally contains no such credential.

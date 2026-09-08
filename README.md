# Credlock Technical Support

Credlock Technical Support is a mobile-first operations control center for technical support, device lifecycle, IMEI validation, BNPL operations, recovery, customer/merchant communication and ticket management.

## Architecture

- **Frontend:** React 19, TypeScript, TanStack Router/Start, Vite, Tailwind CSS 4 and custom responsive CSS
- **Backend:** Google Apps Script Web App
- **Database:** Google Sheets
- **Files:** Google Drive through Apps Script
- **Source control:** GitHub
- **Deployment:** GitHub Pages for the frontend
- **Authentication:** Apps Script session authentication backed by the `Auth Users` sheet

The application data flow is intentionally simple:

`React frontend → fetch/AJAX → Google Apps Script → Google Sheets / Google Drive`

Firebase/Firestore is no longer the application data source. Vercel/Netlify are not required for the core ticketing system.

## Core capabilities

- Command Center and live queue
- Ticket intake, assignment, SLA, escalation, resolution, closure and reopen
- Customer and merchant support
- Incidents and recovery operations
- BNPL operations
- Knowledge base and response workflows
- Audit and permissions
- WhatsApp/omnichannel workspace architecture
- AI-assisted triage architecture
- Responsive desktop/tablet/mobile interface
- Google Sheets reporting and operational data
- Google Drive ticket attachments
- Admin Control Center for users, officers, departments, permissions, system configuration and audit records

## Frontend routes

- `/` — ticketing command center
- `/admin` — administration and access control center
- `/omnichannel` — WhatsApp/unified conversation workspace
- `/workspace` — advanced Credlock operations workspace

## Apps Script setup

Open `apps-script/Code.gs` in Google Apps Script.

1. Run `setupBackend()` once and approve the requested Google permissions.
2. Run `createAuthUser('your-email@example.com','your-password','ADMIN','Technical Support')` once to create the first administrator.
3. Deploy the script as a Web App, executing as the script owner and allowing the intended users to access it.
4. Copy the deployed `/exec` URL into `VITE_APPS_SCRIPT_URL` in the frontend deployment configuration.
5. Publish a new Apps Script deployment version whenever `Code.gs` changes.

The backend creates and manages the required Sheets tables, session authentication, ticket IDs, SLA calculations, audit logs and Drive attachments.

## Security model

The browser never connects directly to Google Sheets. All reads and writes go through Apps Script. Operational requests require a valid Apps Script session token. Passwords are stored as SHA-256 hashes in the `Auth Users` sheet. Administrative deletion is restricted to `ADMIN` sessions.

Do not commit passwords, access tokens or private provider credentials to GitHub.

## Zite migration

Zite remains the schema/reference source for the ticketing model. Existing Ticket IDs and Record IDs should be retained when importing or migrating historical data into Google Sheets.

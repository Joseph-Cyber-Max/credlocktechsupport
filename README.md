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

`React frontend → Fetch API → Google Apps Script → Google Sheets / Google Drive`

The frontend uses modern TypeScript, `fetch()`, async/await and AbortController. No XMLHttpRequest or AJAX library is required.

Firebase/Firestore is no longer the application data source. Vercel/Netlify are not required for the core ticketing system.

## Core capabilities

- Command Center and live queue
- Ticket intake, assignment, SLA, escalation, resolution, closure and reopen
- Customer and merchant support
- Customer/device/IMEI/NIN/loan reference tracking
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

## Advanced operations

The Apps Script backend now includes safe production-sheet migration plus operational utilities for:

- SLA-breach snapshots and breach queue analysis
- Duplicate device/IMEI/NIN detection
- Global search across operational tables
- Bulk ticket updates with audit trails
- Queue/category/officer workload analytics
- Backend schema validation and health checks

These utilities are in `apps-script/BackendConfig.gs` and `apps-script/AdvancedOperations.gs`.

## Frontend service layer

The ticketing frontend has a typed service layer in `src/lib/ticketService.ts`, domain types in `src/lib/ticketTypes.ts`, and reusable queue/SLA selectors in `src/lib/ticketSelectors.ts`. This keeps ticket workflow logic separate from page rendering and makes future workspace improvements safer.

## Frontend routes

- `/` — ticketing command center
- `/admin` — administration and access control center
- `/omnichannel` — WhatsApp/unified conversation workspace
- `/workspace` — advanced Credlock operations workspace

## Production Google Sheet

The production backend is pinned to the existing Credlock Technical Support Google Sheet. The production ID is configured in `apps-script/BackendConfig.gs`.

**Important:** do not run the legacy destructive `setupBackend()` against a sheet containing real records. The legacy function can clear/rewrite a sheet when its header order differs from the current schema.

Instead, in Google Apps Script run:

1. `configureCredlockProductionBackend()` — points Apps Script at the production sheet.
2. `safeSetupBackend()` — creates missing tabs and appends missing headers without clearing existing rows.
3. `validateCredlockBackend()` — verifies that all required tabs and schema headers exist.
4. `createAuthUser('your-email@example.com','your-password','ADMIN','Technical Support')` — creates the first administrator.
5. Deploy the script as a Web App, executing as the script owner and allowing the intended users to access it.
6. Put the deployed `/exec` URL into `VITE_APPS_SCRIPT_URL` for the frontend deployment.
7. Publish a new Apps Script deployment version whenever backend code changes.

The safe migration preserves existing Record IDs, Ticket IDs and historical rows.

## Security model

The browser never connects directly to Google Sheets. All reads and writes go through Apps Script. Operational requests require a valid Apps Script session token. Passwords are stored as SHA-256 hashes in the `Auth Users` sheet. Administrative deletion is restricted to `ADMIN` sessions.

Do not commit passwords, access tokens or private provider credentials to GitHub.

## Zite migration

Zite remains the schema/reference source for the ticketing model. Existing Ticket IDs and Record IDs should be retained when importing or migrating historical data into Google Sheets.

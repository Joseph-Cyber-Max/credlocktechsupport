# Credlock Support Frontend Setup

This frontend is wired to the Credlock Google Apps Script + Google Sheets backend.

## Architecture

`React/Vite -> Apps Script Web App -> Google Sheets`

The Apps Script backend is the source of truth. The frontend reads the schema and select options from `?action=metadata`, dashboard metrics from `?action=dashboard`, and operational records from `?action=list&table=...`.

## 1. Google Sheets / Apps Script

1. Keep the existing TicketDB spreadsheet and its 26 tables.
2. Keep the deployed Apps Script Web App URL ending in `/exec`.
3. Confirm the backend has been initialized with `setupBackend()`.
4. Confirm `?action=health`, `?action=metadata`, `?action=dashboard`, and `?action=tickets` return JSON.
5. Do not change the spreadsheet headers manually; the Apps Script `SCHEMA` defines them.

## 2. Frontend API configuration

The frontend reads:

`VITE_APPS_SCRIPT_URL`

from the environment. If it is missing, `src/lib/api.ts` currently uses the deployed Credlock Apps Script URL as a fallback.

For production, configure the variable in Netlify instead of relying on the fallback.

## 3. Netlify

In Netlify:

1. Open the Credlock support site.
2. Open **Project configuration -> Build & deploy / Build settings**.
3. Keep **Build status: Active builds**.
4. Repository: `Joseph-Cyber-Max/credlocktechsupport`.
5. Production branch: `main`.
6. Build command: `vite build`.
7. Publish directory: `dist/client`.
8. Functions directory: `netlify/functions`.
9. Under environment variables, add `VITE_APPS_SCRIPT_URL` with the deployed `/exec` URL.
10. Save and trigger a deploy if Netlify does not automatically start one.

## 4. GitHub -> Netlify workflow

All frontend changes are committed to `main`.

`GitHub commit -> Netlify active build -> vite build -> dist/client -> production`

No local VS Code step is required for normal changes when GitHub is being edited directly.

## 5. Frontend modules

The UI uses the Apps Script schema dynamically for the operational tables:

- Issues
- Users
- Departments
- Issue Categories
- Officers
- Feedback
- Meetings
- Meeting Items
- AuditLog
- Incidents
- Todo Items
- Page Permissions
- Internal Requests
- Knowledge Base Articles
- Recovery Records
- Recovery Tasks
- Monthly Evaluations
- Staff Schedules
- Pending Questions
- Broadcasts
- KPI Targets
- Manual Reports
- BNPL Applications
- Operational Blueprints

## 6. Ticket lifecycle

Ticket actions are translated into the backend's supported generic update API:

- assign -> Assigned Officer
- respond -> IN_PROGRESS + First Response Time
- pending -> PENDING
- resolve -> RESOLVED + resolution notes + root cause + Date Resolved
- close -> CLOSED + Ticket Closed At
- reopen -> REOPENED + Reopen Count increment
- escalate -> Escalation Required + Escalation Level

The Apps Script backend calculates derived ticket metrics such as FRT, resolution time and SLA status.

## 7. Production verification checklist

After every deployment:

- Open dashboard and confirm live ticket counts.
- Open Tickets and confirm records match the Issues sheet.
- Create a test ticket and confirm a new Ticket ID is generated in Google Sheets.
- Open the ticket and test assignment.
- Test Start Work / response.
- Test Pending.
- Test Resolve and verify FRT, Resolution Minutes and SLA Met.
- Test Close.
- Test Reopen and verify Reopen Count.
- Test Escalate.
- Verify an attachment URL when an attachment is uploaded.
- Check the Apps Script AuditLog for changes.

## 8. Design system

The current interface uses a Credlock-oriented visual system: deep navy navigation, Credlock blue primary actions, cyan operational accents, compact data tables, SLA/status pills, responsive mobile navigation and a high-density operations dashboard.

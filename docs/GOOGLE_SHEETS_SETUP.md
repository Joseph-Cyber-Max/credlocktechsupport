# CredlockDesk — Google Sheets + Apps Script setup

## Architecture

React/TanStack frontend → AJAX `fetch()` → Apps Script Web App → Google Sheets + Google Drive attachments.

The Apps Script schema mirrors the Credlock Zite ticketing blueprint and operational tracking database, including users, departments, categories, officers, tickets, feedback, meetings, meeting items, audit log, incidents, todos, permissions, internal requests, knowledge base, recovery records/tasks, evaluations, schedules, pending questions, broadcasts, KPI targets, manual reports, BNPL applications and operational blueprints.

## 1. Create the Google backend

1. Open Google Apps Script and create a standalone project.
2. Copy `apps-script/Code.gs` into the project.
3. Copy `apps-script/appsscript.json` into the manifest file.
4. Run `setupBackend()` once.
5. Authorize access to Google Sheets and Google Drive.
6. The function creates **Credlock Technical Support Ticketing Backend** and all required tabs.

## 2. Deploy the API

Deploy → New deployment → Web app.

- Execute as: **Me**
- Who has access: choose the access level appropriate for your organization.
- Copy the `/exec` URL.

## 3. Connect the React app

Create `.env.local` in the project root:

```text
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Restart Vite after changing environment variables.

## 4. API contract

### GET

- `?action=health`
- `?action=metadata`
- `?action=dashboard`
- `?action=tickets`
- `?action=list&table=Issues`
- `?action=get&table=Issues&id=TCK-...`

### POST JSON

Create:

```json
{"action":"create","table":"Issues","record":{"Issue Title":"Example","Description":"Example","Priority":"HIGH","Status":"OPEN"}}
```

Update:

```json
{"action":"update","table":"Issues","id":"ISS-123","record":{"Status":"RESOLVED"}}
```

Delete:

```json
{"action":"delete","table":"Issues","id":"ISS-123"}
```

Attachments are uploaded through the `upload` action and stored in a Google Drive folder named **Credlock Ticket Attachments**.

## 5. Security recommendations

- Keep the spreadsheet private.
- Use the Web App access level appropriate for your staff.
- Add application authentication before exposing the endpoint publicly.
- Restrict Apps Script deployment to approved users/domain when possible.
- Do not put Google credentials, spreadsheet IDs, or secrets in the React repository.
- Use a separate production deployment and versioned Apps Script releases.

## 6. SLA calculations

The backend automatically derives First Response Time, Resolution Time and SLA Met when ticket timestamps are available. The default SLA target is 1,440 minutes and can be supplied per ticket.

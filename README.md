# Credlock Technical Support

Credlock Technical Support is a mobile-first operations control center for technical support, device lifecycle, IMEI validation, BNPL operations, recovery, customer/merchant communication and ticket management.

## Architecture

- **Primary backend:** Firebase Cloud Firestore + Firebase Authentication
- **Secondary backend:** Google Sheets + Google Apps Script (`TicketDB`)
- **Frontend:** React 19, TypeScript, TanStack Router/Start, Vite, Tailwind CSS 4 and custom responsive CSS
- **Deployment:** Vercel for the TanStack Start web application, with GitHub Actions build verification
- **Server boundary:** Existing Netlify Functions for provider webhooks, AI and privileged integrations
- **Omnichannel:** WhatsApp conversation workspace with ticket linkage and AI triage architecture

Firebase Cloud Firestore is the source of truth for new application transactions. Google Sheets remains the reporting/legacy mirror and management-friendly operational surface.

## Core capabilities

- Command Center and live queue
- Ticket intake, assignment, SLA, escalation, resolution, closure and reopen
- Customer and merchant support
- Incidents and recovery operations
- BNPL operations
- Knowledge base and response workflows
- Audit and permissions
- WhatsApp/omnichannel workspace
- AI-assisted triage and automatic ticket creation architecture
- Responsive desktop/tablet/mobile interface
- Firebase-first data layer with authenticated Google Sheets fallback during migration
- Admin Control Center for users, officers, departments, permissions, system configuration and audit records

## Frontend routes

- `/` — ticketing command center
- `/admin` — administration and access control center
- `/omnichannel` — WhatsApp/unified conversation workspace
- `/workspace` — advanced Credlock operations workspace

## Configuration

Copy `.env.example` to your deployment configuration and provide Firebase web configuration values plus the Apps Script `/exec` URL.

Never commit Firebase service-account keys, WhatsApp access tokens or OpenAI API keys. Provider secrets belong in server-side environment variables.

## Google Sheets backend

The existing Apps Script endpoint remains available as the secondary integration and reporting mirror. Existing Ticket IDs and Record IDs should be retained during migration. Sheets fallback reads are restricted to authenticated operators; Firestore remains the primary transaction store.

## Firebase security

Firestore Security Rules require authenticated active staff profiles for operational data. Only an `ADMIN` profile may change roles/status or perform destructive operations. Self-created user profiles cannot self-promote to administrative or active-staff privileges.

Firebase Storage attachments are intentionally disabled until a separately approved storage strategy exists.

## Firebase migration

See `docs/PRIMARY-BACKEND-ARCHITECTURE.md` for the source-of-truth policy, migration strategy and security requirements. Zite is treated as the migration source/schema reference, not as the runtime application database.

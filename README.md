# Credlock Technical Support

Credlock Technical Support is a mobile-first operations control center for technical support, device lifecycle, IMEI validation, BNPL operations, recovery, customer/merchant communication and ticket management.

## Architecture

- **Primary backend:** Firebase Realtime Database + Firebase Authentication
- **Secondary backend:** Google Sheets + Google Apps Script (`TicketDB`)
- **Frontend:** React 19, TypeScript, TanStack Router, Vite, Tailwind CSS 4 and custom responsive CSS
- **Server boundary:** Netlify Functions for provider webhooks, AI and privileged integrations
- **Omnichannel:** WhatsApp conversation workspace with ticket linkage and AI triage architecture

Firebase is the source of truth for new application transactions. Google Sheets remains the reporting/legacy mirror and management-friendly operational surface.

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
- Firebase-first data layer with Google Sheets fallback during migration

## Frontend routes

- `/` — existing ticketing command center
- `/omnichannel` — WhatsApp/unified conversation workspace
- `/workspace` — advanced Credlock operations workspace

## Configuration

Copy `.env.example` to your deployment configuration and provide Firebase web configuration values plus the Apps Script `/exec` URL.

Never commit Firebase service-account keys, WhatsApp access tokens or OpenAI API keys. Provider secrets belong in Netlify server-side environment variables.

## Google Sheets backend

The existing Apps Script endpoint remains available as the secondary integration and reporting mirror. Existing Ticket IDs and Record IDs should be retained during migration.

## Firebase migration

See `docs/PRIMARY-BACKEND-ARCHITECTURE.md` for the source-of-truth policy, migration strategy and security requirements.

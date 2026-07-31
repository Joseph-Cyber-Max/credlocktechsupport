# ResolveHQ

ResolveHQ is an operations control center for managing technical support, device lifecycle, IMEI validation, BNPL and loan operations, payments, merchants, and customer issues. It provides a structured ticket workflow, live operational metrics, durable attachments, and automatic recommendations that help support teams identify duplicate cases, IMEI mismatches, troubleshooting steps, priority, and SLA targets.

## Key Features

- Command-center dashboard with ticket, SLA, priority, issue-family, and response metrics
- Searchable ticket register with status and priority indicators
- Comprehensive ticket intake covering customer, merchant, IMEI, device change, loan, troubleshooting, evidence, resolution, escalation, and approvals
- Conditional sections that adapt to IMEI, device-change, and loan-related cases
- Automatic server-side recommendations based on ticket details and previous cases
- Persistent ticket records in Netlify Database using Drizzle ORM
- Uploaded screenshots, videos, logs, agreements, receipts, and device evidence in Netlify Blobs
- Responsive interface designed for desktop and mobile operations teams

## Technology

- TanStack Start, React 19, and TanStack Router
- TypeScript and Vite
- Tailwind CSS 4 with a custom global design system
- Netlify Functions
- Netlify Database with Drizzle ORM
- Netlify Blobs

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the full Netlify development environment on the project port:

```bash
netlify dev --port 8889
```

Open `http://localhost:8889`. The Netlify CLI emulates Functions, Database, and Blobs locally.

## Database Changes

The schema is defined in `db/schema.ts`. After changing it, generate a migration with a short imperative name:

```bash
pnpm drizzle-kit generate --name add_ticket_field
```

Generated migrations belong in `netlify/database/migrations/` and are applied automatically during deployment.

# ResolveHQ Agent Guide

## Project Overview

ResolveHQ is a Netlify-hosted operations ticketing application for device support, BNPL and loan operations, payments, merchants, and customer cases. It combines an operational dashboard, a structured ticket intake workflow, durable data storage, attachment handling, and automatic triage recommendations.

## Architecture

- **Framework:** TanStack Start with React 19 and file-based routing.
- **Styling:** Tailwind CSS import plus a bespoke global design system in `src/styles.css`.
- **API:** Netlify Functions using standard Web Request and Response APIs.
- **Structured data:** Netlify Database with Drizzle ORM.
- **Files:** Netlify Blobs in the `ticket-attachments` store.
- **Deployment:** Netlify via `netlify.toml` and the Netlify TanStack Start Vite plugin.

## Key Directories

- `src/routes/` — application routes; the main dashboard and form live in `index.tsx`.
- `src/ticket-config.ts` — shared ticket categories, workflow options, and frontend types.
- `src/styles.css` — all layout, component, responsive, and motion styles.
- `db/` — Drizzle schema and Netlify Database client.
- `netlify/functions/` — serverless ticket API and automatic recommendation logic.
- `netlify/database/migrations/` — generated database migrations applied by Netlify.

## Conventions

- Use TypeScript and strict typing throughout.
- Keep database column names in snake_case and TypeScript properties in camelCase.
- Use Netlify Database for queryable persistent records and Netlify Blobs for uploaded files.
- Keep ticket options centralized in `src/ticket-config.ts` rather than duplicating arrays in UI components.
- Preserve the industrial editorial visual direction: ink, paper, cobalt, lime, and coral; avoid generic dashboard styling and gradients.
- Prefer accessible native controls with explicit labels and visible focus states.
- Add schema changes to `db/schema.ts`, then generate a named migration with `drizzle-kit generate --name <imperative_name>`.

## Non-obvious Decisions

- AI recommendations are deterministic server-side triage rules. They inspect category, priority, IMEI state, and matching historical cases without sending customer data to an external AI provider.
- Dashboard metrics are calculated from the latest 100 tickets returned by the API.
- Attachments are limited to eight files and 10 MB per file in the function to protect request execution limits.
- Approval entries are optional at creation because many approvals occur later in the ticket lifecycle.

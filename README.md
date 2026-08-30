BelKou is a course and services platform built with TanStack Start, Supabase, and Square.

## Stack

- Frontend: React + TanStack Router/Start + Tailwind
- Backend: TanStack Start server functions + Node runtime
- Data: Supabase (primary), D1 compatibility layer
- Payments: Square Checkout (Payment Links) + webhooks

## Quick Start

1. Install dependencies
   - `npm install`
2. Configure environment variables
   - Copy `.env.example` values into your environment (or `.dev.vars` for local dev)
   - Required for card payments: `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `SQUARE_ENVIRONMENT`
3. Start development
   - `npm run dev`

## Core Scripts

- `npm run dev` - local development
- `npm run build` - production build
- `npm run start` - start production server (`scripts/railway.mjs`)
- `npm run lint` - lint checks
- `npm run typecheck` - TypeScript checks
- `npm run test` - automated critical-path tests
- `npm run audit:release` - production readiness guard checks

## Health & Operations

- Health endpoint: `GET /healthz`
  - Returns `200` when required environment checks are valid
  - Returns `503` when required configuration is missing

See `docs/operations/rollback-runbook.md` for release/rollback steps.

## Deploy (GitHub Actions → Railway)

Pushes to `main` run `.github/workflows/deploy.yml` after verify passes.

Configure these GitHub repository secrets (Settings → Secrets and variables → Actions):

- `RAILWAY_TOKEN` — project token from Railway dashboard
- `RAILWAY_PROJECT_ID` — project UUID
- `RAILWAY_SERVICE_ID` — web service UUID

Optional repository variable:

- `RAILWAY_ENVIRONMENT` — defaults to `production`

If `RAILWAY_TOKEN` is unset, the deploy job skips gracefully (CI still runs).

Before the first deploy with webhook idempotency, run these in the Supabase SQL Editor:

- `migrations/supabase_checkout_webhook_events.sql` (or legacy `migrations/supabase_stripe_webhook_events.sql`)
- `migrations/supabase_course_resources_private.sql` (or `supabase/course_resources_storage.sql` for new installs)

Square webhook URL to configure in the Square Developer Dashboard:

- `https://belkou.online/api/square/webhook` (subscribe to `payment.updated`)

## Critical Production Flows

- Checkout and enrollment: `src/lib/fns/register.ts`
- Square webhook unlock: `src/routes/api/square/webhook.ts`
- Course access resolution: `src/server/checkout-access.ts`
- Admin auth/session: `src/lib/admin-auth.ts`

## Pre-Release Checklist

Run these commands before deployment:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `npm run audit:release`

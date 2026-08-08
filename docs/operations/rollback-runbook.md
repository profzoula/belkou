# Release & Rollback Runbook

## Purpose

This runbook defines the minimum safe process to release and rollback BelKou.

## Release Steps

1. Validate code quality and critical guards:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run test`
   - `npm run build`
   - `npm run audit:release`
2. Confirm required production environment variables are configured:
   - `SITE_URL` (or `VITE_SITE_URL`)
   - `SUPABASE_URL` (or `VITE_SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
3. Apply pending Supabase SQL migrations (if any), including:
   - `migrations/supabase_stripe_webhook_events.sql` (Stripe webhook idempotency)
4. Deploy to production (GitHub Actions `Deploy` workflow on `main`, or manual Railway deploy).
4. Post-deploy checks:
   - `GET /healthz` returns `200` and `status: "ok"`
   - Stripe webhook endpoint receives events without errors
   - Checkout -> payment -> access flow works for a test account

## Rollback Triggers

Rollback immediately if any of the following occur:

- `GET /healthz` returns `503` after deployment
- Stripe payments are confirmed but students do not receive access
- Login/admin access is broken for legitimate users
- Elevated 5xx errors persist for more than 5 minutes

## Rollback Procedure

1. Re-deploy the previous known-good commit.
2. Set `ENABLE_VIDEO_WORKER=false` temporarily if worker instability impacts web traffic.
3. Validate:
   - `GET /healthz` returns `200`
   - Checkout flow is restored
   - Existing students can open paid course lessons
4. If DB schema was changed in the failed deploy:
   - Stop additional migrations
   - Apply manual corrective SQL only after backup confirmation
   - Document exact SQL and incident timeline

## Incident Notes Template

Record these details in every release incident:

- Deploy commit SHA
- First detected failure time
- User-facing impact
- Root cause summary
- Rollback completion time
- Follow-up fix owner and deadline

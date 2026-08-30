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
   - `SQUARE_ACCESS_TOKEN`
   - `SQUARE_LOCATION_ID`
   - `SQUARE_WEBHOOK_SIGNATURE_KEY`
   - `SQUARE_ENVIRONMENT` (`sandbox` or `production`)
3. Apply pending Supabase SQL migrations (if any), including:
   - `migrations/supabase_checkout_webhook_events.sql` (Square webhook idempotency)
   - `migrations/supabase_course_resources_private.sql` (private course-resources bucket)
   - Or re-run `supabase/course_resources_storage.sql` for new installs
4. Deploy to production (GitHub Actions `Deploy` workflow on `main`, or manual Railway deploy).
5. Post-deploy checks:
   - `GET /healthz` returns `200` and `status: "ok"`
   - Square webhook endpoint (`/api/square/webhook`) receives events without errors
   - Checkout -> payment -> access flow works for a test account

## Rollback Triggers

Rollback immediately if any of the following occur:

- `GET /healthz` returns `503` after deployment
- Square payments are confirmed but students do not receive access
- Login/admin access is broken for legitimate users
- Elevated 5xx errors persist for more than 5 minutes

## Rollback Procedure

1. Redeploy the previous known-good Railway deployment / Git commit on `main`.
2. Re-verify `GET /healthz`.
3. Re-test login and one paid checkout path (or sandbox checkout).
4. Confirm Square Developer Dashboard webhook deliveries are green.
5. Announce status to ops/support once recovered.

## Notes

- Prefer forward fixes for small issues; use full rollback for access-breaking payment failures.
- Keep Railway env vars and Square webhook URL (`https://belkou.online/api/square/webhook`) in sync after every release.

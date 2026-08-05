# Monitoring Checklist (Minimum Baseline)

## Goal

Detect production failures within minutes, not from user complaints.

## Required Signals

1. **Uptime**
   - Probe `GET /healthz` every minute.
   - Alert when status is not `200` for 3 consecutive checks.

2. **Checkout and webhook reliability**
   - Alert on repeated `"[BelKou] Stripe webhook handler error"` logs.
   - Alert on repeated `"[BelKou] Stripe pricing verification failed"` logs.

3. **Error rate**
   - Alert when 5xx responses spike above normal baseline.

4. **Video worker**
   - Alert when worker logs contain consecutive failures:
     - `Video worker spawn failed`
     - `Video worker cycle failed`

## Daily Manual Check (until full APM exists)

- Confirm `/healthz` is `ok`.
- Confirm at least one successful webhook event in logs.
- Confirm no sustained 5xx burst in the last 24h.

## Ownership

- Primary owner: platform maintainer
- Backup owner: designated admin/support teammate

Both owners should have access to hosting logs and Stripe dashboard alerts.

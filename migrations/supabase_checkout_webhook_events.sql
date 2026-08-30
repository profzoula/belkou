-- Idempotent Square (checkout) webhook processing.
-- Same shape as the legacy stripe_webhook_events table.

create table if not exists public.checkout_webhook_events (
  event_id text primary key,
  status text not null,
  updated_at timestamptz not null default now()
);

alter table public.checkout_webhook_events enable row level security;

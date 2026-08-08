-- BelKou — Stripe webhook idempotency (Supabase)
-- Run in Supabase SQL Editor after supabase_registrations.sql
-- Prevents duplicate processing when Railway has no D1 binding.

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  status text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_stripe_webhook_events_status
  on public.stripe_webhook_events (status);

alter table public.stripe_webhook_events enable row level security;

drop policy if exists "No public access to stripe_webhook_events" on public.stripe_webhook_events;

create policy "No public access to stripe_webhook_events"
  on public.stripe_webhook_events
  for all
  using (false)
  with check (false);

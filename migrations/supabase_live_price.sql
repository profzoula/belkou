-- Per-event live ticket price (null = fall back to the default $9.99)

alter table public.live_sessions
  add column if not exists price_usd numeric(10, 2);

alter table public.live_sessions
  drop constraint if exists live_sessions_price_usd_check;

alter table public.live_sessions
  add constraint live_sessions_price_usd_check
  check (price_usd is null or price_usd >= 0);

-- BelKou — Supabase registrations (idempotent)
-- Safe to re-run if the table already exists with an older schema.

create table if not exists public.registrations (
  id text primary key,
  created_at timestamptz not null default now()
);

alter table public.registrations add column if not exists full_name text;
alter table public.registrations add column if not exists email text;
alter table public.registrations add column if not exists whatsapp text;
alter table public.registrations add column if not exists country text;
alter table public.registrations add column if not exists level text;
alter table public.registrations add column if not exists plan text;
alter table public.registrations add column if not exists payment_status text default 'pending';
alter table public.registrations add column if not exists stripe_session_id text;
alter table public.registrations add column if not exists created_at timestamptz default now();

update public.registrations set payment_status = 'pending' where payment_status is null;
update public.registrations set created_at = now() where created_at is null;

create index if not exists idx_registrations_email on public.registrations (email);
create index if not exists idx_registrations_created on public.registrations (created_at desc);
create index if not exists idx_registrations_status on public.registrations (payment_status);
create index if not exists idx_registrations_stripe on public.registrations (stripe_session_id);

alter table public.registrations enable row level security;

drop policy if exists "No public access to registrations" on public.registrations;

create policy "No public access to registrations"
  on public.registrations
  for all
  to anon, authenticated
  using (false)
  with check (false);

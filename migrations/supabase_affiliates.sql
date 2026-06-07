-- BelKou — Affiliate system (idempotent)
-- Run in Supabase SQL Editor after supabase_registrations.sql

alter table public.registrations add column if not exists referral_code text;
create index if not exists idx_registrations_referral on public.registrations (referral_code);

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  email text not null unique,
  full_name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_affiliates_code on public.affiliates (code);
create index if not exists idx_affiliates_email on public.affiliates (email);

create table if not exists public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  registration_id text not null unique,
  referred_email text not null,
  referral_code text not null,
  amount_usd numeric(10,2) not null default 5.00,
  referral_type text not null default 'enrollment' check (referral_type in ('signup', 'enrollment')),
  status text not null default 'pending' check (status in ('pending', 'earned', 'paid_out')),
  created_at timestamptz not null default now(),
  earned_at timestamptz
);

create index if not exists idx_affiliate_referrals_affiliate on public.affiliate_referrals (affiliate_id);
create index if not exists idx_affiliate_referrals_code on public.affiliate_referrals (referral_code);
create index if not exists idx_affiliate_referrals_status on public.affiliate_referrals (status);
create index if not exists idx_affiliate_referrals_type on public.affiliate_referrals (referral_type);

alter table public.affiliate_referrals add column if not exists referral_type text not null default 'enrollment' check (referral_type in ('signup', 'enrollment'));

alter table public.affiliates enable row level security;
alter table public.affiliate_referrals enable row level security;

drop policy if exists "No public access to affiliates" on public.affiliates;
create policy "No public access to affiliates"
  on public.affiliates for all to anon, authenticated using (false) with check (false);

drop policy if exists "No public access to affiliate_referrals" on public.affiliate_referrals;
create policy "No public access to affiliate_referrals"
  on public.affiliate_referrals for all to anon, authenticated using (false) with check (false);

create table if not exists public.affiliate_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  affiliate_email text not null,
  affiliate_code text not null,
  amount_usd numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  payment_method text not null default 'moncash',
  payment_details text not null,
  admin_note text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_affiliate_withdrawals_user on public.affiliate_withdrawals (user_id);
create index if not exists idx_affiliate_withdrawals_status on public.affiliate_withdrawals (status);
create index if not exists idx_affiliate_withdrawals_code on public.affiliate_withdrawals (affiliate_code);

alter table public.affiliate_withdrawals enable row level security;

drop policy if exists "No public access to affiliate_withdrawals" on public.affiliate_withdrawals;
create policy "No public access to affiliate_withdrawals"
  on public.affiliate_withdrawals for all to anon, authenticated using (false) with check (false);

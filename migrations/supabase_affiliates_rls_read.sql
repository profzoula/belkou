-- BelKou — Allow authenticated users to READ their own affiliate stats (Mon espace)
-- Run in Supabase SQL Editor after supabase_affiliates.sql

drop policy if exists "No public access to affiliates" on public.affiliates;
drop policy if exists "No public access to affiliate_referrals" on public.affiliate_referrals;

create policy "anon_no_affiliates"
  on public.affiliates for all to anon
  using (false) with check (false);

create policy "auth_select_own_affiliate"
  on public.affiliates for select to authenticated
  using (user_id = (select auth.uid())::text);

create policy "auth_no_insert_affiliates"
  on public.affiliates for insert to authenticated
  with check (false);

create policy "auth_no_update_affiliates"
  on public.affiliates for update to authenticated
  using (false);

create policy "auth_no_delete_affiliates"
  on public.affiliates for delete to authenticated
  using (false);

create policy "anon_no_affiliate_referrals"
  on public.affiliate_referrals for all to anon
  using (false) with check (false);

create policy "auth_select_own_referrals"
  on public.affiliate_referrals for select to authenticated
  using (
    affiliate_id in (
      select id from public.affiliates where user_id = (select auth.uid())::text
    )
    or referral_code in (
      select code from public.affiliates where user_id = (select auth.uid())::text
    )
  );

create policy "auth_no_insert_affiliate_referrals"
  on public.affiliate_referrals for insert to authenticated
  with check (false);

create policy "auth_no_update_affiliate_referrals"
  on public.affiliate_referrals for update to authenticated
  using (false);

create policy "auth_no_delete_affiliate_referrals"
  on public.affiliate_referrals for delete to authenticated
  using (false);

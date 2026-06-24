-- BelKou registrations table uses BIGINT auto-increment id in Supabase.
-- The app now inserts without id and uses the generated numeric id (as string).
-- No migration required if your table already has bigint id.
--
-- Optional: add updated_at if missing
alter table public.registrations add column if not exists updated_at timestamptz;

-- BelKou admin content (course overrides, site settings)
-- Run after supabase_registrations.sql

CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No public access to site_content" ON public.site_content;

CREATE POLICY "No public access to site_content"
  ON public.site_content
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

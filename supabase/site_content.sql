-- BelKou admin content (courses overrides, site settings)
-- Run in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- No public policies: only service role (server) can read/write.

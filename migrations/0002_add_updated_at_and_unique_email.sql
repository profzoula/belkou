-- BelKou — Add updated_at column and unique email constraint
-- Safe to run on existing databases

ALTER TABLE registrations ADD COLUMN updated_at TEXT;

UPDATE registrations SET updated_at = created_at WHERE updated_at IS NULL;

-- D1 doesn't support ALTER TABLE ADD UNIQUE directly
-- Create a unique index instead (acts as a unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_email_unique ON registrations(email);

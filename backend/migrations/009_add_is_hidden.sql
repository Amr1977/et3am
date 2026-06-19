ALTER TABLE donations
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_donations_is_hidden ON donations (is_hidden);

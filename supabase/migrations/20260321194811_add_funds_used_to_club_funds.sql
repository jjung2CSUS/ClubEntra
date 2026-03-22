/*
  # Add funds_used column to club_funds

  ## Summary
  Adds a `funds_used` column to the `club_funds` table so each fund can track
  how much has been spent. The `balance` column becomes the total allocated amount,
  and `funds_used` is how much of that total has been used. Funds available is
  derived as: balance - funds_used.

  ## Changes
  - `club_funds` table: new column `funds_used` (numeric, default 0)

  ## Notes
  - Uses safe IF NOT EXISTS guard
  - funds_available = balance - funds_used (computed at query time in the UI)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_funds' AND column_name = 'funds_used'
  ) THEN
    ALTER TABLE club_funds ADD COLUMN funds_used numeric(14,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

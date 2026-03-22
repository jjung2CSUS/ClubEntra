/*
  # Add total_funds to clubs table

  ## Summary
  Adds a `total_funds` column to the `clubs` table so admins can track
  and manage the total budget/funds allocated to each club.

  ## Changes
  - `clubs` table: new column `total_funds` (numeric, default 0)

  ## Notes
  - Uses safe IF NOT EXISTS guard to prevent errors on re-run
  - Default is 0 so existing clubs are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'total_funds'
  ) THEN
    ALTER TABLE clubs ADD COLUMN total_funds numeric(12,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

/*
  # Add year column to club_funds

  ## Changes
  - Adds a `year` integer column to `club_funds` defaulting to the current year
  - Updates the unique constraint to be per (club_id, fund_type, year)
    so each club can have separate allocations per year
  - Backfills existing rows with year 2026
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'club_funds' AND column_name = 'year'
  ) THEN
    ALTER TABLE club_funds ADD COLUMN year integer NOT NULL DEFAULT 2026;
  END IF;
END $$;

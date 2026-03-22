/*
  # Add event fields to fund_transactions

  ## Changes
  - `event_name` (text, optional) — name of the event associated with the transaction
  - `event_date` (text, optional) — date of the event as entered by the user
  - `attendee_count` (integer, optional) — number of people who attended the event
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fund_transactions' AND column_name = 'event_name'
  ) THEN
    ALTER TABLE fund_transactions ADD COLUMN event_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fund_transactions' AND column_name = 'event_date'
  ) THEN
    ALTER TABLE fund_transactions ADD COLUMN event_date text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'fund_transactions' AND column_name = 'attendee_count'
  ) THEN
    ALTER TABLE fund_transactions ADD COLUMN attendee_count integer DEFAULT 0;
  END IF;
END $$;

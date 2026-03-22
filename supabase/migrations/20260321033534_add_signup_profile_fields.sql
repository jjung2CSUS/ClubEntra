/*
  # Add signup profile fields

  ## Changes
  - Adds `username` (text, unique) to profiles — display handle chosen at registration
  - Adds `student_id` (text) to profiles — campus student ID number
  - Adds `student_role` (text) to profiles — either 'member' or 'officer'
  - Adds `club_name` (text) to profiles — club name for officer registrants

  ## Notes
  All new columns are optional with safe defaults so existing rows are unaffected.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'student_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN student_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'student_role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN student_role text DEFAULT 'member' CHECK (student_role IN ('member', 'officer'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'club_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN club_name text DEFAULT '';
  END IF;
END $$;

/*
  # Create fund_transactions table

  ## Summary
  Tracks individual spending transactions against a club_fund allocation.

  ## New Tables
  - `fund_transactions`
    - `id` (uuid, primary key)
    - `club_fund_id` (uuid, FK → club_funds.id, cascade delete)
    - `club_id` (uuid, FK → clubs.id, for quick filtering)
    - `fund_type` (text, matches parent fund type)
    - `year` (integer, matches parent fund year)
    - `description` (text, transaction name/description)
    - `amount` (numeric, positive value spent)
    - `receipt_url` (text, optional URL to receipt image)
    - `created_by` (uuid, FK → auth.users)
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - SELECT: active club members
  - INSERT: officers, presidents, admins
  - UPDATE: officers, presidents, admins
  - DELETE: presidents and admins only
*/

CREATE TABLE IF NOT EXISTS fund_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_fund_id uuid REFERENCES club_funds(id) ON DELETE CASCADE,
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  fund_type text NOT NULL,
  year integer NOT NULL DEFAULT 2026,
  description text NOT NULL DEFAULT '',
  amount numeric(12,2) NOT NULL DEFAULT 0,
  receipt_url text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fund_transactions_club_fund_id ON fund_transactions(club_fund_id);
CREATE INDEX IF NOT EXISTS idx_fund_transactions_club_year ON fund_transactions(club_id, year);

ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active members can view fund transactions"
  ON fund_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = fund_transactions.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.status = 'active'
    )
  );

CREATE POLICY "Officers and above can insert fund transactions"
  ON fund_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = fund_transactions.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.status = 'active'
        AND club_members.role IN ('officer', 'president', 'admin')
    )
  );

CREATE POLICY "Officers and above can update fund transactions"
  ON fund_transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = fund_transactions.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.status = 'active'
        AND club_members.role IN ('officer', 'president', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = fund_transactions.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.status = 'active'
        AND club_members.role IN ('officer', 'president', 'admin')
    )
  );

CREATE POLICY "Presidents and admins can delete fund transactions"
  ON fund_transactions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = fund_transactions.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.status = 'active'
        AND club_members.role IN ('president', 'admin')
    )
  );

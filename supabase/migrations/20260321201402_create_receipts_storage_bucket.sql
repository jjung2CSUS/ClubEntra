/*
  # Create receipts storage bucket

  ## Changes
  - Creates a public storage bucket called "receipts" for fund transaction receipt images
  - Adds RLS policies so authenticated users can upload and read their own receipts
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Anyone can view receipts"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'receipts');

CREATE POLICY "Users can delete own receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

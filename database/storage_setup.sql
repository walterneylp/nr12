-- 1. Create the 'photos' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS Policies for 'photos' bucket
-- Allow authenticated users to upload (INSERT)
CREATE POLICY "Authenticated users can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'photos' );

-- Allow authenticated users to view (SELECT)
CREATE POLICY "Authenticated users can view photos"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'photos' );

-- Allow authenticated users to update their own photos (optional/advanced, simple version here)
-- For now, just insert/select is enough for MVP.

-- 3. Add 'photos' column to risk_entries to store file paths/metadata
-- Using JSONB to store array of objects: [{ "url": "...", "caption": "..." }]
ALTER TABLE risk_entries 
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

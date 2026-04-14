-- ============================================
-- VaultDrop — Supabase Database Setup
-- ============================================
-- Run this SQL in your Supabase project:
-- Dashboard → SQL Editor → New query → Paste & Run
-- ============================================

-- 1. Create the "files" table to store file metadata
CREATE TABLE IF NOT EXISTS public.files (
  id             TEXT PRIMARY KEY,           -- Unique file ID (used in share URL)
  name           TEXT NOT NULL,              -- Original file name
  size           BIGINT NOT NULL,            -- File size in bytes
  url            TEXT NOT NULL,              -- Public storage URL
  storage_path   TEXT NOT NULL,              -- Path inside the bucket
  password       TEXT DEFAULT NULL,          -- Optional password (plain text — hash in production!)
  expires_at     TIMESTAMPTZ DEFAULT NULL,   -- NULL = never expires
  max_downloads  INT DEFAULT NULL,           -- NULL = unlimited downloads
  download_count INT DEFAULT 0,             -- Tracks number of downloads
  created_at     TIMESTAMPTZ DEFAULT NOW()   -- Upload timestamp
);

-- 2. Enable Row Level Security (RLS) on the table
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- 3. Allow anyone to INSERT a new file record (needed for upload)
DROP POLICY IF EXISTS "Allow public insert" ON public.files;
CREATE POLICY "Allow public insert"
  ON public.files
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. Allow anyone to SELECT a file record (needed to fetch metadata on download page)
DROP POLICY IF EXISTS "Allow public select" ON public.files;
CREATE POLICY "Allow public select"
  ON public.files
  FOR SELECT
  TO anon
  USING (true);

-- 5. Allow anyone to UPDATE the download_count field
DROP POLICY IF EXISTS "Allow public update download count" ON public.files;
CREATE POLICY "Allow public update download count"
  ON public.files
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET + POLICIES
-- ============================================
-- Ensure bucket exists and is public.
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies can fail on some projects if current SQL role doesn't own `storage.objects`.
-- This block attempts to apply them and skips gracefully if ownership is restricted.
DO $$
BEGIN
  BEGIN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipped ALTER TABLE storage.objects (insufficient privilege).';
  END;

  BEGIN
    DROP POLICY IF EXISTS "Allow anon upload to files bucket" ON storage.objects;
    CREATE POLICY "Allow anon upload to files bucket"
      ON storage.objects
      FOR INSERT
      TO anon
      WITH CHECK (bucket_id = 'files');
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipped upload policy creation on storage.objects (insufficient privilege).';
  END;

  BEGIN
    DROP POLICY IF EXISTS "Allow anon read from files bucket" ON storage.objects;
    CREATE POLICY "Allow anon read from files bucket"
      ON storage.objects
      FOR SELECT
      TO anon
      USING (bucket_id = 'files');
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipped read policy creation on storage.objects (insufficient privilege).';
  END;
END
$$;

-- Optional: allow anon delete if you later add delete flow.
-- DROP POLICY IF EXISTS "Allow anon delete from files bucket" ON storage.objects;
-- CREATE POLICY "Allow anon delete from files bucket"
--   ON storage.objects
--   FOR DELETE
--   TO anon
--   USING (bucket_id = 'files');

-- Optional: add an index for faster lookups by ID
CREATE INDEX IF NOT EXISTS idx_files_id ON public.files (id);

-- Optional: cleanup helper — delete expired files
-- You can run this periodically via a Supabase Edge Function or cron job:
-- DELETE FROM public.files
-- WHERE expires_at IS NOT NULL AND expires_at < NOW();
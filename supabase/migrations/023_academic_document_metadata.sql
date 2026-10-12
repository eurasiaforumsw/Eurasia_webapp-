-- Persist academic-library attachments and public author portraits edited by admins.
-- Run before deploying the academic library editor and API changes.
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS author_image text;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS file_type text;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS page_count integer;

ALTER TABLE public.content DROP CONSTRAINT IF EXISTS content_file_size_check;
ALTER TABLE public.content ADD CONSTRAINT content_file_size_check
  CHECK (file_size IS NULL OR file_size > 0);
ALTER TABLE public.content DROP CONSTRAINT IF EXISTS content_page_count_check;
ALTER TABLE public.content ADD CONSTRAINT content_page_count_check
  CHECK (page_count IS NULL OR page_count > 0);

NOTIFY pgrst, 'reload schema';

-- ══════════════════════════════════════════════════════════════
-- EFSW · Migration 005 · Academic content + organization stats
-- Run this in Supabase SQL Editor after migrations 001–004.
-- Idempotent where PostgreSQL permits it.
-- ══════════════════════════════════════════════════════════════

-- 1) Expand content.kind to support the dedicated Academic content type.
-- The original constraint name varies by Supabase/Postgres install, so find
-- and remove every CHECK constraint on public.content that references `kind`.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'content'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%kind%'
  LOOP
    EXECUTE format('ALTER TABLE public.content DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.content
  DROP CONSTRAINT IF EXISTS content_kind_check;

ALTER TABLE public.content
  ADD CONSTRAINT content_kind_check
  CHECK (kind IN ('news', 'document', 'academic', 'event'));

-- 2) SEO metadata used by the Content editor.
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS seo_keywords text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS og_image text;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS canonical_url text;

-- 3) Homepage event slider configuration.
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS show_in_hero_slider boolean NOT NULL DEFAULT false;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS slider_duration integer;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS slider_order integer;

ALTER TABLE public.content
  DROP CONSTRAINT IF EXISTS content_slider_duration_check;

ALTER TABLE public.content
  ADD CONSTRAINT content_slider_duration_check
  CHECK (slider_duration IS NULL OR slider_duration BETWEEN 3000 AND 15000);

CREATE INDEX IF NOT EXISTS content_academic_status_idx
  ON public.content (kind, status, updated_at DESC)
  WHERE kind IN ('document', 'academic');

CREATE INDEX IF NOT EXISTS content_hero_slider_idx
  ON public.content (slider_order ASC NULLS LAST, updated_at DESC)
  WHERE kind = 'event' AND status = 'published' AND show_in_hero_slider = true;

-- 4) Helpful indexes for the public organization statistics endpoint.
CREATE INDEX IF NOT EXISTS members_active_country_idx
  ON public.members (country)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS members_active_joined_idx
  ON public.members (joined_at DESC)
  WHERE status = 'active';

-- 5) Refresh PostgREST’s schema cache immediately.
NOTIFY pgrst, 'reload schema';

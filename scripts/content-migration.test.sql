-- Run only in an EMPTY disposable PostgreSQL database.
-- psql -v ON_ERROR_STOP=1 -f scripts/content-migration.test.sql <temporary-database-url>
\set ON_ERROR_STOP on
BEGIN;

DO $$ BEGIN
  IF to_regclass('public.content') IS NOT NULL OR
     EXISTS (SELECT FROM pg_namespace WHERE nspname = 'auth') THEN
    RAISE EXCEPTION 'Content migration tests require an empty disposable database';
  END IF;
END $$;

CREATE SCHEMA auth;
CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT current_setting('request.jwt.claim.role', true);
$$;

-- A fresh database must still receive both policies.
\ir ../supabase/migrations/001_create_content.sql
DO $$ BEGIN
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content') <> 2 THEN
    RAISE EXCEPTION 'Initial content policies were not created';
  END IF;
END $$;

INSERT INTO public.content (id, kind, title) VALUES ('migration-test', 'news', 'Existing content');

-- Re-running must preserve existing, potentially stricter policy definitions.
ALTER POLICY "public read published" ON public.content USING (status = 'published' AND locale = 'en');
ALTER POLICY "admin full access" ON public.content USING (false) WITH CHECK (false);
CREATE TEMP TABLE original_content_policies AS
  SELECT policyname, permissive, roles, cmd, qual, with_check
  FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content';

\ir ../supabase/migrations/001_create_content.sql
DO $$ BEGIN
  IF EXISTS (
    (SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'content'
     EXCEPT SELECT * FROM original_content_policies)
    UNION ALL
    (SELECT * FROM original_content_policies
     EXCEPT SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'content')
  ) THEN
    RAISE EXCEPTION 'Re-running changed existing policies';
  END IF;
END $$;

-- A partial setup must receive its missing policy even if the other already exists.
DROP POLICY "admin full access" ON public.content;
\ir ../supabase/migrations/001_create_content.sql
DROP POLICY "public read published" ON public.content;
\ir ../supabase/migrations/001_create_content.sql

DO $$ BEGIN
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content') <> 2 OR
     NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.content'::regclass) THEN
    RAISE EXCEPTION 'Missing policies or RLS were not restored';
  END IF;
  IF NOT EXISTS (SELECT FROM public.content WHERE id = 'migration-test' AND title = 'Existing content') THEN
    RAISE EXCEPTION 'Existing content was changed';
  END IF;
END $$;

ROLLBACK;
SELECT 'Content migration tests passed' AS result;

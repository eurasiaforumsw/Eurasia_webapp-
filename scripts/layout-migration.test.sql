-- Run only in an empty disposable PostgreSQL database.
-- psql -v ON_ERROR_STOP=1 -f scripts/layout-migration.test.sql <temporary-database-url>
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('public.members') IS NOT NULL OR to_regclass('public.layout_config') IS NOT NULL THEN
    RAISE EXCEPTION 'Layout migration tests require an empty disposable database';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT NULL::UUID $$;
CREATE TABLE public.members (id TEXT PRIMARY KEY, role TEXT NOT NULL DEFAULT 'member');

-- The documented member schema must support both original layout migrations.
\ir ../supabase/migrations/008_create_layout_config.sql
\ir ../supabase/migrations/013_create_layout_config.sql
INSERT INTO public.members (id, role) VALUES ('member-text-id', 'admin');
UPDATE public.layout_config SET config = '{"heroHeadline":"Persisted heading"}', updated_by = 'member-text-id' WHERE id = 'default';
\ir ../supabase/migrations/028_repair_layout_config.sql
\ir ../supabase/migrations/028_repair_layout_config.sql

DO $$ BEGIN
  IF (SELECT config->>'heroHeadline' FROM public.layout_config WHERE id = 'default') <> 'Persisted heading' THEN
    RAISE EXCEPTION 'Repair overwrote a saved layout';
  END IF;
  IF has_table_privilege('anon', 'public.layout_config', 'INSERT') OR
    has_table_privilege('authenticated', 'public.layout_config', 'UPDATE') THEN
    RAISE EXCEPTION 'Browser clients can bypass application authorization';
  END IF;
  IF NOT has_table_privilege('service_role', 'public.layout_config', 'UPDATE') OR
    NOT has_table_privilege('anon', 'public.layout_config', 'SELECT') THEN
    RAISE EXCEPTION 'Read/write grants are missing';
  END IF;
END $$;

-- Also reproduce an installation whose broken initial migration left no table.
DROP TABLE public.layout_config;
\ir ../supabase/migrations/028_repair_layout_config.sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.layout_config WHERE id = 'default' AND config = '{}'::jsonb) THEN
    RAISE EXCEPTION 'Repair did not create the missing default layout';
  END IF;
END $$;

SELECT 'Layout migration tests passed' AS result;

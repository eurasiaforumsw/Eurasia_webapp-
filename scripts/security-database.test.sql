-- Run only in an EMPTY disposable PostgreSQL database, never against application data.
-- psql -v ON_ERROR_STOP=1 -f scripts/security-database.test.sql <temporary-database-url>
\set ON_ERROR_STOP on

DO $$ BEGIN
  IF to_regclass('public.members') IS NOT NULL OR to_regclass('public.password_resets') IS NOT NULL THEN
    RAISE EXCEPTION 'Security database tests require an empty disposable database';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;

CREATE TABLE public.members (id text PRIMARY KEY, email text UNIQUE NOT NULL, password_hash text NOT NULL);
CREATE TABLE public.password_resets (
  id text PRIMARY KEY, email text NOT NULL, token_hash text NOT NULL, code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL,
  consumed_at timestamptz, created_at timestamptz DEFAULT now()
);
-- Reproduce the old browser grants so the migration must remove them.
GRANT SELECT, INSERT, UPDATE ON public.members TO anon, authenticated;
CREATE POLICY "Anon can read active members" ON public.members FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can register as member" ON public.members FOR INSERT TO anon WITH CHECK (true);

\ir ../supabase/migrations/022_security_hardening.sql
-- Prove the migration can be reapplied.
\ir ../supabase/migrations/022_security_hardening.sql

DO $$ BEGIN
  IF has_table_privilege('anon', 'public.members', 'SELECT') OR
     has_table_privilege('authenticated', 'public.members', 'UPDATE') OR
     has_function_privilege('anon', 'public.consume_security_rate_limit(text,integer,integer)', 'EXECUTE') OR
     has_function_privilege('authenticated', 'public.verify_security_password_reset(text,text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Browser roles retain forbidden privileges';
  END IF;
END $$;

SET ROLE service_role;
DO $$
DECLARE result jsonb;
BEGIN
  result := public.consume_security_rate_limit(repeat('a', 64), 2, 60);
  IF result->>'allowed' <> 'true' OR result->>'remaining' <> '1' THEN RAISE EXCEPTION 'First request failed'; END IF;
  result := public.consume_security_rate_limit(repeat('a', 64), 2, 60);
  IF result->>'allowed' <> 'true' OR result->>'remaining' <> '0' THEN RAISE EXCEPTION 'Second request failed'; END IF;
  result := public.consume_security_rate_limit(repeat('a', 64), 2, 60);
  IF result->>'allowed' <> 'false' OR (result->>'retryAfter')::integer < 1 THEN RAISE EXCEPTION 'Limit not enforced'; END IF;
  UPDATE public.security_rate_limits SET resets_at = clock_timestamp() - interval '1 second';
  result := public.consume_security_rate_limit(repeat('a', 64), 2, 60);
  IF result->>'allowed' <> 'true' THEN RAISE EXCEPTION 'Expired window did not reset'; END IF;
END $$;

INSERT INTO public.members VALUES ('member-test', 'test@example.invalid', 'old-hash');
INSERT INTO public.password_resets (id, email, token_hash, code_hash, expires_at)
VALUES ('reset-test', 'test@example.invalid', repeat('a', 64), repeat('b', 64), now() + interval '15 minutes');

DO $$
DECLARE result jsonb; password_hash text := '$2b$12$' || repeat('x', 53);
BEGIN
  result := public.verify_security_password_reset('reset-test', repeat('a', 64), repeat('c', 64), password_hash);
  IF result->>'ok' <> 'false' OR (SELECT attempts FROM public.password_resets WHERE id = 'reset-test') <> 1 OR
     (SELECT members.password_hash FROM public.members WHERE id = 'member-test') <> 'old-hash' THEN
    RAISE EXCEPTION 'Incorrect code was accepted or attempt was not recorded';
  END IF;
  result := public.verify_security_password_reset('reset-test', repeat('a', 64), repeat('b', 64), NULL);
  IF result->>'ok' <> 'true' OR (SELECT consumed_at FROM public.password_resets WHERE id = 'reset-test') IS NOT NULL THEN
    RAISE EXCEPTION 'Verification-only request incorrectly consumed the reset';
  END IF;
  result := public.verify_security_password_reset('reset-test', repeat('a', 64), repeat('b', 64), password_hash);
  IF result->>'ok' <> 'true' OR (SELECT members.password_hash FROM public.members WHERE id = 'member-test') <> password_hash OR
     (SELECT consumed_at FROM public.password_resets WHERE id = 'reset-test') IS NULL THEN
    RAISE EXCEPTION 'Password change and reset consumption were not committed';
  END IF;
  result := public.verify_security_password_reset('reset-test', repeat('a', 64), repeat('b', 64), password_hash);
  IF result->>'ok' <> 'false' THEN RAISE EXCEPTION 'Reset could be reused'; END IF;
END $$;
RESET ROLE;

SELECT 'Security database tests passed' AS result;

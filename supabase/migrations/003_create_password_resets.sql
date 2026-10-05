-- ══════════════════════════════════════════════════════════════
-- EFSW · Migration 002 · Password reset flow
-- Paste this into Supabase SQL Editor alongside SETUP.sql.
-- It is safe to re-run (all statements are idempotent).
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.password_resets (
  id              text PRIMARY KEY,
  email           text NOT NULL,
  code_hash       text NOT NULL,
  token_hash      text NOT NULL,
  attempts        integer NOT NULL DEFAULT 0,
  expires_at      timestamptz NOT NULL,
  consumed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets (email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON public.password_resets (expires_at);

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages password resets" ON public.password_resets;
CREATE POLICY "Service role manages password resets" ON public.password_resets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Optional cleanup: un-comment the next line to wipe any test rows
-- DELETE FROM public.password_resets;
-- ══════════════════════════════════════════════════════════════
-- EFSW · Migration 004 · Content scheduling + audience targeting
-- Adds display-window and audience fields to public.content.
-- Idempotent — safe to re-run.
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.content ADD COLUMN IF NOT EXISTS publish_at timestamptz;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS target_membership_types text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS target_groups text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS content_expires_idx ON public.content (expires_at);
CREATE INDEX IF NOT EXISTS content_publish_idx ON public.content (publish_at);
CREATE INDEX IF NOT EXISTS content_target_membership_idx ON public.content USING gin (target_membership_types);
CREATE INDEX IF NOT EXISTS content_target_groups_idx ON public.content USING gin (target_groups);
-- Admin console persistence: in-app announcements, audit activity and categories.
-- This migration also makes campaign authors compatible with legacy admin JWTs
-- whose identity is an email address rather than a members.id.

ALTER TABLE public.email_campaigns
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS target_groups TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.email_campaigns
  ADD COLUMN IF NOT EXISTS created_by_actor TEXT,
  ADD COLUMN IF NOT EXISTS body_text TEXT,
  ADD COLUMN IF NOT EXISTS audience TEXT;

CREATE INDEX IF NOT EXISTS idx_campaigns_created_by_actor
  ON public.email_campaigns (created_by_actor);

CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 20000),
  recipient_type TEXT NOT NULL DEFAULT 'all'
    CHECK (recipient_type IN ('all', 'individual')),
  recipient_ids TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_by_actor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '120 days'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_announcements_active
  ON public.admin_announcements (expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_announcements_recipients
  ON public.admin_announcements USING gin (recipient_ids);

CREATE TABLE IF NOT EXISTS public.admin_announcement_reads (
  announcement_id UUID NOT NULL REFERENCES public.admin_announcements(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_announcement_reads_member
  ON public.admin_announcement_reads (member_id, read_at DESC);

CREATE TABLE IF NOT EXISTS public.admin_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT,
  actor_email TEXT,
  action TEXT NOT NULL CHECK (char_length(action) BETWEEN 1 AND 120),
  detail TEXT NOT NULL DEFAULT '',
  tone TEXT NOT NULL DEFAULT 'neutral' CHECK (tone IN ('neutral', 'success', 'warning')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at
  ON public.admin_activity (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_action
  ON public.admin_activity (action);

CREATE TABLE IF NOT EXISTS public.admin_categories (
  id TEXT PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.admin_console_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_admin_announcements_updated_at ON public.admin_announcements;
CREATE TRIGGER trigger_admin_announcements_updated_at
  BEFORE UPDATE ON public.admin_announcements
  FOR EACH ROW EXECUTE FUNCTION public.admin_console_timestamp();

DROP TRIGGER IF EXISTS trigger_admin_categories_updated_at ON public.admin_categories;
CREATE TRIGGER trigger_admin_categories_updated_at
  BEFORE UPDATE ON public.admin_categories
  FOR EACH ROW EXECUTE FUNCTION public.admin_console_timestamp();

-- Atomically claim a campaign. Concurrent send requests can only claim once.
CREATE OR REPLACE FUNCTION public.claim_email_campaign(p_campaign_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  claimed_count INTEGER;
BEGIN
  UPDATE public.email_campaigns
  SET status = 'sending', updated_at = now(), error_message = NULL
  WHERE id = p_campaign_id
    AND status = 'draft';
  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  RETURN claimed_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_email_campaign(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_email_campaign(UUID) TO service_role;

-- Updating a message invalidates every prior read receipt. Do this in one
-- transaction so a narrowed audience cannot retain receipts from old readers.
CREATE OR REPLACE FUNCTION public.edit_admin_announcement(
  p_id UUID,
  p_subject TEXT,
  p_body TEXT,
  p_recipient_type TEXT,
  p_recipient_ids TEXT[]
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.admin_announcements
  SET subject = p_subject,
      body = p_body,
      recipient_type = p_recipient_type,
      recipient_ids = p_recipient_ids
  WHERE id = p_id;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count = 0 THEN RETURN FALSE; END IF;
  DELETE FROM public.admin_announcement_reads WHERE announcement_id = p_id;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.edit_admin_announcement(UUID, TEXT, TEXT, TEXT, TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.edit_admin_announcement(UUID, TEXT, TEXT, TEXT, TEXT[]) TO service_role;

ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_categories ENABLE ROW LEVEL SECURITY;

-- These tables are accessed through service role APIs. Keep direct browser
-- clients from bypassing the route authorization checks.
REVOKE ALL ON TABLE public.admin_announcements,
  public.admin_announcement_reads,
  public.admin_activity,
  public.admin_categories FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.admin_announcements,
  public.admin_announcement_reads,
  public.admin_activity,
  public.admin_categories TO service_role;

REVOKE ALL ON FUNCTION public.admin_console_timestamp() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_console_timestamp() TO service_role;

REVOKE ALL ON TABLE public.email_campaigns, public.campaign_recipients
  FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.email_campaigns, public.campaign_recipients TO service_role;

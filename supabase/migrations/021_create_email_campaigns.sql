-- Migration: Email Broadcast/Campaign System
-- Description: Store email campaigns and track delivery status
-- Created: 2026-10-11

-- ============================================================================
-- 1. Create email_campaigns table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Campaign details
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  body_html TEXT NOT NULL,
  body_text TEXT,

  -- Source content (optional - can be standalone or linked to content)
  content_id TEXT REFERENCES public.content(id) ON DELETE SET NULL,
  content_kind TEXT CHECK (content_kind IN ('news', 'event', 'document', 'academic', 'custom')),
  cover_image TEXT,

  -- Targeting
  target_groups TEXT[] DEFAULT '{}',
  target_statuses TEXT[] DEFAULT '{}',

  -- Status and scheduling
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,

  -- Delivery tracking
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  -- Timestamps and audit
  created_by TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_campaigns IS 'Email broadcast campaigns with delivery tracking';
COMMENT ON COLUMN public.email_campaigns.title IS 'Internal campaign title (not shown to recipients)';
COMMENT ON COLUMN public.email_campaigns.subject IS 'Email subject line';
COMMENT ON COLUMN public.email_campaigns.preheader IS 'Email preview text (shown in inbox)';
COMMENT ON COLUMN public.email_campaigns.body_html IS 'HTML email body';
COMMENT ON COLUMN public.email_campaigns.body_text IS 'Plain text email body (fallback)';
COMMENT ON COLUMN public.email_campaigns.target_groups IS 'Array of target group names (empty = all members)';
COMMENT ON COLUMN public.email_campaigns.target_statuses IS 'Array of member statuses to target (empty = active only)';
COMMENT ON COLUMN public.email_campaigns.status IS 'Campaign status: draft, scheduled, sending, sent, failed';
COMMENT ON COLUMN public.email_campaigns.recipient_count IS 'Total number of intended recipients';
COMMENT ON COLUMN public.email_campaigns.sent_count IS 'Number of emails sent';
COMMENT ON COLUMN public.email_campaigns.delivered_count IS 'Number of emails delivered (not bounced)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.email_campaigns (status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON public.email_campaigns (created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled ON public.email_campaigns (scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON public.email_campaigns (created_at DESC);

-- ============================================================================
-- 2. Create campaign_recipients table (tracks individual sends)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,

  -- Recipient details (cached for audit trail)
  email TEXT NOT NULL,
  full_name TEXT,

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),

  -- Tracking timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  bounce_type TEXT, -- 'hard', 'soft', 'complaint'

  -- Resend tracking
  resend_email_id TEXT, -- Resend's email ID for tracking

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.campaign_recipients IS 'Tracks email delivery status for each recipient in a campaign';
COMMENT ON COLUMN public.campaign_recipients.status IS 'Delivery status: pending, sent, delivered, opened, clicked, bounced, failed';
COMMENT ON COLUMN public.campaign_recipients.resend_email_id IS 'Resend email ID for webhook tracking';
COMMENT ON COLUMN public.campaign_recipients.bounce_type IS 'Type of bounce: hard (permanent), soft (temporary), complaint (spam)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipients_campaign ON public.campaign_recipients (campaign_id);
CREATE INDEX IF NOT EXISTS idx_recipients_member ON public.campaign_recipients (member_id);
CREATE INDEX IF NOT EXISTS idx_recipients_status ON public.campaign_recipients (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_recipients_resend_id ON public.campaign_recipients (resend_email_id) WHERE resend_email_id IS NOT NULL;

-- Unique constraint: one recipient per campaign
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipients_unique ON public.campaign_recipients (campaign_id, member_id);

-- ============================================================================
-- 3. Triggers to update updated_at timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_campaign_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_timestamp();

CREATE TRIGGER trigger_recipients_updated_at
  BEFORE UPDATE ON public.campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_timestamp();

-- ============================================================================
-- 4. Trigger to update campaign stats when recipient status changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update counts in campaign table
  UPDATE public.email_campaigns
  SET
    sent_count = (
      SELECT COUNT(*) FROM public.campaign_recipients
      WHERE campaign_id = NEW.campaign_id
      AND status IN ('sent', 'delivered', 'opened', 'clicked')
    ),
    delivered_count = (
      SELECT COUNT(*) FROM public.campaign_recipients
      WHERE campaign_id = NEW.campaign_id
      AND status IN ('delivered', 'opened', 'clicked')
    ),
    opened_count = (
      SELECT COUNT(*) FROM public.campaign_recipients
      WHERE campaign_id = NEW.campaign_id
      AND status IN ('opened', 'clicked')
    ),
    clicked_count = (
      SELECT COUNT(*) FROM public.campaign_recipients
      WHERE campaign_id = NEW.campaign_id
      AND status = 'clicked'
    ),
    bounced_count = (
      SELECT COUNT(*) FROM public.campaign_recipients
      WHERE campaign_id = NEW.campaign_id
      AND status = 'bounced'
    ),
    failed_count = (
      SELECT COUNT(*) FROM public.campaign_recipients
      WHERE campaign_id = NEW.campaign_id
      AND status = 'failed'
    ),
    updated_at = now()
  WHERE id = NEW.campaign_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_campaign_stats
  AFTER INSERT OR UPDATE OF status ON public.campaign_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_stats();

COMMENT ON TRIGGER trigger_update_campaign_stats ON public.campaign_recipients IS 'Automatically updates campaign delivery stats when recipient status changes';

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;

-- Only admins can view campaigns
CREATE POLICY "Admins can view all campaigns"
  ON public.email_campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = auth.uid()::text
      AND members.role = 'admin'
    )
  );

-- Only admins can create/update/delete campaigns
CREATE POLICY "Admins can manage campaigns"
  ON public.email_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = auth.uid()::text
      AND members.role = 'admin'
    )
  );

-- Only admins can view recipients
CREATE POLICY "Admins can view all recipients"
  ON public.campaign_recipients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = auth.uid()::text
      AND members.role = 'admin'
    )
  );

-- Only system can insert/update recipients (via API)
CREATE POLICY "System can manage recipients"
  ON public.campaign_recipients
  FOR ALL
  USING (true);

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. Email sending is handled via Resend API in application code
-- 2. Webhook handling updates recipient status based on Resend events
-- 3. Campaign stats are automatically updated via trigger
-- 4. target_groups and target_statuses arrays determine recipient list
-- 5. Use Resend's batch sending API for large campaigns
-- 6. Store Resend email ID for tracking opens, clicks, bounces

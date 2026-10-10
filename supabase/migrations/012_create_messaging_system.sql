-- EFSW Messaging System
-- Complete messaging system with anti-spam and suspension features

-- 1. Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id text PRIMARY KEY DEFAULT 'conv_' || gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations (last_message_at DESC NULLS LAST);

-- 2. Conversation participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id text PRIMARY KEY DEFAULT 'part_' || gen_random_uuid()::text,
  conversation_id text NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  member_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  UNIQUE(conversation_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_conversation ON public.conversation_participants (conversation_id);
CREATE INDEX IF NOT EXISTS idx_participants_member ON public.conversation_participants (member_id);

-- 3. Messages table (with 180-day expiration)
CREATE TABLE IF NOT EXISTS public.messages (
  id text PRIMARY KEY DEFAULT 'msg_' || gen_random_uuid()::text,
  conversation_id text NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  has_link boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '180 days'),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_expires ON public.messages (expires_at);

-- 4. Rate limiting table (anti-spam)
CREATE TABLE IF NOT EXISTS public.message_rate_limits (
  member_id text PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  violation_count int NOT NULL DEFAULT 0,
  cooldown_until timestamptz,
  cooldown_seconds int NOT NULL DEFAULT 5
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_cooldown ON public.message_rate_limits (cooldown_until);

-- 5. Member suspensions table
CREATE TABLE IF NOT EXISTS public.member_suspensions (
  id text PRIMARY KEY DEFAULT 'susp_' || gen_random_uuid()::text,
  member_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  suspended_by text REFERENCES public.members(id) ON DELETE SET NULL,
  reason_category text NOT NULL CHECK (reason_category IN (
    'spam_flooding',
    'abusive_language',
    'harassment',
    'inappropriate_content',
    'tos_violation',
    'other'
  )),
  reason_detail text,
  suspension_type text NOT NULL CHECK (suspension_type IN ('temp_24h', 'temp_custom', 'permanent')),
  suspended_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suspensions_member ON public.member_suspensions (member_id, is_active);
CREATE INDEX IF NOT EXISTS idx_suspensions_expires ON public.member_suspensions (expires_at) WHERE is_active = true;

-- 6. Trigger to update conversation.last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- 7. Trigger to update conversations.updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Function to automatically expire old messages (run daily via cron)
CREATE OR REPLACE FUNCTION expire_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM public.messages
  WHERE expires_at < now()
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to deactivate expired suspensions
CREATE OR REPLACE FUNCTION deactivate_expired_suspensions()
RETURNS void AS $$
BEGIN
  UPDATE public.member_suspensions
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- 10. Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_suspensions ENABLE ROW LEVEL SECURITY;

-- Service role has full access to all tables
CREATE POLICY "Service role full access conversations" ON public.conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access participants" ON public.conversation_participants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access messages" ON public.messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access rate limits" ON public.message_rate_limits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access suspensions" ON public.member_suspensions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Notes:
-- 1. Messages automatically expire after 180 days
-- 2. Rate limiting prevents spam (1 message per 5s, escalating cooldown)
-- 3. Suspensions can be temporary (24h, custom days) or permanent
-- 4. Admin can only send links; members can only send text
-- 5. Run expire_old_messages() and deactivate_expired_suspensions() daily via cron

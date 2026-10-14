-- EFSW Message Rate Limiting and Member Suspension System
-- Implements anti-spam measures and member moderation capabilities

-- 1. Migrate message_rate_limits table if it exists with old schema
-- This handles the transition from migration 012 to the new enhanced schema
DO $$
BEGIN
  -- Check if the old table exists without the new columns
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'message_rate_limits'
  ) THEN
    -- Check if it has the old schema (no id column)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'message_rate_limits' AND column_name = 'id'
    ) THEN
      -- Migrate old schema to new schema
      -- Drop existing constraints and indexes
      DROP INDEX IF EXISTS public.idx_rate_limits_cooldown;

      -- Add new columns
      ALTER TABLE public.message_rate_limits
      ADD COLUMN id uuid DEFAULT gen_random_uuid(),
      ADD COLUMN next_allowed_at timestamptz DEFAULT now(),
      ADD COLUMN created_at timestamptz DEFAULT now(),
      ADD COLUMN updated_at timestamptz DEFAULT now();

      -- Make id the primary key (drop old member_id pk)
      ALTER TABLE public.message_rate_limits DROP CONSTRAINT message_rate_limits_pkey;
      ALTER TABLE public.message_rate_limits ADD PRIMARY KEY (id);
      ALTER TABLE public.message_rate_limits ADD UNIQUE(member_id);

      -- Preserve existing cooldowns and legacy columns while switching reads
      -- to next_allowed_at; upgrades must not reset a member's active delay.
      UPDATE public.message_rate_limits
      SET next_allowed_at = COALESCE(cooldown_until, next_allowed_at);
    END IF;
  ELSE
    -- Table doesn't exist, create it with the new schema
    CREATE TABLE public.message_rate_limits (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
      next_allowed_at timestamptz NOT NULL DEFAULT now(),
      violation_count integer NOT NULL DEFAULT 0,
      last_message_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(member_id)
    );
  END IF;
END $$;

COMMENT ON TABLE public.message_rate_limits IS 'Tracks message rate limiting status per member with escalating delays';
COMMENT ON COLUMN public.message_rate_limits.member_id IS 'Reference to the member being rate limited';
COMMENT ON COLUMN public.message_rate_limits.next_allowed_at IS 'Timestamp when member is allowed to send next message';
COMMENT ON COLUMN public.message_rate_limits.violation_count IS 'Number of consecutive rate limit violations (resets on successful send)';
COMMENT ON COLUMN public.message_rate_limits.last_message_at IS 'Timestamp of last successfully sent message';

-- Index for fast lookups by member
CREATE INDEX IF NOT EXISTS idx_rate_limits_member ON public.message_rate_limits (member_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_next_allowed ON public.message_rate_limits (next_allowed_at);

-- 2. Migrate member_suspensions table if it exists with old schema
-- This handles the transition from migration 012 to the new enhanced schema
DO $$
BEGIN
  -- Check if the old table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'member_suspensions'
  ) THEN
    -- Check if it has the old schema (reason_detail instead of reason_details, old constraint values)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'member_suspensions' AND column_name = 'reason_detail'
    ) THEN
      -- Migrate old schema to new schema
      -- Add new columns first
      ALTER TABLE public.member_suspensions
      ADD COLUMN IF NOT EXISTS reason_details text,
      ADD COLUMN IF NOT EXISTS lifted_at timestamptz,
      ADD COLUMN IF NOT EXISTS lifted_by text,
      ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

      -- Copy data from old column to new column
      UPDATE public.member_suspensions
      SET reason_details = COALESCE(reason_details, reason_detail)
      WHERE reason_details IS NULL AND reason_detail IS NOT NULL;

      -- Keep the legacy column for forward compatibility. Migration 027 and
      -- existing reports can still read records created before this change.

      -- Remove old checks before rewriting values. PostgreSQL validates every
      -- UPDATE against the current constraint, so the old labels would make
      -- this migration fail before the normalized checks are installed.
      ALTER TABLE public.member_suspensions
      DROP CONSTRAINT IF EXISTS member_suspensions_suspension_type_check;
      ALTER TABLE public.member_suspensions
      DROP CONSTRAINT IF EXISTS member_suspensions_reason_category_check;

      -- Rename suspension_type values to match new constraints
      UPDATE public.member_suspensions
      SET suspension_type = CASE
        WHEN suspension_type = 'temp_24h' THEN 'temporary_24h'
        WHEN suspension_type = 'temp_custom' THEN 'temporary_custom'
        ELSE suspension_type
      END
      WHERE suspension_type IN ('temp_24h', 'temp_custom');

      -- Rename reason_category values to match new constraints
      UPDATE public.member_suspensions
      SET reason_category = CASE
        WHEN reason_category = 'tos_violation' THEN 'terms_violation'
        ELSE reason_category
      END
      WHERE reason_category = 'tos_violation';

      ALTER TABLE public.member_suspensions
      ADD CONSTRAINT member_suspensions_suspension_type_check
        CHECK (suspension_type IN ('temporary_24h', 'temporary_custom', 'permanent')),
      ADD CONSTRAINT member_suspensions_reason_category_check
        CHECK (reason_category IN ('spam_flooding', 'abusive_language', 'harassment', 'inappropriate_content', 'terms_violation', 'other'));

      -- Drop old indexes and recreate
      DROP INDEX IF EXISTS public.idx_suspensions_member;
      DROP INDEX IF EXISTS public.idx_suspensions_expires;
    END IF;
  ELSE
    -- Table doesn't exist, create it with the new schema
    CREATE TABLE public.member_suspensions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id text NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
      suspended_by text REFERENCES public.members(id),
      suspension_type text NOT NULL CHECK (suspension_type IN ('temporary_24h', 'temporary_custom', 'permanent')),
      reason_category text NOT NULL CHECK (reason_category IN (
        'spam_flooding',
        'abusive_language',
        'harassment',
        'inappropriate_content',
        'terms_violation',
        'other'
      )),
      reason_details text,
      suspended_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz,
      is_active boolean NOT NULL DEFAULT true,
      lifted_at timestamptz,
      lifted_by text REFERENCES public.members(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

COMMENT ON TABLE public.member_suspensions IS 'Tracks member suspensions and bans with full audit trail';
COMMENT ON COLUMN public.member_suspensions.member_id IS 'Member who is suspended';
COMMENT ON COLUMN public.member_suspensions.suspended_by IS 'Admin who issued the suspension';
COMMENT ON COLUMN public.member_suspensions.suspension_type IS 'Type: temporary_24h, temporary_custom, or permanent';
COMMENT ON COLUMN public.member_suspensions.reason_category IS 'Predefined reason category';
COMMENT ON COLUMN public.member_suspensions.reason_details IS 'Additional details about the suspension reason';
COMMENT ON COLUMN public.member_suspensions.expires_at IS 'When suspension expires (NULL for permanent bans)';
COMMENT ON COLUMN public.member_suspensions.is_active IS 'Whether this suspension is currently active';
COMMENT ON COLUMN public.member_suspensions.lifted_at IS 'When suspension was lifted (if applicable)';
COMMENT ON COLUMN public.member_suspensions.lifted_by IS 'Admin who lifted the suspension';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suspensions_member ON public.member_suspensions (member_id);
CREATE INDEX IF NOT EXISTS idx_suspensions_active ON public.member_suspensions (member_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_suspensions_expires ON public.member_suspensions (expires_at) WHERE is_active = true AND expires_at IS NOT NULL;

-- 3. Function to check if a member is currently suspended
CREATE OR REPLACE FUNCTION is_member_suspended(p_member_id text)
RETURNS TABLE (
  is_suspended boolean,
  suspension_type text,
  reason_category text,
  reason_details text,
  suspended_at timestamptz,
  expires_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true as is_suspended,
    ms.suspension_type,
    ms.reason_category,
    ms.reason_details,
    ms.suspended_at,
    ms.expires_at
  FROM public.member_suspensions ms
  WHERE ms.member_id = p_member_id
    AND ms.is_active = true
    AND (
      ms.expires_at IS NULL  -- Permanent ban
      OR ms.expires_at > now()  -- Temporary ban not yet expired
    )
  ORDER BY ms.suspended_at DESC
  LIMIT 1;

  -- If no active suspension found, return false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::timestamptz, NULL::timestamptz;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_member_suspended IS 'Checks if member is currently suspended and returns suspension details';

-- 4. Function to suspend a member
CREATE OR REPLACE FUNCTION suspend_member(
  p_member_id text,
  p_suspended_by text,
  p_suspension_type text,
  p_reason_category text,
  p_reason_details text DEFAULT NULL,
  p_custom_days integer DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_suspension_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Calculate expiry based on suspension type
  CASE p_suspension_type
    WHEN 'temporary_24h' THEN
      v_expires_at := now() + interval '24 hours';
    WHEN 'temporary_custom' THEN
      IF p_custom_days IS NULL OR p_custom_days <= 0 THEN
        RAISE EXCEPTION 'custom_days must be provided and positive for temporary_custom suspension';
      END IF;
      v_expires_at := now() + (p_custom_days || ' days')::interval;
    WHEN 'permanent' THEN
      v_expires_at := NULL;  -- No expiry
    ELSE
      RAISE EXCEPTION 'Invalid suspension_type: %', p_suspension_type;
  END CASE;

  -- Deactivate any existing active suspensions for this member
  UPDATE public.member_suspensions
  SET is_active = false,
      updated_at = now()
  WHERE member_id = p_member_id
    AND is_active = true;

  -- Create new suspension record
  INSERT INTO public.member_suspensions (
    member_id,
    suspended_by,
    suspension_type,
    reason_category,
    reason_details,
    expires_at,
    is_active
  ) VALUES (
    p_member_id,
    p_suspended_by,
    p_suspension_type,
    p_reason_category,
    p_reason_details,
    v_expires_at,
    true
  )
  RETURNING id INTO v_suspension_id;

  RETURN v_suspension_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION suspend_member IS 'Suspends a member with specified type and reason. Returns suspension ID.';

-- 5. Function to lift/remove a suspension
CREATE OR REPLACE FUNCTION lift_suspension(
  p_suspension_id uuid,
  p_lifted_by text
)
RETURNS boolean AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.member_suspensions
  SET is_active = false,
      lifted_at = now(),
      lifted_by = p_lifted_by,
      updated_at = now()
  WHERE id = p_suspension_id
    AND is_active = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION lift_suspension IS 'Lifts an active suspension. Returns true if successful.';

-- 6. Function to automatically expire old suspensions
CREATE OR REPLACE FUNCTION expire_suspensions()
RETURNS integer AS $$
DECLARE
  v_expired_count integer;
BEGIN
  UPDATE public.member_suspensions
  SET is_active = false,
      updated_at = now()
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_suspensions IS 'Automatically deactivates expired suspensions. Returns count of expired suspensions.';

-- 7. Add expires_at column to messages table for 180-day auto-deletion
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

COMMENT ON COLUMN public.messages.expires_at IS 'Timestamp when message will be automatically deleted (180 days from creation)';

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON public.messages (expires_at)
WHERE expires_at IS NOT NULL AND deleted_at IS NULL;

-- 8. Trigger to automatically set expires_at on message insert
CREATE OR REPLACE FUNCTION set_message_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expiry to 180 days from creation
  NEW.expires_at := NEW.created_at + interval '180 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_message_expiry ON public.messages;
CREATE TRIGGER trigger_set_message_expiry
  BEFORE INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION set_message_expiry();

COMMENT ON TRIGGER trigger_set_message_expiry ON public.messages IS 'Automatically sets message expiry to 180 days from creation';

-- 9. Function to delete expired messages
CREATE OR REPLACE FUNCTION delete_expired_messages()
RETURNS integer AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  UPDATE public.messages
  SET deleted_at = now()
  WHERE deleted_at IS NULL
    AND expires_at IS NOT NULL
    AND expires_at <= now();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION delete_expired_messages IS 'Soft-deletes messages past their 180-day expiry. Returns count of deleted messages.';

-- 10. Update existing messages to have expiry dates
UPDATE public.messages
SET expires_at = created_at + interval '180 days'
WHERE expires_at IS NULL;

-- Notes:
-- 1. Rate limiting logic (1 msg/5s with escalating delays) is handled in application code
-- 2. Spam detection (repeated chars, all caps, patterns) is handled in application code
-- 3. Use is_member_suspended() before allowing any member action
-- 4. Use suspend_member() from admin panel to ban members
-- 5. Use lift_suspension() to manually unban members
-- 6. Run expire_suspensions() periodically (e.g., via cron) to auto-expire temp bans
-- 7. Run delete_expired_messages() periodically to clean up old messages
-- 8. All suspensions maintain full audit trail with reasons and timestamps

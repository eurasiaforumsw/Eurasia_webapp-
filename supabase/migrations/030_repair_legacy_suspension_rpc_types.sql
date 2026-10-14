-- Keep legacy suspension RPCs compatible with the text IDs created by
-- 012_create_messaging_system.sql. The admin_* RPCs remain the preferred API.
BEGIN;

DROP FUNCTION IF EXISTS public.suspend_member(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER);
CREATE FUNCTION public.suspend_member(
  p_member_id TEXT,
  p_suspended_by TEXT,
  p_suspension_type TEXT,
  p_reason_category TEXT,
  p_reason_details TEXT DEFAULT NULL,
  p_custom_days INTEGER DEFAULT NULL
) RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_suspension_id TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  CASE p_suspension_type
    WHEN 'temporary_24h' THEN v_expires_at := now() + interval '24 hours';
    WHEN 'temporary_custom' THEN
      IF p_custom_days IS NULL OR p_custom_days <= 0 THEN
        RAISE EXCEPTION 'custom_days must be provided and positive for temporary_custom suspension';
      END IF;
      v_expires_at := now() + (p_custom_days || ' days')::interval;
    WHEN 'permanent' THEN v_expires_at := NULL;
    ELSE RAISE EXCEPTION 'Invalid suspension_type: %', p_suspension_type;
  END CASE;

  UPDATE public.member_suspensions
  SET is_active = false, updated_at = now()
  WHERE member_id = p_member_id AND is_active;

  INSERT INTO public.member_suspensions (
    member_id, suspended_by, suspension_type, reason_category,
    reason_details, expires_at, is_active
  ) VALUES (
    p_member_id, p_suspended_by, p_suspension_type, p_reason_category,
    p_reason_details, v_expires_at, true
  )
  RETURNING id::TEXT INTO v_suspension_id;

  RETURN v_suspension_id;
END;
$$;

DROP FUNCTION IF EXISTS public.lift_suspension(UUID, TEXT);
DROP FUNCTION IF EXISTS public.lift_suspension(TEXT, TEXT);
CREATE FUNCTION public.lift_suspension(
  p_suspension_id TEXT,
  p_lifted_by TEXT
) RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.member_suspensions
  SET is_active = false, lifted_at = now(), lifted_by = p_lifted_by, updated_at = now()
  WHERE id::TEXT = p_suspension_id AND is_active;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.suspend_member(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lift_suspension(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.suspend_member(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.lift_suspension(TEXT, TEXT) TO service_role;

-- Expiring a temporary suspension must also release the member status used by
-- login and messaging checks. Keep the legacy no-argument RPC usable by cron.
CREATE OR REPLACE FUNCTION public.expire_suspensions()
RETURNS INTEGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE public.member_suspensions
  SET is_active = false, updated_at = now()
  WHERE is_active AND expires_at IS NOT NULL AND expires_at <= now();
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  UPDATE public.members m
  SET status = 'active', reviewed_at = now()
  WHERE m.status = 'suspended'
    AND EXISTS (
      SELECT 1 FROM public.member_suspensions expired
      WHERE expired.member_id = m.id AND NOT expired.is_active
        AND expired.expires_at IS NOT NULL AND expired.expires_at <= now()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.member_suspensions active
      WHERE active.member_id = m.id AND active.is_active
        AND (active.expires_at IS NULL OR active.expires_at > now())
    );
  RETURN v_expired_count;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_suspensions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_suspensions() TO service_role;

COMMIT;

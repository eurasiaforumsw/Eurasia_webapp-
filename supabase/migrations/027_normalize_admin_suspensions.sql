-- Normalize legacy suspension records and keep status changes atomic.
BEGIN;

ALTER TABLE public.member_suspensions ADD COLUMN IF NOT EXISTS reason_details TEXT;
ALTER TABLE public.member_suspensions ADD COLUMN IF NOT EXISTS lifted_at TIMESTAMPTZ;
ALTER TABLE public.member_suspensions ADD COLUMN IF NOT EXISTS lifted_by TEXT REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE public.member_suspensions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.member_suspensions ALTER COLUMN suspended_by DROP NOT NULL;
ALTER TABLE public.member_suspensions DROP CONSTRAINT IF EXISTS member_suspensions_suspension_type_check;
ALTER TABLE public.member_suspensions DROP CONSTRAINT IF EXISTS member_suspensions_reason_category_check;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public'
    AND table_name = 'member_suspensions' AND column_name = 'reason_detail') THEN
    UPDATE public.member_suspensions SET reason_details = COALESCE(reason_details, reason_detail);
  END IF;
END;
$$;

UPDATE public.member_suspensions SET suspension_type = CASE suspension_type
  WHEN 'temp_24h' THEN 'temporary_24h' WHEN 'temp_custom' THEN 'temporary_custom' ELSE suspension_type END;
UPDATE public.member_suspensions SET reason_category = 'terms_violation' WHERE reason_category = 'tos_violation';
ALTER TABLE public.member_suspensions ADD CONSTRAINT member_suspensions_suspension_type_check
  CHECK (suspension_type IN ('temporary_24h', 'temporary_custom', 'permanent'));
ALTER TABLE public.member_suspensions ADD CONSTRAINT member_suspensions_reason_category_check
  CHECK (reason_category IN ('spam_flooding', 'abusive_language', 'harassment', 'inappropriate_content', 'terms_violation', 'other'));

CREATE OR REPLACE FUNCTION public.is_member_suspended(p_member_id TEXT)
RETURNS TABLE (
  is_suspended BOOLEAN, suspension_type TEXT, reason_category TEXT,
  reason_details TEXT, suspended_at TIMESTAMPTZ, expires_at TIMESTAMPTZ
) LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT true, ms.suspension_type, ms.reason_category,
    COALESCE(ms.reason_details, NULLIF(to_jsonb(ms)->>'reason_detail', '')),
    ms.suspended_at, ms.expires_at
  FROM public.member_suspensions ms
  WHERE ms.member_id = p_member_id AND ms.is_active
    AND (ms.expires_at IS NULL OR ms.expires_at > now())
  ORDER BY ms.suspended_at DESC LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.is_member_suspended(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_member_suspended(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_suspend_member(
  p_member_id TEXT, p_actor_id TEXT, p_suspension_type TEXT, p_reason_category TEXT,
  p_reason_details TEXT DEFAULT NULL, p_custom_days INTEGER DEFAULT NULL
) RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_id TEXT;
  v_role TEXT;
  v_actor TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT role INTO v_role FROM public.members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Member not found'; END IF;
  IF p_member_id = p_actor_id OR v_role IN ('admin', 'super-admin') THEN
    RAISE EXCEPTION 'Cannot suspend your own account or an administrator';
  END IF;
  SELECT id INTO v_actor FROM public.members WHERE id = p_actor_id;
  CASE p_suspension_type
    WHEN 'temporary_24h' THEN v_expires := now() + interval '24 hours';
    WHEN 'temporary_custom' THEN
      IF p_custom_days IS NULL OR p_custom_days < 1 OR p_custom_days > 3650 THEN
        RAISE EXCEPTION 'Custom days must be between 1 and 3650';
      END IF;
      v_expires := now() + p_custom_days * interval '1 day';
    WHEN 'permanent' THEN v_expires := NULL;
    ELSE RAISE EXCEPTION 'Invalid suspension type';
  END CASE;
  UPDATE public.member_suspensions SET is_active = false, lifted_at = now(), lifted_by = v_actor, updated_at = now()
  WHERE member_id = p_member_id AND is_active;
  INSERT INTO public.member_suspensions(member_id, suspended_by, suspension_type, reason_category, reason_details, expires_at)
  VALUES (p_member_id, v_actor, p_suspension_type, p_reason_category, p_reason_details, v_expires)
  RETURNING id::text INTO v_id;
  UPDATE public.members SET status = 'suspended', reviewed_at = now() WHERE id = p_member_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_lift_suspension(p_suspension_id TEXT, p_actor_id TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_member TEXT;
  v_actor TEXT;
BEGIN
  SELECT member_id INTO v_member FROM public.member_suspensions WHERE id::text = p_suspension_id AND is_active;
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM 1 FROM public.members WHERE id = v_member FOR UPDATE;
  SELECT id INTO v_actor FROM public.members WHERE id = p_actor_id;
  UPDATE public.member_suspensions SET is_active = false, lifted_at = now(), lifted_by = v_actor, updated_at = now()
  WHERE id::text = p_suspension_id AND is_active;
  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.member_suspensions WHERE member_id = v_member AND is_active
    AND (expires_at IS NULL OR expires_at > now())) THEN
    UPDATE public.members SET status = 'active', reviewed_at = now() WHERE id = v_member;
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_suspend_member(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_lift_suspension(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_suspend_member(TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_lift_suspension(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.expire_member_suspensions(p_member_id TEXT)
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_status TEXT;
  v_expired INTEGER;
BEGIN
  SELECT status INTO v_status FROM public.members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Member not found'; END IF;
  UPDATE public.member_suspensions SET is_active = false, updated_at = now()
  WHERE member_id = p_member_id AND is_active AND suspension_type IN ('temporary_24h', 'temporary_custom')
    AND expires_at IS NOT NULL AND expires_at <= now();
  GET DIAGNOSTICS v_expired = ROW_COUNT;
  IF v_expired > 0 AND v_status = 'suspended' AND NOT EXISTS (
    SELECT 1 FROM public.member_suspensions WHERE member_id = p_member_id AND is_active
      AND (expires_at IS NULL OR expires_at > now())
  ) THEN
    UPDATE public.members SET status = 'active' WHERE id = p_member_id;
    v_status := 'active';
  END IF;
  RETURN v_status;
END;
$$;
REVOKE ALL ON FUNCTION public.expire_member_suspensions(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_member_suspensions(TEXT) TO service_role;
COMMIT;

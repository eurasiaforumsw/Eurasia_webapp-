-- Keep account review and enforced suspension in one transaction.
BEGIN;

ALTER TABLE public.members ADD COLUMN IF NOT EXISTS review_note TEXT NOT NULL DEFAULT '';
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE public.member_suspensions ADD COLUMN IF NOT EXISTS reason_details TEXT;
ALTER TABLE public.member_suspensions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.member_suspensions ADD COLUMN IF NOT EXISTS lifted_at TIMESTAMPTZ;
ALTER TABLE public.member_suspensions ADD COLUMN IF NOT EXISTS lifted_by TEXT REFERENCES public.members(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.admin_review_member(
  p_member_id TEXT, p_status TEXT, p_actor_id TEXT, p_review_note TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  v_role TEXT;
  v_actor TEXT;
BEGIN
  IF p_status NOT IN ('pending', 'active', 'suspended') THEN
    RAISE EXCEPTION 'Invalid member status';
  END IF;
  SELECT role INTO v_role FROM public.members WHERE id = p_member_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Member not found'; END IF;
  IF p_member_id = p_actor_id OR v_role IN ('admin', 'super-admin') THEN
    RAISE EXCEPTION 'Cannot modify your own account or an administrator';
  END IF;
  SELECT id INTO v_actor FROM public.members WHERE id = p_actor_id;
  IF p_status = 'suspended' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.member_suspensions WHERE member_id = p_member_id AND is_active
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN
      INSERT INTO public.member_suspensions(member_id, suspended_by, reason_category, reason_details, suspension_type)
      VALUES (p_member_id, v_actor, 'other', COALESCE(p_review_note, 'Account suspended by administrator'), 'permanent');
    END IF;
  ELSE
    UPDATE public.member_suspensions SET is_active = false, lifted_at = now(), lifted_by = v_actor, updated_at = now()
    WHERE member_id = p_member_id AND is_active;
  END IF;
  UPDATE public.members SET status = p_status, review_note = COALESCE(p_review_note, review_note), reviewed_at = now()
  WHERE id = p_member_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_review_member(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_member(TEXT, TEXT, TEXT, TEXT) TO service_role;

COMMIT;

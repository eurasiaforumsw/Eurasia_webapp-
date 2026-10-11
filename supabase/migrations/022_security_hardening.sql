-- Apply before deploying the security changes. Re-runnable; no application rows are deleted.
BEGIN;

-- The application uses its own JWTs and server APIs, not Supabase Auth identities.
-- Direct browser access must never expose password hashes or allow a role to be supplied.
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon can read active members" ON public.members;
DROP POLICY IF EXISTS "Anon can register as member" ON public.members;
REVOKE ALL ON public.members FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO service_role;

DO $$
DECLARE
  table_name text;
  fn regprocedure;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'password_resets', 'member_sessions', 'member_activity', 'member_interests', 'content_likes',
    'conversations', 'conversation_participants', 'messages', 'member_suspensions',
    'message_rate_limits', 'email_campaigns', 'campaign_recipients',
    'event_registrations', 'event_registration_answers', 'audit_logs'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO service_role', table_name);
    END IF;
  END LOOP;
  -- Keep public content reads while making all writes go through protected APIs.
  FOREACH table_name IN ARRAY ARRAY[
    'content', 'layout_config', 'site_settings', 'event_registration_settings', 'event_registration_fields'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.%I FROM PUBLIC, anon, authenticated', table_name);
    END IF;
  END LOOP;
  -- Functions are executable by PUBLIC by default, including SECURITY DEFINER functions.
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY(ARRAY[
      'get_member_engagement_stats', 'update_session_activity', 'cleanup_expired_sessions',
      'get_top_liked_content', 'get_top_viewed_content', 'get_top_saved_content',
      'is_member_suspended', 'suspend_member', 'lift_suspension', 'expire_suspensions',
      'delete_expired_messages'
    ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  bucket_key text PRIMARY KEY,
  request_count integer NOT NULL CHECK (request_count > 0),
  resets_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS security_rate_limits_expiry ON public.security_rate_limits (resets_at);
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_security_rate_limit(
  p_key text, p_limit integer, p_window_seconds integer
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  bucket public.security_rate_limits%ROWTYPE;
  now_at timestamptz := clock_timestamp();
BEGIN
  IF p_key IS NULL OR length(p_key) <> 64 OR p_limit < 1 OR p_limit > 10000 OR
     p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;
  INSERT INTO public.security_rate_limits (bucket_key, request_count, resets_at)
  VALUES (p_key, 1, now_at + make_interval(secs => p_window_seconds))
  ON CONFLICT (bucket_key) DO UPDATE SET
    request_count = CASE WHEN security_rate_limits.resets_at <= now_at THEN 1
      ELSE LEAST(security_rate_limits.request_count + 1, p_limit + 1) END,
    resets_at = CASE WHEN security_rate_limits.resets_at <= now_at
      THEN now_at + make_interval(secs => p_window_seconds) ELSE security_rate_limits.resets_at END
  RETURNING * INTO bucket;
  -- Indexed expiry cleanup bounds storage without an additional scheduled job.
  IF random() < 0.01 THEN DELETE FROM public.security_rate_limits WHERE resets_at < now_at; END IF;
  RETURN jsonb_build_object(
    'allowed', bucket.request_count <= p_limit,
    'remaining', GREATEST(0, p_limit - bucket.request_count),
    'retryAfter', GREATEST(1, ceil(extract(epoch FROM bucket.resets_at - now_at))::integer)
  );
END $$;
REVOKE ALL ON FUNCTION public.consume_security_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_security_rate_limit(text, integer, integer) TO service_role;

-- Lock the reset row while checking attempts and committing the password change.
-- Both verification-only and final submission require the token AND the code.
CREATE OR REPLACE FUNCTION public.verify_security_password_reset(
  p_reset_id text, p_token_hash text, p_code_hash text, p_password_hash text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  reset public.password_resets%ROWTYPE;
  changed integer;
BEGIN
  SELECT * INTO reset FROM public.password_resets WHERE id = p_reset_id FOR UPDATE;
  IF NOT FOUND OR reset.consumed_at IS NOT NULL OR reset.expires_at <= clock_timestamp() OR
     reset.token_hash IS DISTINCT FROM p_token_hash OR reset.attempts >= 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invalid or expired reset details.');
  END IF;
  IF reset.code_hash IS DISTINCT FROM p_code_hash THEN
    UPDATE public.password_resets SET attempts = attempts + 1 WHERE id = reset.id;
    RETURN jsonb_build_object('ok', false, 'error', 'Incorrect code. Please try again.');
  END IF;
  IF p_password_hash IS NOT NULL THEN
    IF p_password_hash !~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$' THEN
      RAISE EXCEPTION 'Invalid password hash';
    END IF;
    UPDATE public.members SET password_hash = p_password_hash WHERE email = reset.email;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed <> 1 THEN RAISE EXCEPTION 'Member account unavailable'; END IF;
    UPDATE public.password_resets SET consumed_at = clock_timestamp()
    WHERE email = reset.email AND consumed_at IS NULL;
  END IF;
  RETURN jsonb_build_object('ok', true, 'resetId', reset.id, 'email', reset.email);
END $$;
REVOKE ALL ON FUNCTION public.verify_security_password_reset(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_security_password_reset(text, text, text, text) TO service_role;

COMMIT;

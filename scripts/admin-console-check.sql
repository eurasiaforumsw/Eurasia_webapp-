-- Read-only readiness check. Run after migrations 023-028 in the SQL editor.
WITH required(name) AS (VALUES
  ('public.members'), ('public.content'), ('public.layout_config'),
  ('public.site_settings'), ('public.email_campaigns'), ('public.campaign_recipients'),
  ('public.member_suspensions'), ('public.admin_announcements'),
  ('public.admin_announcement_reads'), ('public.admin_activity'),
  ('public.admin_categories'), ('public.academic_document_engagement')
)
SELECT name AS requirement, to_regclass(name) IS NOT NULL AS ready FROM required;

WITH required(table_name, column_name) AS (VALUES
  ('content', 'author_image'), ('content', 'featured'), ('content', 'file_url'),
  ('content', 'file_name'), ('content', 'file_size'), ('content', 'file_type'),
  ('content', 'page_count'), ('members', 'review_note'), ('members', 'reviewed_at'),
  ('members', 'target_groups'), ('email_campaigns', 'audience'),
  ('email_campaigns', 'created_by_actor'), ('member_suspensions', 'reason_details'),
  ('member_suspensions', 'lifted_at'), ('member_suspensions', 'lifted_by'),
  ('layout_config', 'id'), ('layout_config', 'config'),
  ('layout_config', 'updated_at'), ('layout_config', 'updated_by')
)
SELECT r.table_name || '.' || r.column_name AS requirement,
  EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public'
    AND c.table_name = r.table_name AND c.column_name = r.column_name) AS ready
FROM required r;

-- Layout can be read publicly; mutations must use the protected service API.
WITH layout AS (SELECT to_regclass('public.layout_config') AS table_id),
required(requirement, ready) AS (VALUES
  ('layout_config public SELECT grant', (
    SELECT table_id IS NOT NULL AND has_table_privilege('anon', table_id, 'SELECT')
      AND has_table_privilege('authenticated', table_id, 'SELECT') FROM layout
  )),
  ('layout_config browser mutations revoked', (
    SELECT table_id IS NOT NULL
      AND NOT has_table_privilege('anon', table_id, 'INSERT, UPDATE, DELETE, TRUNCATE')
      AND NOT has_table_privilege('authenticated', table_id, 'INSERT, UPDATE, DELETE, TRUNCATE')
    FROM layout
  )),
  ('layout_config service-role writes', (
    SELECT table_id IS NOT NULL
      AND has_table_privilege('service_role', table_id, 'SELECT')
      AND has_table_privilege('service_role', table_id, 'INSERT')
      AND has_table_privilege('service_role', table_id, 'UPDATE') FROM layout
  )),
  ('layout_config row security enabled', EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'layout_config' AND c.relrowsecurity
  )),
  ('layout_config public read policy', EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'layout_config'
      AND policyname = 'Public can view layout config' AND cmd = 'SELECT'
  )),
  ('layout_config.updated_by TEXT', EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'layout_config'
      AND column_name = 'updated_by' AND data_type = 'text'
  ))
)
SELECT requirement, ready FROM required;

WITH required(name) AS (VALUES
  ('public.claim_email_campaign(uuid)'),
  ('public.edit_admin_announcement(uuid,text,text,text,text[])'),
  ('public.admin_review_member(text,text,text,text)'),
  ('public.admin_suspend_member(text,text,text,text,text,integer)'),
  ('public.admin_lift_suspension(text,text)'),
  ('public.expire_member_suspensions(text)'),
  ('public.is_member_suspended(text)'),
  ('public.consume_security_rate_limit(text,integer,integer)')
)
SELECT name AS requirement, to_regprocedure(name) IS NOT NULL AS ready FROM required;

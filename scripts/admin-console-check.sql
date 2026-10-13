-- Read-only readiness check. Run after migrations 023-027 in the SQL editor.
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
  ('member_suspensions', 'lifted_at'), ('member_suspensions', 'lifted_by')
)
SELECT r.table_name || '.' || r.column_name AS requirement,
  EXISTS(SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public'
    AND c.table_name = r.table_name AND c.column_name = r.column_name) AS ready
FROM required r;

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

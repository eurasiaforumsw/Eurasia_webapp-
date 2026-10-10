-- Test script to verify messaging system database schema
-- Run this in Supabase SQL Editor to test the migration

-- 1. Verify tables exist
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'conversations',
    'conversation_participants',
    'messages',
    'message_rate_limits',
    'member_suspensions'
  )
ORDER BY table_name;

-- 2. Test creating a conversation
INSERT INTO public.conversations DEFAULT VALUES
RETURNING *;

-- 3. Test creating participants (use real member IDs from your database)
-- Replace 'member_id_1' and 'member_id_2' with actual member IDs
-- INSERT INTO public.conversation_participants (conversation_id, member_id)
-- VALUES
--   ('conv_xxx', 'member_id_1'),
--   ('conv_xxx', 'member_id_2');

-- 4. Verify indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'conversations',
    'conversation_participants',
    'messages',
    'message_rate_limits',
    'member_suspensions'
  )
ORDER BY tablename, indexname;

-- 5. Verify RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'conversations',
    'conversation_participants',
    'messages',
    'message_rate_limits',
    'member_suspensions'
  )
ORDER BY tablename, policyname;

-- 6. Verify triggers
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('conversations', 'messages')
ORDER BY event_object_table, trigger_name;

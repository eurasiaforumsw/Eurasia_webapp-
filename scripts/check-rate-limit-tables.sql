-- Check if message_rate_limits table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'message_rate_limits'
) as rate_limits_exists;

-- Check if member_suspensions table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'member_suspensions'
) as suspensions_exists;

-- Check if expires_at column exists in messages table
SELECT EXISTS (
  SELECT FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'messages'
  AND column_name = 'expires_at'
) as messages_expiry_exists;

-- Check functions
SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'is_member_suspended'
) as is_suspended_function_exists;

SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'suspend_member'
) as suspend_function_exists;

SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'lift_suspension'
) as lift_function_exists;

SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'expire_suspensions'
) as expire_function_exists;

SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'delete_expired_messages'
) as delete_expired_function_exists;

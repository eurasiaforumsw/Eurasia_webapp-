# 🚀 Apply Suspension System Migration

## Quick Command (Run this in terminal)

```bash
# Navigate to project root
cd /Users/rischen/Documents/GitHub/Eurasia_webapp

# The migration file is ready at:
# supabase/migrations/016_message_rate_limiting_and_suspensions.sql

# You need to apply it manually in Supabase Dashboard:
# https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/sql
```

## Manual Steps

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/sql
2. Click "New Query"
3. Copy entire contents of `supabase/migrations/016_message_rate_limiting_and_suspensions.sql`
4. Paste into SQL Editor
5. Click "Run" button
6. Verify success (should see "Success. No rows returned")

## Then Test

```bash
npm run dev  # Start server if not running
bash scripts/run-suspension-test.sh
```

## What This Migration Creates

- ✅ `member_suspensions` table (stores suspension records)
- ✅ `message_rate_limits` table (tracks message spam)
- ✅ `suspend_member()` function (creates suspension)
- ✅ `lift_suspension()` function (removes suspension)
- ✅ `expire_suspensions()` function (auto-expire old bans)
- ✅ `check_member_suspension()` function (check if member is suspended)
- ✅ Row Level Security policies
- ✅ Indexes for performance

# Apply Event Registration Migration

## Quick Start

Run this command to apply the database migration:

```bash
npx supabase db push
```

## Alternative: Manual SQL Execution

If the CLI method doesn't work, apply the migration manually:

1. Go to https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/editor
2. Open SQL Editor
3. Copy and paste the contents of:
   `/supabase/migrations/014_create_event_registration_system.sql`
4. Click "Run" to execute

## What This Migration Does

Creates 4 tables:
- `event_registration_settings` - Controls when/how registration works
- `event_registration_fields` - Custom form fields per event
- `event_registrations` - Stores user registrations
- `event_registration_answers` - Stores form responses

Includes sample data for the `regional-summit-2024` event.

## Verify Migration Success

After applying, run these queries in SQL Editor to verify:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'event_registration%';

-- Check sample data
SELECT * FROM event_registration_settings WHERE event_id = 'regional-summit-2024';
SELECT * FROM event_registration_fields WHERE event_id = 'regional-summit-2024';
```

You should see:
- 4 tables created
- 1 registration setting for regional-summit-2024
- 4 registration fields (full_name, email, organization, dietary_requirements)

## After Migration

1. Restart the dev server:
   ```bash
   npm run dev
   ```

2. Visit: http://localhost:2024/events/regional-summit-2024

3. You should see the registration section below the event content

4. Test the registration flow:
   - Login first (required for registration)
   - Click "Register Now"
   - Fill out the form
   - Submit and verify confirmation number appears

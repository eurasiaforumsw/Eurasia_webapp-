-- ============================================================================
-- SEED FILE: Admin & PR/News Editor Accounts
-- ============================================================================
--
-- PURPOSE: Create 3 accounts with role-based access control (RBAC):
--   - 2 Admin accounts (full access to /admin console)
--   - 1 PR/News Editor account (limited access to News, Events, Academic only)
--
-- INSTRUCTIONS:
--   1. Open Supabase Dashboard → SQL Editor
--   2. Copy and paste this entire file
--   3. Click "Run" to execute
--   4. Verify in the "members" table that 3 new rows appear
--
-- CREDENTIALS:
--   Admin 1:  admin@efsw.local   / EFSW-secure-admin-2024
--   Admin 2:  admin2@efsw.local  / EFSW-admin2-secure-2024
--   PR/News:  news@efsw.local    / EFSW-news-pr-2024
--
-- NOTES:
--   - All passwords are bcrypt hashed (12 rounds)
--   - All accounts are pre-verified and active
--   - IDs use email as TEXT (matches members table schema)
--   - Uses INSERT ... ON CONFLICT to update existing accounts
-- ============================================================================

-- Update existing admin@efsw.local (this account already exists)
UPDATE members
SET role = 'admin',
    email_verified_at = NOW(),
    status = 'active',
    updated_at = NOW()
WHERE email = 'admin@efsw.local';

-- Insert Admin Account 2 (or update if exists)
INSERT INTO members (
  id,
  email,
  full_name,
  password_hash,
  role,
  status,
  email_verified_at,
  membership_type,
  country,
  organization,
  position,
  expertise,
  bio,
  created_at,
  updated_at
) VALUES (
  'admin2@efsw.local',
  'admin2@efsw.local',
  'Secondary Administrator',
  '$2a$12$chSKYvYg6bIy7ouWLhWFCOZv9VbEwyfn7nqSSqOjbr0oEBAMTRVFu',
  'admin',
  'active',
  NOW(),
  'institutional',
  'Thailand',
  'EFSW',
  'Administrator',
  'Platform Management',
  'Secondary administrator account',
  NOW(),
  NOW()
)
ON CONFLICT (email)
DO UPDATE SET
  role = 'admin',
  password_hash = EXCLUDED.password_hash,
  email_verified_at = NOW(),
  status = 'active',
  updated_at = NOW();

-- Insert PR/News Editor Account (or update if exists)
INSERT INTO members (
  id,
  email,
  full_name,
  password_hash,
  role,
  status,
  email_verified_at,
  membership_type,
  country,
  organization,
  position,
  expertise,
  bio,
  created_at,
  updated_at
) VALUES (
  'news@efsw.local',
  'news@efsw.local',
  'News Editor',
  '$2a$12$xjQ/noryZsiHWZAmIyNlzuNyq0OSCOMN8Q/Jw3.Jthkm/QF4VThh.',
  'pr',
  'active',
  NOW(),
  'professional',
  'Thailand',
  'EFSW',
  'PR & News Editor',
  'Content Management, News Publishing',
  'PR and news editor with access to content management',
  NOW(),
  NOW()
)
ON CONFLICT (email)
DO UPDATE SET
  role = 'pr',
  password_hash = EXCLUDED.password_hash,
  email_verified_at = NOW(),
  status = 'active',
  updated_at = NOW();

-- Verify the inserts
SELECT
  id,
  email,
  full_name,
  role,
  status,
  email_verified_at,
  created_at
FROM members
WHERE email IN ('admin@efsw.local', 'admin2@efsw.local', 'news@efsw.local')
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'pr' THEN 2
    ELSE 3
  END;

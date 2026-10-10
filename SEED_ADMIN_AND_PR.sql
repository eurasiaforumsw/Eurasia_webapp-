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
--   - Created at timestamps use current time
-- ============================================================================

-- Insert Admin Account 1
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
  'admin@efsw.local',
  'admin@efsw.local',
  'System Administrator',
  '$2a$12$bSjN2DKzUO6gMY1OInerpOvuD2B8GnoEPdPE97Npa2ZFJappmsZwO',
  'admin',
  'active',
  NOW(),
  'institutional',
  'Thailand',
  'EFSW',
  'System Administrator',
  'Platform Management',
  'System administrator account',
  NOW(),
  NOW()
);

-- Insert Admin Account 2
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
);

-- Insert PR/News Editor Account
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
);

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

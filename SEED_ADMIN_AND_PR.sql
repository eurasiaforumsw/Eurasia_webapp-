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
--   - UUIDs are generated automatically
--   - Created at timestamps use current time
-- ============================================================================

-- Insert Admin Account 1
INSERT INTO members (
  email,
  password_hash,
  role,
  status,
  email_verified,
  first_name,
  last_name,
  membership_type,
  created_at,
  updated_at
) VALUES (
  'admin@efsw.local',
  '$2a$12$bSjN2DKzUO6gMY1OInerpOvuD2B8GnoEPdPE97Npa2ZFJappmsZwO',
  'admin',
  'active',
  true,
  'System',
  'Administrator',
  'institutional',
  NOW(),
  NOW()
);

-- Insert Admin Account 2
INSERT INTO members (
  email,
  password_hash,
  role,
  status,
  email_verified,
  first_name,
  last_name,
  membership_type,
  created_at,
  updated_at
) VALUES (
  'admin2@efsw.local',
  '$2a$12$chSKYvYg6bIy7ouWLhWFCOZv9VbEwyfn7nqSSqOjbr0oEBAMTRVFu',
  'admin',
  'active',
  true,
  'Secondary',
  'Administrator',
  'institutional',
  NOW(),
  NOW()
);

-- Insert PR/News Editor Account
INSERT INTO members (
  email,
  password_hash,
  role,
  status,
  email_verified,
  first_name,
  last_name,
  membership_type,
  created_at,
  updated_at
) VALUES (
  'news@efsw.local',
  '$2a$12$xjQ/noryZsiHWZAmIyNlzuNyq0OSCOMN8Q/Jw3.Jthkm/QF4VThh.',
  'pr',
  'active',
  true,
  'News',
  'Editor',
  'professional',
  NOW(),
  NOW()
);

-- Verify the inserts
SELECT
  email,
  role,
  status,
  email_verified,
  first_name,
  last_name,
  created_at
FROM members
WHERE email IN ('admin@efsw.local', 'admin2@efsw.local', 'news@efsw.local')
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'pr' THEN 2
    ELSE 3
  END;

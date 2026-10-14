-- ============================================================================
-- COMPLETE AUTHENTICATION SETUP
-- ============================================================================
-- This script ensures all required columns, migrations, and accounts exist
-- Run this in Supabase SQL Editor to fix authentication issues
-- ============================================================================

-- Step 1: Ensure role column exists
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'role'
    ) THEN
        ALTER TABLE members ADD COLUMN role TEXT DEFAULT 'member';
        ALTER TABLE members ADD CONSTRAINT members_role_check
            CHECK (role IN ('admin', 'pr', 'member'));
        CREATE INDEX idx_members_role ON members(role);
        RAISE NOTICE 'Added role column to members table';
    ELSE
        RAISE NOTICE 'Role column already exists';
    END IF;
END $$;

-- Step 2: Ensure email verification columns exist
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'members' AND column_name = 'email_verified_at'
    ) THEN
        ALTER TABLE members ADD COLUMN verification_token TEXT;
        ALTER TABLE members ADD COLUMN email_verified_at TIMESTAMPTZ;
        CREATE INDEX idx_members_verification_token ON members(verification_token)
            WHERE verification_token IS NOT NULL;
        CREATE INDEX idx_members_email_verified ON members(email_verified_at)
            WHERE email_verified_at IS NULL;
        RAISE NOTICE 'Added email verification columns';
    ELSE
        RAISE NOTICE 'Email verification columns already exist';
    END IF;
END $$;

-- Step 3: Create/Update Admin Account
-- ============================================================================
-- Password: <configured-admin-password>
INSERT INTO members (
    id,
    email,
    password_hash,
    full_name,
    country,
    membership_type,
    organization,
    position,
    expertise,
    bio,
    status,
    role,
    email_verified_at,
    joined_at,
    created_at,
    updated_at
) VALUES (
    'admin@efsw.local',
    'admin@efsw.local',
    '<replace-with-bcrypt-hash>',
    'System Administrator',
    'Thailand',
    'institutional',
    'EFSW',
    'Administrator',
    'Platform Management',
    'Primary administrator account with full access to all features',
    'active',
    'admin',
    NOW(),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = 'admin',
    status = 'active',
    email_verified_at = NOW(),
    updated_at = NOW();

-- Step 4: Create/Update Demo Member Account
-- ============================================================================
-- Password: EFSW-member-demo-2024
INSERT INTO members (
    id,
    email,
    password_hash,
    full_name,
    country,
    membership_type,
    organization,
    position,
    expertise,
    bio,
    status,
    role,
    email_verified_at,
    joined_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'member@efsw.local',
    '<replace-with-bcrypt-hash>',
    'Demo Member',
    'Thailand',
    'professional',
    'Eurasia Forum for Social Workers',
    'Social Worker',
    'Community Development, Mental Health, Child Protection',
    'Demo account for testing member features',
    'active',
    'member',
    NOW(),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = 'member',
    status = 'active',
    email_verified_at = NOW(),
    updated_at = NOW();

-- Step 5: Create/Update PR/News Editor Account
-- ============================================================================
-- Password: EFSW-news-pr-2024
INSERT INTO members (
    id,
    email,
    password_hash,
    full_name,
    country,
    membership_type,
    organization,
    position,
    expertise,
    bio,
    status,
    role,
    email_verified_at,
    joined_at,
    created_at,
    updated_at
) VALUES (
    'news@efsw.local',
    'news@efsw.local',
    '<replace-with-bcrypt-hash>',
    'News Editor',
    'Thailand',
    'professional',
    'EFSW',
    'PR & News Editor',
    'Content Management, News Publishing',
    'PR and news editor with access to content management',
    'active',
    'pr',
    NOW(),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    role = 'pr',
    status = 'active',
    email_verified_at = NOW(),
    updated_at = NOW();

-- Step 6: Verify setup
-- ============================================================================
SELECT
    '✅ Setup Complete' as status,
    COUNT(*) as total_members,
    COUNT(*) FILTER (WHERE role = 'admin') as admins,
    COUNT(*) FILTER (WHERE role = 'pr') as pr_editors,
    COUNT(*) FILTER (WHERE role = 'member') as members,
    COUNT(*) FILTER (WHERE email_verified_at IS NOT NULL) as verified
FROM members;

-- Display all test accounts
SELECT
    email,
    full_name,
    role,
    status,
    email_verified_at IS NOT NULL as verified,
    created_at
FROM members
WHERE email IN ('admin@efsw.local', 'member@efsw.local', 'news@efsw.local')
ORDER BY
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'pr' THEN 2
        ELSE 3
    END;

-- ============================================================================
-- CREDENTIALS FOR TESTING:
-- ============================================================================
-- Admin:       admin@efsw.local    / <configured-admin-password>
-- Member:      member@efsw.local   / EFSW-member-demo-2024
-- PR Editor:   news@efsw.local     / EFSW-news-pr-2024
-- ============================================================================

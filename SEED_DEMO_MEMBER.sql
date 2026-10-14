-- ============================================================================
-- SEED DEMO MEMBER ACCOUNT
-- ============================================================================
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/sql/new
-- 2. Copy-paste this entire file
-- 3. Click "Run"
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
    'Demo account for testing member features including like, save, view, and share functionalities.',
    'active',
    NOW(),
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    status = 'active',
    email_verified_at = NOW(),
    updated_at = NOW();

-- Verify the member was created
SELECT
    id,
    email,
    full_name,
    status,
    email_verified_at,
    membership_type,
    joined_at
FROM members
WHERE email = 'member@efsw.local';

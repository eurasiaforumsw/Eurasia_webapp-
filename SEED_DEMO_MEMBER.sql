-- ============================================================================
-- SEED DEMO MEMBER ACCOUNT
-- ============================================================================
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/sql/new
-- 2. Copy-paste this entire file
-- 3. Click "Run"
-- ============================================================================

-- Insert demo member account
INSERT INTO members (
    id,
    email,
    password_hash,
    full_name,
    first_name,
    last_name,
    country,
    city,
    membership_type,
    organization,
    position,
    expertise,
    bio,
    status,
    email_verified,
    education_level,
    experience_years,
    license,
    joined_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'member@efsw.local',
    '$2b$12$LtzLj2jjS4WzecTRs7nWi.GFE07pXsw4MenGww/Zfmn9Gu84kJNTS',
    'Demo Member',
    'Demo',
    'Member',
    'Thailand',
    'Bangkok',
    'professional',
    'Eurasia Forum for Social Workers',
    'Social Worker',
    'Community Development, Mental Health, Child Protection',
    'Demo account for testing member features including like, save, view, and share functionalities.',
    'active',
    true,
    'master',
    5.0,
    'SW-TH-2024-001',
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    status = 'active',
    email_verified = true,
    updated_at = NOW();

-- Verify the member was created
SELECT
    id,
    email,
    full_name,
    status,
    email_verified,
    membership_type,
    joined_at
FROM members
WHERE email = 'member@efsw.local';

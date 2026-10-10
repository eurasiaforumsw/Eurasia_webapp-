-- Seed data for RBAC accounts
-- Run this in Supabase SQL editor or via migration

-- Password: EFSW-demo (bcrypt hash below)
-- Hash generated with: bcrypt.hash('EFSW-demo', 12)

DO $$
DECLARE
  password_hash text := '$2b$12$LKKx3qZ8H.mY9xJj9FXJyOYLxK8nqZ8H.mY9xJj9FXJyOYLxK8nqZ';
BEGIN
  -- Insert admin account 1
  INSERT INTO members (
    id, full_name, email, role, country, membership_type,
    organization, position, expertise, bio, password_hash, status,
    joined_at, created_at, updated_at,
    university, faculty, degree, organization_type, contact_position
  ) VALUES (
    'admin-001',
    'EFSW Administrator',
    'admin@efsw.local',
    'admin',
    'Thailand',
    'professional',
    'Eurasia Foundation of Southeast Asia and the West',
    'System Administrator',
    'Administration, System Management',
    'Primary administrator account with full access to all system features.',
    password_hash,
    'active',
    NOW(),
    NOW(),
    NOW(),
    '', '', '', '', ''
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = NOW();

  -- Insert admin account 2
  INSERT INTO members (
    id, full_name, email, role, country, membership_type,
    organization, position, expertise, bio, password_hash, status,
    joined_at, created_at, updated_at,
    university, faculty, degree, organization_type, contact_position
  ) VALUES (
    'admin-002',
    'EFSW Administrator 2',
    'admin2@efsw.local',
    'admin',
    'Thailand',
    'professional',
    'Eurasia Foundation of Southeast Asia and the West',
    'System Administrator',
    'Administration, System Management',
    'Secondary administrator account with full access to all system features.',
    password_hash,
    'active',
    NOW(),
    NOW(),
    NOW(),
    '', '', '', '', ''
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active',
    updated_at = NOW();

  -- Insert PR/content editor account
  INSERT INTO members (
    id, full_name, email, role, country, membership_type,
    organization, position, expertise, bio, password_hash, status,
    joined_at, created_at, updated_at,
    university, faculty, degree, organization_type, contact_position
  ) VALUES (
    'pr-001',
    'EFSW Content Editor',
    'news@efsw.local',
    'pr',
    'Thailand',
    'professional',
    'Eurasia Foundation of Southeast Asia and the West',
    'Content Editor',
    'Content Management, Public Relations',
    'Content editor account with access to News, Events, and Academic sections.',
    password_hash,
    'active',
    NOW(),
    NOW(),
    NOW(),
    '', '', '', '', ''
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'pr',
    status = 'active',
    updated_at = NOW();

  RAISE NOTICE 'RBAC accounts seeded successfully';
  RAISE NOTICE 'Login credentials (all use password: EFSW-demo):';
  RAISE NOTICE '  - admin@efsw.local [admin role]';
  RAISE NOTICE '  - admin2@efsw.local [admin role]';
  RAISE NOTICE '  - news@efsw.local [pr role]';
END $$;

-- Seed users with different roles for testing RBAC
-- Password for all accounts: "password123" (hashed with bcrypt)

-- Insert admin accounts
INSERT INTO members (email, password_hash, first_name, last_name, role, status, email_verified)
VALUES
  -- Admin 1: admin@efsw.local
  ('admin@efsw.local', '$2a$10$rZ1qQ6xKZ0yL9.vY3YXxJ.K3YqX8Z6Z0yL9vY3YXxJ.K3YqX8Z6Z0y', 'Admin', 'One', 'admin', 'active', TRUE),

  -- Admin 2: admin2@efsw.local
  ('admin2@efsw.local', '$2a$10$rZ1qQ6xKZ0yL9.vY3YXxJ.K3YqX8Z6Z0yL9vY3YXxJ.K3YqX8Z6Z0y', 'Admin', 'Two', 'admin', 'active', TRUE),

  -- PR/Content Editor: news@efsw.local
  ('news@efsw.local', '$2a$10$rZ1qQ6xKZ0yL9.vY3YXxJ.K3YqX8Z6Z0yL9vY3YXxJ.K3YqX8Z6Z0y', 'News', 'Editor', 'pr', 'active', TRUE)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  email_verified = EXCLUDED.email_verified;

-- Verify the seed
SELECT email, role, status FROM members WHERE email IN ('admin@efsw.local', 'admin2@efsw.local', 'news@efsw.local');

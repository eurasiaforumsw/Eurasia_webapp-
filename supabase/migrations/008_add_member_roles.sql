-- Add role-based access control to members table
-- Roles:
--   - admin: Full access to admin console (all sections)
--   - pr: Limited access to admin console (News, Events, Academic only)
--   - member: No admin console access (member dashboard only)

-- Add role column with default value
ALTER TABLE members
ADD COLUMN role TEXT DEFAULT 'member';

-- Add constraint to ensure valid roles only
ALTER TABLE members
ADD CONSTRAINT members_role_check
CHECK (role IN ('admin', 'pr', 'member'));

-- Create index for role-based queries
CREATE INDEX idx_members_role ON members(role);

-- Add comment for documentation
COMMENT ON COLUMN members.role IS 'User role for access control: admin (full access), pr (content management only), member (no admin access)';

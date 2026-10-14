-- Create auth schema and mock functions for migration compatibility
-- Since we're using custom JWT auth, these are just stubs to satisfy migration syntax

CREATE SCHEMA IF NOT EXISTS auth;

-- Create service_role and anon roles for migration compatibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
END
$$;

-- Mock auth.role() function - always returns 'service_role' since we handle auth in app layer
CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT AS $$
BEGIN
  RETURN 'service_role';
END;
$$ LANGUAGE plpgsql STABLE;

-- Mock auth.uid() function - returns NULL since we don't use Supabase auth
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
BEGIN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Note: These are compatibility shims only.
-- Actual authentication and authorization is handled by:
-- - JWT tokens (lib/auth/session.ts)
-- - Middleware checks (middleware.ts)
-- - API route permissions

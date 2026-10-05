-- EFSW Membership System — Database Setup
-- Run this in the Supabase SQL Editor (Database > SQL Editor > New query)
-- The app will also save a copy at supabase/SETUP.sql for future reference

-- 1. Create the members table
CREATE TABLE IF NOT EXISTS public.members (
  id            text PRIMARY KEY,
  full_name     text NOT NULL,
  email         text NOT NULL UNIQUE,
  country       text NOT NULL DEFAULT '',
  membership_type text NOT NULL CHECK (membership_type IN ('professional', 'student', 'institutional')),
  organization  text NOT NULL DEFAULT '',
  position      text NOT NULL DEFAULT '',
  expertise     text NOT NULL DEFAULT '',
  university    text NOT NULL DEFAULT '',
  faculty       text NOT NULL DEFAULT '',
  degree        text NOT NULL DEFAULT '',
  organization_type text NOT NULL DEFAULT '',
  contact_position text NOT NULL DEFAULT '',
  bio           text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);
CREATE INDEX IF NOT EXISTS idx_members_membership_type ON public.members (membership_type);
CREATE INDEX IF NOT EXISTS idx_members_country ON public.members (country);
CREATE INDEX IF NOT EXISTS idx_members_joined_at ON public.members (joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members (email);

-- 3. Row Level Security (RLS)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Admin (service_role) can read all members
CREATE POLICY "Service role can read all members" ON public.members
  FOR SELECT TO service_role USING (true);

-- Admin (service_role) can insert members
CREATE POLICY "Service role can insert members" ON public.members
  FOR INSERT TO service_role WITH CHECK (true);

-- Admin (service_role) can update members
CREATE POLICY "Service role can update members" ON public.members
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);

-- Admin (service_role) can delete members
CREATE POLICY "Service role can delete members" ON public.members
  FOR DELETE TO service_role USING (true);

-- Anon can read only active members (for public profile pages)
CREATE POLICY "Anon can read active members" ON public.members
  FOR SELECT TO anon USING (status = 'active');

-- Anon can insert (register) new members with status='pending'
CREATE POLICY "Anon can register as member" ON public.members
  FOR INSERT TO anon WITH CHECK (status = 'pending');

-- Anon cannot update or delete members (only service_role can)
-- (No policies = no access)

-- 4. Trigger to update updated_at on change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Seed a demo member (optional — remove if you want a clean table)
-- INSERT INTO public.members (id, full_name, email, country, membership_type, organization, position, expertise, status)
-- VALUES ('efsw-demo-001', 'Dr. Araya Somsri', 'araya@example.org', 'Thailand', 'professional', 'EFSW Secretariat', 'Chair', 'Cross-border practice', 'active');

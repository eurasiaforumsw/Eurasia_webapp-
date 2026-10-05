-- EFSW Content Management System — Database Setup
-- Run this in the Supabase SQL Editor (Database > SQL Editor > New query)

CREATE TABLE IF NOT EXISTS public.content (
  id text primary key,
  kind text not null check (kind in ('news', 'document', 'academic', 'event')),
  category text not null default 'General',
  title text not null,
  summary text not null default '',
  body text not null default '',
  cover_image text,
  image_caption text,
  author text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  locale text not null default 'en' check (locale in ('en', 'th', 'ko')),
  updated_at timestamptz not null default now(),
  starts_at timestamptz,
  ends_at timestamptz,
  venue text,
  format text,
  registration_url text,
  -- Scheduling + audience (migration 004) — idempotent
  publish_at timestamptz,
  expires_at timestamptz,
  target_membership_types text[] not null default '{}',
  target_groups text[] not null default '{}',
  min_membership_status text,
  is_featured boolean not null default false,
  pinned_rank integer not null default 0,
  -- SEO + social metadata
  seo_title text,
  seo_description text,
  seo_keywords text[] not null default '{}',
  og_image text,
  canonical_url text,
  -- Homepage event slider controls
  show_in_hero_slider boolean not null default false,
  slider_duration integer check (slider_duration is null or slider_duration between 3000 and 15000),
  slider_order integer,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS content_kind_status_idx ON public.content (kind, status);
CREATE INDEX IF NOT EXISTS content_kind_id_idx ON public.content (kind, id);
CREATE INDEX IF NOT EXISTS content_updated_idx ON public.content (updated_at desc);

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read published" ON public.content;
CREATE POLICY "public read published" ON public.content
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "admin full access" ON public.content;
CREATE POLICY "admin full access" ON public.content
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ══════════════════════════════════════════════════════════════
-- Members table — registration / login / profile system
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.members (
  id                text PRIMARY KEY,
  full_name         text NOT NULL,
  email             text NOT NULL UNIQUE,
  country           text NOT NULL DEFAULT '',
  membership_type   text NOT NULL CHECK (membership_type IN ('professional', 'student', 'institutional')),
  organization      text NOT NULL DEFAULT '',
  position          text NOT NULL DEFAULT '',
  expertise         text NOT NULL DEFAULT '',
  university        text NOT NULL DEFAULT '',
  faculty           text NOT NULL DEFAULT '',
  degree            text NOT NULL DEFAULT '',
  organization_type text NOT NULL DEFAULT '',
  contact_position  text NOT NULL DEFAULT '',
  bio               text NOT NULL DEFAULT '',
  password_hash     text NOT NULL,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  joined_at         timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  -- Extended profile fields (editable on /member/profile)
  avatar_url        text,
  first_name        text,
  last_name         text,
  city              text,
  education_level   text CHECK (education_level IN ('high-school', 'diploma', 'bachelor', 'master', 'doctorate')),
  license           text,
  experience_years  numeric CHECK (experience_years >= 0 AND experience_years <= 80),
  target_groups     text[] NOT NULL DEFAULT '{}'
);

-- Safe ALTERs for existing installs that already have the base members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS education_level text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS license text;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS experience_years numeric;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS target_groups text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_members_status ON public.members (status);
CREATE INDEX IF NOT EXISTS idx_members_membership_type ON public.members (membership_type);
CREATE INDEX IF NOT EXISTS idx_members_joined_at ON public.members (joined_at DESC);

-- ══════════════════════════════════════════════════════════════
-- Password reset tokens
--   Separate table so a reset flow never touches the members row directly.
--   Each row holds: hashed 6-digit OTP + token reference + attempts.
--   Cleanup: a one-shot DELETE WHERE expires_at < now() can run via cron.
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.password_resets (
  id              text PRIMARY KEY,
  email           text NOT NULL,
  code_hash       text NOT NULL,
  token_hash      text NOT NULL,
  attempts        integer NOT NULL DEFAULT 0,
  expires_at      timestamptz NOT NULL,
  consumed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets (email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON public.password_resets (expires_at);

ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages password resets" ON public.password_resets;
CREATE POLICY "Service role manages password resets" ON public.password_resets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can read members" ON public.members;
DROP POLICY IF EXISTS "Service role can insert members" ON public.members;
DROP POLICY IF EXISTS "Service role can update members" ON public.members;
DROP POLICY IF EXISTS "Service role can delete members" ON public.members;
DROP POLICY IF EXISTS "Anon can register members" ON public.members;

CREATE POLICY "Service role can read members" ON public.members
  FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role can insert members" ON public.members
  FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role can update members" ON public.members
  FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role can delete members" ON public.members
  FOR DELETE TO service_role USING (true);

-- Keep updated_at fresh on every change
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_members_updated_at ON public.members;
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ══════════════════════════════════════════════════════════════
-- Seed admin member accounts (so admin can sign in via /member/login)
-- Passwords (SHA-256):
--   admin@efsw.local   / EFSW-demo
--   editor@efsw.local  / admin-demo
-- Use ON CONFLICT to keep the rows idempotent if SETUP.sql is re-run.
-- ══════════════════════════════════════════════════════════════

INSERT INTO public.members (
  id, full_name, email, country, membership_type,
  organization, position, expertise, university, faculty, degree,
  organization_type, contact_position, bio, password_hash, status
) VALUES
  (
    'admin-seed-1',
    'EFSW Administrator',
    'admin@efsw.local',
    'Thailand',
    'professional',
    'Eurasia Forum for Social Workers',
    'Director',
    'Social work policy & regional cooperation',
    '', '', '',
    '', 'EFSW Administrator',
    'Seed admin account — created via SETUP.sql',
    '584e8b78501a790d69a40dd72a7f9a309ed909c640ca0aa7d0383003adc84eb9',
    'active'
  ),
  (
    'admin-seed-2',
    'EFSW Content Editor',
    'editor@efsw.local',
    'Thailand',
    'professional',
    'Eurasia Forum for Social Workers',
    'Content Editor',
    'Editorial & member communications',
    '', '', '',
    '', 'Content Editor',
    'Seed editor account — created via SETUP.sql',
    '198352b6a8078a827be267c847d39506629d3af446a3cc0bce670dd3a6b5d753',
    'active'
  )
ON CONFLICT (id) DO NOTHING;

-- Add email verification columns to members table
-- This migration adds verification_token and email_verified_at columns

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS verification_token text,
ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_members_verification_token
ON public.members (verification_token)
WHERE verification_token IS NOT NULL;

-- Index for verification status queries
CREATE INDEX IF NOT EXISTS idx_members_email_verified
ON public.members (email_verified_at)
WHERE email_verified_at IS NULL;

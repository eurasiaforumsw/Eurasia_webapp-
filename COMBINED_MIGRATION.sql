-- ============================================================================
-- COMBINED MIGRATIONS - Run this entire file in Supabase SQL Editor
-- ============================================================================
-- Migration 006: Create Engagement Tables
-- Migration 007: Add Email Verification
--
-- Instructions:
-- 1. Go to: https://supabase.com/dashboard/project/nhehjnosjzdczgpjvnmy/sql/new
-- 2. Select ALL text in this file (Cmd+A / Ctrl+A)
-- 3. Copy (Cmd+C / Ctrl+C)
-- 4. Paste in SQL Editor
-- 5. Click "Run" button
-- ============================================================================

-- Migration: Create Engagement Tables
-- Description: Tables for tracking user engagement (likes, saves, views, sessions, activity, shares)
-- Created: 2026-10-10

-- ============================================================================
-- 1. CONTENT LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate likes
    CONSTRAINT unique_member_content_like UNIQUE (member_id, content_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_likes_member_id ON content_likes(member_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_content_id ON content_likes(content_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_created_at ON content_likes(created_at DESC);

-- RLS Policies
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view all likes" ON content_likes;
CREATE POLICY "Members can view all likes"
    ON content_likes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Members can create their own likes" ON content_likes;
CREATE POLICY "Members can create their own likes"
    ON content_likes FOR INSERT
    WITH CHECK (auth.uid()::TEXT = member_id);

DROP POLICY IF EXISTS "Members can delete their own likes" ON content_likes;
CREATE POLICY "Members can delete their own likes"
    ON content_likes FOR DELETE
    USING (auth.uid()::TEXT = member_id);

-- ============================================================================
-- 2. MEMBER INTERESTS (BOOKMARKS/SAVES) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT, -- Optional: member's private notes about saved content

    -- Prevent duplicate saves
    CONSTRAINT unique_member_interest UNIQUE (member_id, content_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_interests_member_id ON member_interests(member_id);
CREATE INDEX IF NOT EXISTS idx_member_interests_content_id ON member_interests(content_id);
CREATE INDEX IF NOT EXISTS idx_member_interests_created_at ON member_interests(created_at DESC);

-- RLS Policies
ALTER TABLE member_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view only their own interests" ON member_interests;
CREATE POLICY "Members can view only their own interests"
    ON member_interests FOR SELECT
    USING (auth.uid()::TEXT = member_id);

DROP POLICY IF EXISTS "Members can create their own interests" ON member_interests;
CREATE POLICY "Members can create their own interests"
    ON member_interests FOR INSERT
    WITH CHECK (auth.uid()::TEXT = member_id);

DROP POLICY IF EXISTS "Members can update their own interests" ON member_interests;
CREATE POLICY "Members can update their own interests"
    ON member_interests FOR UPDATE
    USING (auth.uid()::TEXT = member_id);

DROP POLICY IF EXISTS "Members can delete their own interests" ON member_interests;
CREATE POLICY "Members can delete their own interests"
    ON member_interests FOR DELETE
    USING (auth.uid()::TEXT = member_id);

-- ============================================================================
-- 3. CONTENT VIEWS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    visitor_id TEXT NOT NULL, -- Can be member_id or anonymous session ID
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_views_content_id ON content_views(content_id);
CREATE INDEX IF NOT EXISTS idx_content_views_visitor_id ON content_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_content_views_viewed_at ON content_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_views_ip_address ON content_views(ip_address);

-- Create a unique index for deduplication (content_id + visitor_id + date)
-- This prevents multiple views from same visitor on the same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_views_dedup
ON content_views (content_id, visitor_id, ((viewed_at AT TIME ZONE 'UTC')::date));

-- RLS Policies
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view content views stats" ON content_views;
CREATE POLICY "Anyone can view content views stats"
    ON content_views FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can insert content views" ON content_views;
CREATE POLICY "Anyone can insert content views"
    ON content_views FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- 4. MEMBER SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_sessions_member_id ON member_sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_member_sessions_token ON member_sessions(token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_member_sessions_expires_at ON member_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_member_sessions_last_activity ON member_sessions(last_activity_at DESC);

-- RLS Policies
ALTER TABLE member_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view only their own sessions" ON member_sessions;
CREATE POLICY "Members can view only their own sessions"
    ON member_sessions FOR SELECT
    USING (auth.uid()::TEXT = member_id);

DROP POLICY IF EXISTS "Members can update their own sessions" ON member_sessions;
CREATE POLICY "Members can update their own sessions"
    ON member_sessions FOR UPDATE
    USING (auth.uid()::TEXT = member_id);

-- ============================================================================
-- 5. MEMBER ACTIVITY (AUDIT TRAIL) TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'login', 'logout', 'like', 'unlike', 'save', 'unsave', 'view', 'share', 'profile_update', etc.
    content_id TEXT REFERENCES content(id) ON DELETE SET NULL, -- Optional: related content
    metadata JSONB, -- Additional context (e.g., share platform, device info)
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure action_type is valid
    CONSTRAINT valid_action_type CHECK (action_type IN (
        'login', 'logout', 'register', 'password_reset', 'password_change',
        'profile_update', 'email_verified',
        'like', 'unlike', 'save', 'unsave', 'view', 'share',
        'comment_create', 'comment_update', 'comment_delete'
    ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_member_activity_member_id ON member_activity(member_id);
CREATE INDEX IF NOT EXISTS idx_member_activity_action_type ON member_activity(action_type);
CREATE INDEX IF NOT EXISTS idx_member_activity_content_id ON member_activity(content_id) WHERE content_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_member_activity_created_at ON member_activity(created_at DESC);

-- RLS Policies
ALTER TABLE member_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view only their own activity" ON member_activity;
CREATE POLICY "Members can view only their own activity"
    ON member_activity FOR SELECT
    USING (auth.uid()::TEXT = member_id);

DROP POLICY IF EXISTS "System can insert activity logs" ON member_activity;
CREATE POLICY "System can insert activity logs"
    ON member_activity FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- 6. CONTENT SHARES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- 'facebook', 'line', 'kakao', 'whatsapp', 'telegram', 'email'
    member_id TEXT REFERENCES members(id) ON DELETE SET NULL, -- NULL for anonymous shares
    shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,

    -- Ensure platform is valid
    CONSTRAINT valid_share_platform CHECK (platform IN (
        'facebook', 'line', 'kakao', 'whatsapp', 'telegram', 'email', 'twitter', 'linkedin', 'copy_link'
    ))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_content_shares_content_id ON content_shares(content_id);
CREATE INDEX IF NOT EXISTS idx_content_shares_platform ON content_shares(platform);
CREATE INDEX IF NOT EXISTS idx_content_shares_member_id ON content_shares(member_id) WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_shares_shared_at ON content_shares(shared_at DESC);

-- RLS Policies
ALTER TABLE content_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view share stats" ON content_shares;
CREATE POLICY "Anyone can view share stats"
    ON content_shares FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Anyone can insert share records" ON content_shares;
CREATE POLICY "Anyone can insert share records"
    ON content_shares FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- VIEW: CONTENT ENGAGEMENT SUMMARY
-- ============================================================================
CREATE OR REPLACE VIEW content_engagement_summary AS
SELECT
    c.id AS content_id,
    c.title,
    c.kind,
    c.locale,
    c.status,
    c.created_at,

    -- Like stats
    COUNT(DISTINCT cl.id) AS total_likes,

    -- Save/Interest stats
    COUNT(DISTINCT mi.id) AS total_saves,

    -- View stats
    COUNT(DISTINCT cv.id) AS total_views,
    COUNT(DISTINCT cv.visitor_id) AS unique_visitors,

    -- Share stats
    COUNT(DISTINCT cs.id) AS total_shares,

    -- Engagement score (weighted)
    (
        COUNT(DISTINCT cl.id) * 3 +  -- Likes worth 3 points
        COUNT(DISTINCT mi.id) * 5 +  -- Saves worth 5 points
        COUNT(DISTINCT cv.id) * 1 +  -- Views worth 1 point
        COUNT(DISTINCT cs.id) * 4    -- Shares worth 4 points
    ) AS engagement_score,

    -- Last activity
    GREATEST(
        MAX(cl.created_at),
        MAX(mi.created_at),
        MAX(cv.viewed_at),
        MAX(cs.shared_at)
    ) AS last_activity_at

FROM content c
LEFT JOIN content_likes cl ON c.id = cl.content_id
LEFT JOIN member_interests mi ON c.id = mi.content_id
LEFT JOIN content_views cv ON c.id = cv.content_id
LEFT JOIN content_shares cs ON c.id = cs.content_id
GROUP BY c.id, c.title, c.kind, c.locale, c.status, c.created_at;

-- ============================================================================
-- FUNCTION: GET MEMBER ENGAGEMENT STATS
-- ============================================================================
CREATE OR REPLACE FUNCTION get_member_engagement_stats(p_member_id TEXT)
RETURNS TABLE (
    total_likes BIGINT,
    total_saves BIGINT,
    total_views BIGINT,
    total_shares BIGINT,
    liked_content_ids TEXT[],
    saved_content_ids TEXT[],
    recent_activity JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Total likes by this member
        (SELECT COUNT(*) FROM content_likes WHERE member_id = p_member_id) AS total_likes,

        -- Total saves by this member
        (SELECT COUNT(*) FROM member_interests WHERE member_id = p_member_id) AS total_saves,

        -- Total views by this member (if logged in)
        (SELECT COUNT(*) FROM content_views WHERE visitor_id = p_member_id) AS total_views,

        -- Total shares by this member
        (SELECT COUNT(*) FROM content_shares WHERE member_id = p_member_id) AS total_shares,

        -- Array of liked content IDs
        (SELECT ARRAY_AGG(content_id) FROM content_likes WHERE member_id = p_member_id) AS liked_content_ids,

        -- Array of saved content IDs
        (SELECT ARRAY_AGG(content_id) FROM member_interests WHERE member_id = p_member_id) AS saved_content_ids,

        -- Recent activity (last 10 actions)
        (
            SELECT JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'action_type', action_type,
                    'content_id', content_id,
                    'created_at', created_at,
                    'metadata', metadata
                )
                ORDER BY created_at DESC
            )
            FROM (
                SELECT action_type, content_id, created_at, metadata
                FROM member_activity
                WHERE member_id = p_member_id
                ORDER BY created_at DESC
                LIMIT 10
            ) recent
        ) AS recent_activity;
END;
$$;

-- ============================================================================
-- FUNCTION: UPDATE SESSION ACTIVITY
-- ============================================================================
CREATE OR REPLACE FUNCTION update_session_activity(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE member_sessions
    SET last_activity_at = NOW()
    WHERE token = p_token
      AND is_active = true
      AND expires_at > NOW();

    RETURN FOUND;
END;
$$;

-- ============================================================================
-- FUNCTION: CLEANUP EXPIRED SESSIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE member_sessions
    SET is_active = false
    WHERE expires_at < NOW()
      AND is_active = true;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE content_likes IS 'Tracks member likes on content';
COMMENT ON TABLE member_interests IS 'Tracks saved/bookmarked content by members';
COMMENT ON TABLE content_views IS 'Tracks content views with anti-spam protection';
COMMENT ON TABLE member_sessions IS 'Tracks active member sessions for JWT authentication';
COMMENT ON TABLE member_activity IS 'Audit trail of member actions';
COMMENT ON TABLE content_shares IS 'Tracks content shares across platforms';
COMMENT ON VIEW content_engagement_summary IS 'Aggregated engagement metrics per content';
COMMENT ON FUNCTION get_member_engagement_stats(TEXT) IS 'Get comprehensive engagement statistics for a member';
COMMENT ON FUNCTION update_session_activity(TEXT) IS 'Update last_activity_at for a session token';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Mark expired sessions as inactive';


-- ============================================================================
-- MIGRATION 007: EMAIL VERIFICATION
-- ============================================================================

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

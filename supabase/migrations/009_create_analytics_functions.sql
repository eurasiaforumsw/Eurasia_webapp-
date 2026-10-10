-- Migration: Create Analytics Functions for Admin Dashboard
-- Description: Database functions for content analytics
-- Created: 2026-10-10

-- ============================================================================
-- FUNCTION: GET TOP LIKED CONTENT
-- ============================================================================
CREATE OR REPLACE FUNCTION get_top_liked_content(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    kind TEXT,
    author TEXT,
    count BIGINT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.title,
        c.kind,
        c.author,
        COUNT(cl.id) AS count,
        c.status,
        c.created_at
    FROM content c
    LEFT JOIN content_likes cl ON c.id::UUID = cl.content_id
    GROUP BY c.id, c.title, c.kind, c.author, c.status, c.created_at
    HAVING COUNT(cl.id) > 0
    ORDER BY count DESC, c.created_at DESC
    LIMIT limit_count;
END;
$$;

-- ============================================================================
-- FUNCTION: GET TOP VIEWED CONTENT
-- ============================================================================
CREATE OR REPLACE FUNCTION get_top_viewed_content(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    kind TEXT,
    author TEXT,
    count BIGINT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.title,
        c.kind,
        c.author,
        COUNT(cv.id) AS count,
        c.status,
        c.created_at
    FROM content c
    LEFT JOIN content_views cv ON c.id::UUID = cv.content_id
    GROUP BY c.id, c.title, c.kind, c.author, c.status, c.created_at
    HAVING COUNT(cv.id) > 0
    ORDER BY count DESC, c.created_at DESC
    LIMIT limit_count;
END;
$$;

-- ============================================================================
-- FUNCTION: GET TOP SAVED CONTENT
-- ============================================================================
CREATE OR REPLACE FUNCTION get_top_saved_content(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    id TEXT,
    title TEXT,
    kind TEXT,
    author TEXT,
    count BIGINT,
    status TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.title,
        c.kind,
        c.author,
        COUNT(mi.id) AS count,
        c.status,
        c.created_at
    FROM content c
    LEFT JOIN member_interests mi ON c.id::UUID = mi.content_id
    GROUP BY c.id, c.title, c.kind, c.author, c.status, c.created_at
    HAVING COUNT(mi.id) > 0
    ORDER BY count DESC, c.created_at DESC
    LIMIT limit_count;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION get_top_liked_content IS 'Returns top N most liked content with metadata';
COMMENT ON FUNCTION get_top_viewed_content IS 'Returns top N most viewed content with metadata';
COMMENT ON FUNCTION get_top_saved_content IS 'Returns top N most saved/bookmarked content with metadata';

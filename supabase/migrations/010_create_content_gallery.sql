-- Content Gallery Table
-- Stores additional images for content items (news, events) beyond the cover image
CREATE TABLE IF NOT EXISTS content_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id TEXT NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching gallery images by content_id, ordered by display_order
CREATE INDEX idx_content_gallery_content_id ON content_gallery(content_id, display_order);

-- Index for ordering
CREATE INDEX idx_content_gallery_display_order ON content_gallery(display_order);

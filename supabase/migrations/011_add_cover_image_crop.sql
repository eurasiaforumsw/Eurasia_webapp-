-- Add cover_image_crop column to content table
-- Stores crop settings as JSONB with x, y, width, height, scale properties

ALTER TABLE content ADD COLUMN IF NOT EXISTS cover_image_crop JSONB;

-- Index for querying content with crop data
CREATE INDEX IF NOT EXISTS idx_content_cover_image_crop ON content(cover_image_crop) WHERE cover_image_crop IS NOT NULL;

-- Add comment explaining the structure
COMMENT ON COLUMN content.cover_image_crop IS 'Crop settings for cover image: {x, y, width, height, scale}';

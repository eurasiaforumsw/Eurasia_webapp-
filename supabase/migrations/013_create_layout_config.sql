-- ============================================================================
-- Migration: Create Layout Config Table
-- Description: Store admin layout configuration (hero, footer, partners, etc.)
-- Created: 2024-10-11
-- ============================================================================

-- Create layout_config table
CREATE TABLE IF NOT EXISTS layout_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES members(id) ON DELETE SET NULL
);

-- Insert default config (will be populated from code)
INSERT INTO layout_config (id, config)
VALUES ('default', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_layout_config_updated_at
ON layout_config(updated_at DESC);

-- Enable RLS
ALTER TABLE layout_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read layout config (for public site)
CREATE POLICY "Anyone can view layout config"
ON layout_config
FOR SELECT
USING (true);

-- RLS Policy: Only admins can update layout config
CREATE POLICY "Admins can update layout config"
ON layout_config
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.id = auth.uid()
        AND members.role = 'admin'
    )
);

-- RLS Policy: Only admins can insert layout config
CREATE POLICY "Admins can insert layout config"
ON layout_config
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM members
        WHERE members.id = auth.uid()
        AND members.role = 'admin'
    )
);

-- Comment
COMMENT ON TABLE layout_config IS 'Stores admin layout configuration including hero, footer, partners, leadership, and site-wide settings';
COMMENT ON COLUMN layout_config.config IS 'JSONB object containing complete AdminLayoutConfig structure';

-- ============================================================================
-- Migration: Create Layout Configuration Table
-- Description: Store admin-managed layout config (hero, leadership, footer, etc.)
-- Created: 2026-10-11
-- ============================================================================

-- Create layout_config table
CREATE TABLE IF NOT EXISTS layout_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES members(id)
);

-- Create index on updated_at
CREATE INDEX idx_layout_config_updated_at ON layout_config(updated_at DESC);

-- Enable RLS
ALTER TABLE layout_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can read layout config
CREATE POLICY "Public can view layout config"
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

-- Insert default config (empty placeholder)
INSERT INTO layout_config (id, config, updated_at)
VALUES ('default', '{}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- Add comment
COMMENT ON TABLE layout_config IS 'Admin-managed layout configuration for hero, leadership, footer, partners, etc.';

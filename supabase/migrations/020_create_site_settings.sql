-- Migration: Site Settings System
-- Description: Store site-wide configuration in database instead of localStorage
-- Created: 2026-10-11

-- ============================================================================
-- 1. Create site_settings table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT REFERENCES public.members(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS 'Site-wide settings and configuration stored as JSONB';
COMMENT ON COLUMN public.site_settings.id IS 'Settings identifier (usually "default")';
COMMENT ON COLUMN public.site_settings.config IS 'JSONB configuration object';
COMMENT ON COLUMN public.site_settings.updated_by IS 'Admin who last updated the settings';

-- ============================================================================
-- 2. Insert default settings row
-- ============================================================================
INSERT INTO public.site_settings (id, config)
VALUES ('default', jsonb_build_object(
  'organizationName', 'Eurasia Forum for Social Work',
  'organizationEmail', 'info@efsw.org',
  'defaultLocale', 'en',
  'reviewNotifications', true
))
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. Create trigger to update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_site_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_timestamp();

COMMENT ON TRIGGER trigger_site_settings_updated_at ON public.site_settings IS 'Automatically updates updated_at timestamp on settings change';

-- ============================================================================
-- 4. Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings
CREATE POLICY "Public can view site settings"
  ON public.site_settings
  FOR SELECT
  USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update site settings"
  ON public.site_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE members.id = auth.uid()::text
      AND members.role = 'admin'
    )
  );

-- ============================================================================
-- 5. Create helper function to get settings
-- ============================================================================
CREATE OR REPLACE FUNCTION get_site_settings()
RETURNS JSONB AS $$
DECLARE
  v_config JSONB;
BEGIN
  SELECT config INTO v_config
  FROM public.site_settings
  WHERE id = 'default';

  RETURN COALESCE(v_config, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_site_settings IS 'Returns the current site settings as JSONB object';

-- ============================================================================
-- 6. Create helper function to update settings
-- ============================================================================
CREATE OR REPLACE FUNCTION update_site_settings(
  p_config JSONB,
  p_updated_by TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE public.site_settings
  SET config = p_config,
      updated_by = p_updated_by,
      updated_at = now()
  WHERE id = 'default';

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_site_settings IS 'Updates site settings with new config. Returns true if successful.';

-- ============================================================================
-- Notes:
-- ============================================================================
-- 1. Settings are stored as a single JSONB object for flexibility
-- 2. Public can read settings (for site title, locale, etc.)
-- 3. Only admins can update settings
-- 4. Tracks who last updated the settings and when
-- 5. Default settings are automatically inserted

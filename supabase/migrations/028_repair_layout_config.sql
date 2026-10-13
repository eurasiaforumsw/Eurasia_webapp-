-- Earlier layout migrations used UUID references to TEXT members.id and could
-- fail before creating this table. Preserve saved config when repairing it.
BEGIN;

CREATE TABLE IF NOT EXISTS public.layout_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by TEXT REFERENCES public.members(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_layout_config_updated_at ON public.layout_config(updated_at DESC);
INSERT INTO public.layout_config (id, config) VALUES ('default', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.layout_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view layout config" ON public.layout_config;
DROP POLICY IF EXISTS "Anyone can view layout config" ON public.layout_config;
DROP POLICY IF EXISTS "Admins can update layout config" ON public.layout_config;
DROP POLICY IF EXISTS "Admins can insert layout config" ON public.layout_config;
CREATE POLICY "Public can view layout config" ON public.layout_config
  FOR SELECT TO anon, authenticated USING (true);

-- Writes use application JWT authorization in /api/layout and its service key.
REVOKE ALL ON public.layout_config FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.layout_config TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.layout_config TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;

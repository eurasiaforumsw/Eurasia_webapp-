-- Event Registration System Migration
-- Creates tables for event registration: settings, fields, registrations, and answers

-- ============================================================================
-- 1. Event Registration Settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_registration_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  registration_enabled BOOLEAN NOT NULL DEFAULT false,
  registration_starts_at TIMESTAMPTZ,
  registration_ends_at TIMESTAMPTZ,
  max_attendees INTEGER,
  require_approval BOOLEAN NOT NULL DEFAULT false,
  confirmation_email_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast event lookups
CREATE INDEX IF NOT EXISTS idx_event_registration_settings_event_id
  ON public.event_registration_settings(event_id);

-- ============================================================================
-- 2. Event Registration Fields (Form Builder)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_registration_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'time', 'email', 'phone')),
  field_label TEXT NOT NULL,
  placeholder TEXT,
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  validation_rules JSONB,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for field retrieval by event
CREATE INDEX IF NOT EXISTS idx_event_registration_fields_event_id
  ON public.event_registration_fields(event_id);

-- Index for ordered field retrieval
CREATE INDEX IF NOT EXISTS idx_event_registration_fields_display_order
  ON public.event_registration_fields(event_id, display_order);

-- ============================================================================
-- 3. Event Registrations (User submissions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  user_id UUID,
  confirmation_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlist')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for event registrations lookup
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id
  ON public.event_registrations(event_id);

-- Index for user registrations lookup
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id
  ON public.event_registrations(user_id);

-- Index for confirmation number lookup
CREATE INDEX IF NOT EXISTS idx_event_registrations_confirmation_number
  ON public.event_registrations(confirmation_number);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_event_registrations_status
  ON public.event_registrations(event_id, status);

-- ============================================================================
-- 4. Event Registration Answers (User form responses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.event_registration_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.event_registration_fields(id) ON DELETE CASCADE,
  answer_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(registration_id, field_id)
);

-- Index for answers by registration
CREATE INDEX IF NOT EXISTS idx_event_registration_answers_registration_id
  ON public.event_registration_answers(registration_id);

-- Index for answers by field
CREATE INDEX IF NOT EXISTS idx_event_registration_answers_field_id
  ON public.event_registration_answers(field_id);

-- ============================================================================
-- 5. Updated Timestamp Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event_registration_settings
DROP TRIGGER IF EXISTS update_event_registration_settings_updated_at ON public.event_registration_settings;
CREATE TRIGGER update_event_registration_settings_updated_at
  BEFORE UPDATE ON public.event_registration_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for event_registration_fields
DROP TRIGGER IF EXISTS update_event_registration_fields_updated_at ON public.event_registration_fields;
CREATE TRIGGER update_event_registration_fields_updated_at
  BEFORE UPDATE ON public.event_registration_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for event_registrations
DROP TRIGGER IF EXISTS update_event_registrations_updated_at ON public.event_registrations;
CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON public.event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for event_registration_answers
DROP TRIGGER IF EXISTS update_event_registration_answers_updated_at ON public.event_registration_answers;
CREATE TRIGGER update_event_registration_answers_updated_at
  BEFORE UPDATE ON public.event_registration_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.event_registration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registration_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registration_answers ENABLE ROW LEVEL SECURITY;

-- Settings: Public read, admin write
CREATE POLICY "Anyone can view registration settings"
  ON public.event_registration_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify registration settings"
  ON public.event_registration_settings FOR ALL
  USING (auth.role() = 'service_role');

-- Fields: Public read, admin write
CREATE POLICY "Anyone can view registration fields"
  ON public.event_registration_fields FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify registration fields"
  ON public.event_registration_fields FOR ALL
  USING (auth.role() = 'service_role');

-- Registrations: Users can view their own, admins can view all
CREATE POLICY "Users can view their own registrations"
  ON public.event_registrations FOR SELECT
  USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "Users can insert their own registrations"
  ON public.event_registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Only admins can update registrations"
  ON public.event_registrations FOR UPDATE
  USING (auth.role() = 'service_role');

-- Answers: Users can view their own, admins can view all
CREATE POLICY "Users can view their own answers"
  ON public.event_registration_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_registrations
      WHERE id = registration_id AND (user_id = auth.uid() OR auth.role() = 'service_role')
    )
  );

CREATE POLICY "Users can insert their own answers"
  ON public.event_registration_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_registrations
      WHERE id = registration_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. Helper Functions
-- ============================================================================

-- Generate confirmation number (format: REG-YYYYMMDD-XXXX)
CREATE OR REPLACE FUNCTION generate_confirmation_number()
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  random_part TEXT;
  confirmation_num TEXT;
  counter INTEGER := 0;
BEGIN
  date_part := to_char(now(), 'YYYYMMDD');

  LOOP
    random_part := LPAD(floor(random() * 10000)::TEXT, 4, '0');
    confirmation_num := 'REG-' || date_part || '-' || random_part;

    -- Check if confirmation number exists
    IF NOT EXISTS (SELECT 1 FROM public.event_registrations WHERE confirmation_number = confirmation_num) THEN
      RETURN confirmation_num;
    END IF;

    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique confirmation number';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Sample Data (for testing)
-- ============================================================================

-- Insert sample registration settings for regional-summit-2024
INSERT INTO public.event_registration_settings (event_id, registration_enabled, registration_starts_at, registration_ends_at, max_attendees)
VALUES (
  'regional-summit-2024',
  true,
  now(),
  now() + INTERVAL '30 days',
  100
) ON CONFLICT (event_id) DO NOTHING;

-- Insert sample registration fields
INSERT INTO public.event_registration_fields (event_id, field_name, field_type, field_label, required, display_order)
VALUES
  ('regional-summit-2024', 'full_name', 'text', 'Full Name', true, 1),
  ('regional-summit-2024', 'email', 'email', 'Email Address', true, 2),
  ('regional-summit-2024', 'organization', 'text', 'Organization', false, 3),
  ('regional-summit-2024', 'dietary_requirements', 'textarea', 'Dietary Requirements', false, 4)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON public.event_registration_settings TO anon, authenticated;
GRANT SELECT ON public.event_registration_fields TO anon, authenticated;
GRANT SELECT, INSERT ON public.event_registrations TO authenticated;
GRANT SELECT, INSERT ON public.event_registration_answers TO authenticated;

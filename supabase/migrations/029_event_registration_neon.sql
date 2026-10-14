-- Neon uses the text member ID from public.members rather than auth.users UUIDs.
ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS member_id TEXT REFERENCES public.members(id) ON DELETE SET NULL;
UPDATE public.event_registrations r SET member_id = m.id
FROM public.members m WHERE r.member_id IS NULL AND r.user_id::text = m.id;
CREATE INDEX IF NOT EXISTS idx_event_registrations_member ON public.event_registrations(event_id, member_id);
ALTER TABLE public.event_registration_fields DROP CONSTRAINT IF EXISTS event_registration_fields_field_type_check;
ALTER TABLE public.event_registration_fields ADD CONSTRAINT event_registration_fields_field_type_check
CHECK (field_type IN ('text', 'textarea', 'select', 'radio', 'checkbox', 'date', 'time', 'email', 'phone', 'number'));

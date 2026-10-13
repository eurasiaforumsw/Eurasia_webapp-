-- Durable statistics for academic/document content, whose IDs are text slugs.
CREATE TABLE IF NOT EXISTS public.academic_document_engagement (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  content_id text NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  visitor_id text NOT NULL CHECK (length(visitor_id) BETWEEN 16 AND 100),
  event_type text NOT NULL CHECK (event_type IN ('view', 'download', 'like')),
  bucket_key text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, visitor_id, event_type, bucket_key)
);

CREATE INDEX IF NOT EXISTS academic_document_engagement_content_idx
  ON public.academic_document_engagement (content_id, event_type);
CREATE INDEX IF NOT EXISTS academic_document_engagement_date_idx
  ON public.academic_document_engagement (occurred_at);

ALTER TABLE public.academic_document_engagement ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_document_engagement FROM anon, authenticated;
GRANT ALL ON public.academic_document_engagement TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.academic_document_engagement_id_seq TO service_role;

NOTIFY pgrst, 'reload schema';

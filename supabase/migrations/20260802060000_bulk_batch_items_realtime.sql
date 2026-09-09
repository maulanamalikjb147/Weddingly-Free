-- Persist one log row per recipient so bulk delivery progress survives refreshes
-- and can be monitored independently from the dashboard page.
CREATE TABLE IF NOT EXISTS public.invitation_bulk_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL
    REFERENCES public.invitation_bulk_batches(id)
    ON DELETE CASCADE,
  guest_id BIGINT
    REFERENCES public.data_tamu(id)
    ON DELETE SET NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  guest_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  message_id TEXT,
  error TEXT,
  raw_result JSONB,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (batch_id, position),
  UNIQUE (batch_id, guest_id)
);
ALTER TABLE public.invitation_bulk_batch_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Wedding admin full access" ON public.invitation_bulk_batch_items;
CREATE POLICY "Wedding admin full access"
  ON public.invitation_bulk_batch_items
  FOR ALL
  TO authenticated
  USING (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  )
  WITH CHECK (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  );
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.invitation_bulk_batch_items
  TO authenticated;
CREATE INDEX IF NOT EXISTS invitation_bulk_batch_items_batch_idx
  ON public.invitation_bulk_batch_items (batch_id, position);
CREATE INDEX IF NOT EXISTS invitation_bulk_batch_items_status_idx
  ON public.invitation_bulk_batch_items (status, updated_at DESC);
-- Create useful logs for batches that existed before this migration.
INSERT INTO public.invitation_bulk_batch_items (
  batch_id,
  guest_id,
  position,
  guest_name,
  contact_number,
  chat_id,
  status,
  message_id,
  error,
  processed_at,
  updated_at
)
SELECT
  batch.id,
  guest.id,
  guest_ref.ordinality - 1,
  coalesce(guest.nama_tamu, 'Tamu'),
  coalesce(guest.contact_number, '-'),
  regexp_replace(coalesce(guest.contact_number, ''), '[^0-9]', '', 'g') || '@c.us',
  CASE guest.invitation_status
    WHEN 'sent' THEN 'sent'
    WHEN 'failed' THEN 'failed'
    WHEN 'sending' THEN 'processing'
    ELSE 'pending'
  END,
  guest.invitation_message_id,
  guest.invitation_error,
  CASE
    WHEN guest.invitation_status IN ('sent', 'failed')
      THEN coalesce(guest.invitation_sent_at, batch.last_checked_at, now())
    ELSE NULL
  END,
  coalesce(batch.last_checked_at, batch.created_at)
FROM public.invitation_bulk_batches AS batch
CROSS JOIN LATERAL unnest(batch.guest_ids) WITH ORDINALITY AS guest_ref(guest_id, ordinality)
JOIN public.data_tamu AS guest ON guest.id = guest_ref.guest_id
ON CONFLICT (batch_id, guest_id) DO NOTHING;
-- Realtime publishes database changes; the UI still polls OpenWA every two
-- seconds because OpenWA's tracked batch API is the delivery source of truth.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'invitation_bulk_batches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invitation_bulk_batches;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'invitation_bulk_batch_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.invitation_bulk_batch_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'data_tamu'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.data_tamu;
  END IF;
END $$;

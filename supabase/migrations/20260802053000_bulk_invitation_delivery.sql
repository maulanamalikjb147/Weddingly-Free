-- OpenWA bulk batches run in the background and pace messages per sender.
ALTER TABLE public.config_tamu_dari
  ADD COLUMN IF NOT EXISTS bulk_delay_seconds INTEGER NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS bulk_randomize_delay BOOLEAN NOT NULL DEFAULT true;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'config_tamu_dari_bulk_delay_seconds_check'
  ) THEN
    ALTER TABLE public.config_tamu_dari
      ADD CONSTRAINT config_tamu_dari_bulk_delay_seconds_check
      CHECK (bulk_delay_seconds BETWEEN 5 AND 60);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS public.invitation_bulk_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openwa_batch_id TEXT NOT NULL UNIQUE,
  tamu_from TEXT NOT NULL
    REFERENCES public.config_tamu_dari(name)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'creating'
    CHECK (status IN ('creating', 'pending', 'processing', 'completed', 'cancelled', 'failed')),
  guest_ids BIGINT[] NOT NULL,
  total_messages INTEGER NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  pending_count INTEGER NOT NULL DEFAULT 0,
  cancelled_count INTEGER NOT NULL DEFAULT 0,
  delay_seconds INTEGER NOT NULL CHECK (delay_seconds BETWEEN 5 AND 60),
  randomize_delay BOOLEAN NOT NULL DEFAULT true,
  raw_status JSONB,
  error TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ
);
ALTER TABLE public.invitation_bulk_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Wedding admin full access" ON public.invitation_bulk_batches;
CREATE POLICY "Wedding admin full access"
  ON public.invitation_bulk_batches
  FOR ALL
  TO authenticated
  USING (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  )
  WITH CHECK (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  );
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.invitation_bulk_batches
  TO authenticated;
ALTER TABLE public.data_tamu
  ADD COLUMN IF NOT EXISTS invitation_bulk_batch_id UUID
    REFERENCES public.invitation_bulk_batches(id)
    ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invitation_delivery_method TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'data_tamu_invitation_delivery_method_check'
  ) THEN
    ALTER TABLE public.data_tamu
      ADD CONSTRAINT data_tamu_invitation_delivery_method_check
      CHECK (invitation_delivery_method IN ('manual', 'openwa', 'openwa_bulk'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS data_tamu_invitation_bulk_batch_idx
  ON public.data_tamu (invitation_bulk_batch_id);
CREATE INDEX IF NOT EXISTS invitation_bulk_batches_status_idx
  ON public.invitation_bulk_batches (status, created_at DESC);
UPDATE public.data_tamu
SET invitation_delivery_method = 'openwa'
WHERE invitation_status = 'sent'
  AND invitation_delivery_method IS NULL;
-- Sender configuration contains session IDs and pacing settings. It should no
-- longer be writable or readable by unauthenticated clients.
DROP POLICY IF EXISTS "Allow all" ON public.config_tamu_dari;

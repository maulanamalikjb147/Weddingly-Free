-- OpenWA sender mapping and invitation delivery state.
ALTER TABLE public.config_tamu_dari
  ADD COLUMN IF NOT EXISTS openwa_session_id TEXT,
  ADD COLUMN IF NOT EXISTS openwa_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.data_tamu
  ADD COLUMN IF NOT EXISTS invitation_status TEXT NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invitation_message_id TEXT,
  ADD COLUMN IF NOT EXISTS invitation_error TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'data_tamu_invitation_status_check'
  ) THEN
    ALTER TABLE public.data_tamu
      ADD CONSTRAINT data_tamu_invitation_status_check
      CHECK (invitation_status IN ('not_sent', 'sending', 'sent', 'failed'));
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS data_tamu_invitation_status_idx
  ON public.data_tamu (invitation_status);
-- The browser now uploads QR and CSV files through Supabase Storage with the
-- authenticated admin session, so S3 access keys are no longer exposed.
DROP POLICY IF EXISTS "Authenticated wedding asset inserts" ON storage.objects;
CREATE POLICY "Authenticated wedding asset inserts"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'assets-devaq'
    AND (storage.foldername(name))[1] = 'wedding-scan'
  );
DROP POLICY IF EXISTS "Authenticated wedding asset updates" ON storage.objects;
CREATE POLICY "Authenticated wedding asset updates"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'assets-devaq'
    AND (storage.foldername(name))[1] = 'wedding-scan'
  )
  WITH CHECK (
    bucket_id = 'assets-devaq'
    AND (storage.foldername(name))[1] = 'wedding-scan'
  );

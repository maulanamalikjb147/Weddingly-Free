-- Invitation captions are configured per sender so they can be edited without
-- changing or redeploying the Edge Function.
CREATE TABLE IF NOT EXISTS public.invitation_message_templates (
  tamu_from TEXT PRIMARY KEY
    REFERENCES public.config_tamu_dari(name)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  message_template TEXT NOT NULL
    CHECK (btrim(message_template) <> ''),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invitation_message_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Wedding admin full access" ON public.invitation_message_templates;
CREATE POLICY "Wedding admin full access"
  ON public.invitation_message_templates
  FOR ALL
  TO authenticated
  USING (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  )
  WITH CHECK (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  );
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.invitation_message_templates
  TO authenticated;
INSERT INTO public.invitation_message_templates (tamu_from, message_template)
SELECT
  name,
  E'Assalamu''alaikum Bapak/Ibu {{nama_tamu}},\n\nDengan hormat, kami mengundang Anda untuk menghadiri acara pernikahan kami. QR code pada pesan ini digunakan untuk proses check-in di lokasi acara.\n\nSalam,\n{{tamu_from}}'
FROM public.config_tamu_dari
ON CONFLICT (tamu_from) DO NOTHING;
-- Storage upsert needs SELECT in addition to INSERT and UPDATE. A single ALL
-- policy covers new QR files and replacements while remaining path-scoped.
DROP POLICY IF EXISTS "Authenticated wedding asset inserts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated wedding asset updates" ON storage.objects;
DROP POLICY IF EXISTS "Wedding admin asset access" ON storage.objects;
CREATE POLICY "Wedding admin asset access"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'assets-devaq'
    AND (storage.foldername(name))[1] = 'wedding-scan'
    AND lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  )
  WITH CHECK (
    bucket_id = 'assets-devaq'
    AND (storage.foldername(name))[1] = 'wedding-scan'
    AND lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  );

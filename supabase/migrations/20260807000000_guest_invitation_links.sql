-- Give every guest a readable, stable invitation URL and expose only the
-- minimum guest fields needed by the public invitation page.
ALTER TABLE public.data_tamu
ADD COLUMN IF NOT EXISTS invitation_slug TEXT;
WITH normalized AS (
  SELECT
    id,
    coalesce(
      nullif(
        trim(both '-' from regexp_replace(
          lower(concat_ws('-', nama_tamu, alamat_tamu)),
          '[^a-z0-9]+',
          '-',
          'g'
        )),
        ''
      ),
      'tamu-undangan'
    ) AS base_slug,
    row_number() OVER (
      PARTITION BY coalesce(
        nullif(
          trim(both '-' from regexp_replace(
            lower(concat_ws('-', nama_tamu, alamat_tamu)),
            '[^a-z0-9]+',
            '-',
            'g'
          )),
          ''
        ),
        'tamu-undangan'
      )
      ORDER BY created_at, id
    ) AS duplicate_number
  FROM public.data_tamu
  WHERE invitation_slug IS NULL OR btrim(invitation_slug) = ''
)
UPDATE public.data_tamu AS guest
SET invitation_slug = normalized.base_slug || CASE
  WHEN normalized.duplicate_number = 1 THEN ''
  ELSE '-' || normalized.duplicate_number::text
END
FROM normalized
WHERE guest.id = normalized.id;
CREATE UNIQUE INDEX IF NOT EXISTS data_tamu_invitation_slug_unique_idx
ON public.data_tamu (invitation_slug);
CREATE OR REPLACE FUNCTION public.set_wedding_invitation_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
BEGIN
  IF NEW.invitation_slug IS NOT NULL AND btrim(NEW.invitation_slug) <> '' THEN
    RETURN NEW;
  END IF;

  base_slug := coalesce(
    nullif(
      trim(both '-' from regexp_replace(
        lower(concat_ws('-', NEW.nama_tamu, NEW.alamat_tamu)),
        '[^a-z0-9]+',
        '-',
        'g'
      )),
      ''
    ),
    'tamu-undangan'
  );

  NEW.invitation_slug := base_slug;
  IF EXISTS (
    SELECT 1 FROM public.data_tamu
    WHERE invitation_slug = NEW.invitation_slug AND id IS DISTINCT FROM NEW.id
  ) THEN
    NEW.invitation_slug := base_slug || '-' || left(NEW.id::text, 8);
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS set_wedding_invitation_slug_trigger ON public.data_tamu;
CREATE TRIGGER set_wedding_invitation_slug_trigger
BEFORE INSERT ON public.data_tamu
FOR EACH ROW
EXECUTE FUNCTION public.set_wedding_invitation_slug();
UPDATE public.invitation_message_templates
SET
  message_template = rtrim(message_template) || E'\n\nBuka undangan:\n{{invitation_url}}',
  updated_at = now()
WHERE position('{{invitation_url}}' in message_template) = 0;
CREATE OR REPLACE FUNCTION public.get_wedding_guest(p_slug TEXT)
RETURNS TABLE (
  id BIGINT,
  nama_tamu TEXT,
  alamat_tamu TEXT,
  invitation_slug TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT guest.id, guest.nama_tamu, guest.alamat_tamu, guest.invitation_slug
  FROM public.data_tamu AS guest
  WHERE guest.invitation_slug = p_slug
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_wedding_guest(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_wedding_guest(TEXT) TO anon, authenticated;

-- Normalize sender rows created before the OpenWA migration existed.
UPDATE public.config_tamu_dari
SET openwa_enabled = true
WHERE openwa_enabled IS NULL
  AND nullif(trim(openwa_session_id), '') IS NOT NULL;
UPDATE public.config_tamu_dari
SET openwa_enabled = false
WHERE openwa_enabled IS NULL;
ALTER TABLE public.config_tamu_dari
  ALTER COLUMN openwa_enabled SET DEFAULT false,
  ALTER COLUMN openwa_enabled SET NOT NULL;

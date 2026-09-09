-- Phone numbers are identifiers, not values used for arithmetic.
-- Storing them as text also keeps the frontend and OpenWA payload types stable.

ALTER TABLE public.data_tamu
  ALTER COLUMN contact_number TYPE text
  USING contact_number::text;

-- Give the wedding admin full access to every current application table.
-- Keep this scoped to the known admin email instead of every authenticated user.

DROP POLICY IF EXISTS "Wedding admin full access" ON public.data_tamu;
CREATE POLICY "Wedding admin full access"
  ON public.data_tamu
  FOR ALL
  TO authenticated
  USING (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  )
  WITH CHECK (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  );
DROP POLICY IF EXISTS "Wedding admin full access" ON public.config_tamu_dari;
CREATE POLICY "Wedding admin full access"
  ON public.config_tamu_dari
  FOR ALL
  TO authenticated
  USING (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  )
  WITH CHECK (
    lower(coalesce((SELECT auth.jwt() ->> 'email'), '')) = 'maulanamalikjb147@gmail.com'
  );

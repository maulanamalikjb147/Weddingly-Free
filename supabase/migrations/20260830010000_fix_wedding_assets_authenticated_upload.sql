-- Keep writes private to signed-in users and scoped to QR files. Prefix matching
-- avoids folder parsing differences between Storage versions.
drop policy if exists "Authenticated admin can upload wedding QR assets" on storage.objects;
create policy "Authenticated admin can upload wedding QR assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'wedding-assets'
    and name like 'qr/%'
    and auth.uid() is not null
  );
drop policy if exists "Authenticated admin can update wedding QR assets" on storage.objects;
create policy "Authenticated admin can update wedding QR assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'wedding-assets'
    and name like 'qr/%'
    and auth.uid() is not null
  )
  with check (
    bucket_id = 'wedding-assets'
    and name like 'qr/%'
    and auth.uid() is not null
  );
drop policy if exists "Authenticated admin can delete wedding QR assets" on storage.objects;
create policy "Authenticated admin can delete wedding QR assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'wedding-assets'
    and name like 'qr/%'
    and auth.uid() is not null
  );

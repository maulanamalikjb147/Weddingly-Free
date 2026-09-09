insert into storage.buckets (id, name, public)
values ('wedding-assets', 'wedding-assets', true)
on conflict (id) do update set public = true;
alter table public.data_tamu
  add column if not exists qr_code_url text;
drop policy if exists "Public can read wedding QR assets" on storage.objects;
create policy "Public can read wedding QR assets"
  on storage.objects
  for select
  using (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'qr'
  );
drop policy if exists "Authenticated admin can upload wedding QR assets" on storage.objects;
create policy "Authenticated admin can upload wedding QR assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'qr'
  );
drop policy if exists "Authenticated admin can update wedding QR assets" on storage.objects;
create policy "Authenticated admin can update wedding QR assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'qr'
  )
  with check (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'qr'
  );
drop policy if exists "Authenticated admin can delete wedding QR assets" on storage.objects;
create policy "Authenticated admin can delete wedding QR assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'qr'
  );
drop policy if exists "Authenticated admin can delete wedding CMS assets" on storage.objects;
create policy "Authenticated admin can delete wedding CMS assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'cms'
  );

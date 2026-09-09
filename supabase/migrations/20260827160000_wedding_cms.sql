create table if not exists public.wedding_cms_settings (
  id text primary key default 'default',
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint wedding_cms_singleton check (id = 'default')
);
alter table public.wedding_cms_settings enable row level security;
drop policy if exists "Public can read wedding CMS" on public.wedding_cms_settings;
create policy "Public can read wedding CMS"
  on public.wedding_cms_settings
  for select
  using (true);
drop policy if exists "Authenticated admin can manage wedding CMS" on public.wedding_cms_settings;
create policy "Authenticated admin can manage wedding CMS"
  on public.wedding_cms_settings
  for all
  to authenticated
  using (true)
  with check (true);
insert into public.wedding_cms_settings (id, content)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;
create table if not exists public.wedding_cms_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'wedding-assets',
  storage_path text not null,
  public_url text not null,
  role text not null default 'asset',
  label text,
  alt_text text,
  file_name text,
  content_type text,
  size_bytes bigint,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket_id, storage_path)
);
alter table public.wedding_cms_assets enable row level security;
drop policy if exists "Public can read wedding CMS asset records" on public.wedding_cms_assets;
create policy "Public can read wedding CMS asset records"
  on public.wedding_cms_assets
  for select
  using (true);
drop policy if exists "Authenticated admin can manage wedding CMS asset records" on public.wedding_cms_assets;
create policy "Authenticated admin can manage wedding CMS asset records"
  on public.wedding_cms_assets
  for all
  to authenticated
  using (true)
  with check (true);
insert into storage.buckets (id, name, public)
values ('wedding-assets', 'wedding-assets', true)
on conflict (id) do update set public = true;
drop policy if exists "Public can read wedding CMS assets" on storage.objects;
create policy "Public can read wedding CMS assets"
  on storage.objects
  for select
  using (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'cms'
  );
drop policy if exists "Authenticated admin can upload wedding CMS assets" on storage.objects;
create policy "Authenticated admin can upload wedding CMS assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'cms'
  );
drop policy if exists "Authenticated admin can update wedding CMS assets" on storage.objects;
create policy "Authenticated admin can update wedding CMS assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'cms'
  )
  with check (
    bucket_id = 'wedding-assets'
    and (storage.foldername(name))[1] = 'cms'
  );

insert into public.wedding_cms_assets (
  bucket_id,
  storage_path,
  public_url,
  role,
  label,
  alt_text,
  file_name,
  content_type
)
values
  ('wedding-assets', 'cms/imported/images/cpp.png', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/cpp.png', 'bride', 'Foto mempelai wanita', 'Foto mempelai wanita', 'cpp.png', 'image/png'),
  ('wedding-assets', 'cms/imported/images/cpw.JPG', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/cpw.JPG', 'groom', 'Foto mempelai pria', 'Foto mempelai pria', 'cpw.JPG', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar1.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar1.jpg', 'cover', 'Foto cover undangan', 'Foto cover undangan', 'gambar1.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar10.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar10.jpg', 'gallery', 'Galeri 10', 'Galeri 10', 'gambar10.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar11.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar11.jpg', 'gallery', 'Galeri 11', 'Galeri 11', 'gambar11.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar12.JPG', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar12.JPG', 'gallery', 'Galeri 12', 'Galeri 12', 'gambar12.JPG', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar13.JPG', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar13.JPG', 'gallery', 'Galeri 13', 'Galeri 13', 'gambar13.JPG', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar2.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar2.jpg', 'desktopSide', 'Foto desktop kiri', 'Foto desktop kiri', 'gambar2.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar3.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar3.jpg', 'hero', 'Foto hero undangan', 'Foto hero undangan', 'gambar3.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar4.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar4.jpg', 'coupleBackdrop', 'Background mempelai', 'Background mempelai', 'gambar4.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar5.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar5.jpg', 'eventBackdrop', 'Background acara', 'Background acara', 'gambar5.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar6.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar6.jpg', 'gallery', 'Galeri 6', 'Galeri 6', 'gambar6.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar7.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar7.jpg', 'galleryBackdrop', 'Background galeri', 'Background galeri', 'gambar7.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar8.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar8.jpg', 'giftBackdrop', 'Background gift', 'Background gift', 'gambar8.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/images/gambar9.jpg', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/images/gambar9.jpg', 'footer', 'Foto footer', 'Foto footer', 'gambar9.jpg', 'image/jpeg'),
  ('wedding-assets', 'cms/imported/maulanaanisa.png', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/maulanaanisa.png', 'cover', 'Cover utama', 'Cover utama', 'maulanaanisa.png', 'image/png'),
  ('wedding-assets', 'cms/imported/og.png', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/og.png', 'meta', 'Open graph image', 'Open graph image', 'og.png', 'image/png'),
  ('wedding-assets', 'cms/imported/music.mp3', 'https://nemuftsdmjzkzcygkjpg.supabase.co/storage/v1/object/public/wedding-assets/cms/imported/music.mp3', 'audio', 'Musik undangan', 'Musik undangan', 'music.mp3', 'audio/mpeg')
on conflict (bucket_id, storage_path) do update set
  public_url = excluded.public_url,
  role = excluded.role,
  label = excluded.label,
  alt_text = excluded.alt_text,
  file_name = excluded.file_name,
  content_type = excluded.content_type,
  updated_at = now();

-- AevShare Storage setup
-- Supabase SQL Editorで実行する前に内容を確認してください。
-- 公開バケット: URLを知っている人はファイルを閲覧・ダウンロードできます。
-- 匿名アップロードを許可するため、公開サイトから誰でもアップロードできます。
-- バケット上限は50MB。実際のプラン上限・通信量制限も適用されます。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'aevshare',
  'aevshare',
  true,
  52428800,
  array[
    'image/jpeg','image/png','image/gif','image/webp','image/avif',
    'video/mp4','video/webm','video/quicktime',
    'application/zip','application/x-zip-compressed','application/x-7z-compressed',
    'application/x-rar-compressed','application/pdf',
    'application/octet-stream','text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read files from this public bucket.
create policy "AevShare public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'aevshare');

-- Anyone can upload to this bucket without signing in.
-- This is convenient but can be abused; monitor storage usage and disable this policy if needed.
create policy "AevShare anonymous upload"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'aevshare');

-- AevShare private Storage migration
-- AevShare専用SupabaseプロジェクトのSQL Editorで実行してください。
-- 既存の公開ポリシーを削除し、ログイン中の本人だけが自分のフォルダを操作できるようにします。
-- 共有相手にはアプリが発行する期限付き署名URLを渡します（ログイン不要）。

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'aevshare','aevshare',false,52428800,
  array[
    'image/jpeg','image/png','image/gif','image/webp','image/avif',
    'video/mp4','video/webm','video/quicktime',
    'application/zip','application/x-zip-compressed','application/x-7z-compressed',
    'application/x-rar-compressed','application/pdf',
    'application/octet-stream','text/plain'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "AevShare public read" on storage.objects;
drop policy if exists "AevShare anonymous upload" on storage.objects;
drop policy if exists "AevShare owner read" on storage.objects;
drop policy if exists "AevShare owner upload" on storage.objects;
drop policy if exists "AevShare owner delete" on storage.objects;

create policy "AevShare owner read"
on storage.objects for select
to authenticated
using (bucket_id = 'aevshare' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "AevShare owner upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'aevshare' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "AevShare owner delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'aevshare' and (storage.foldername(name))[1] = auth.uid()::text);

-- AevShare: 30-day automatic file retention
-- Run ONLY in the AevShare project:
-- https://cbfkgosvqiltsikextxv.supabase.co
--
-- IMPORTANT:
-- 1) Deploy supabase/functions/aevshare-cleanup first.
-- 2) Replace the placeholder below with the project's LEGACY service_role key.
--    Do NOT use the publishable/anon key. Do NOT share the key in chat or GitHub.
-- 3) Run this script once in the AevShare SQL Editor.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- Store the admin key in Vault, never in the website source.
select vault.create_secret(
  'PASTE_YOUR_AEVSHARE_SERVICE_ROLE_KEY_HERE',
  'aevshare_admin_key'
);

-- Return only expired object paths. The Edge Function deletes them through
-- the Storage API (never DELETE rows directly from storage.objects).
create or replace function public.aevshare_expired_paths()
returns table(name text)
language sql
security definer
set search_path = ''
as $$
  select o.name
  from storage.objects as o
  where o.bucket_id = 'aevshare'
    and o.created_at < now() - interval '30 days'
  order by o.created_at
  limit 10000;
$$;

revoke all on function public.aevshare_expired_paths() from public, anon, authenticated;
grant execute on function public.aevshare_expired_paths() to service_role;

-- Replace an existing job with the same name, then run daily at 03:15 UTC.
select cron.unschedule(jobid)
from cron.job
where jobname = 'aevshare-delete-expired-files';

select cron.schedule(
  'aevshare-delete-expired-files',
  '15 3 * * *',
  $job$
    select net.http_post(
      url := 'https://cbfkgosvqiltsikextxv.supabase.co/functions/v1/aevshare-cleanup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret
                   from vault.decrypted_secrets
                   where name = 'aevshare_admin_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $job$
);

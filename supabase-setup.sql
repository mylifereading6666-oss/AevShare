-- AevStudio initial database setup
-- Run once in Supabase SQL Editor after confirming the project is the intended AevStudio project.
create extension if not exists pgcrypto;
create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Project',
  title text not null default 'New page',
  description text not null default '',
  color text not null default '#8b6cff',
  html text not null default '',
  css text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.studio_projects enable row level security;
drop policy if exists "Users can view own studio projects" on public.studio_projects;
create policy "Users can view own studio projects" on public.studio_projects for select using (auth.uid() = user_id);
drop policy if exists "Users can create own studio projects" on public.studio_projects;
create policy "Users can create own studio projects" on public.studio_projects for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own studio projects" on public.studio_projects;
create policy "Users can update own studio projects" on public.studio_projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own studio projects" on public.studio_projects;
create policy "Users can delete own studio projects" on public.studio_projects for delete using (auth.uid() = user_id);
create index if not exists studio_projects_user_updated_idx on public.studio_projects(user_id, updated_at desc);

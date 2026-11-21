# AevStudio

Learn, build, and prepare to publish websites in one workspace.

## Current foundation
- Responsive Japanese-first studio UI
- Visual starter editor and HTML/CSS editor switch
- Isolated iframe preview using a sandbox
- Starter templates: blank, portfolio, landing page, blog
- Local draft persistence
- Supabase email authentication and per-user project cloud storage (after configuration)

## Setup
1. Open `config.js` and set the Supabase project URL and **publishable/anon key**.
2. In Supabase SQL Editor, run `supabase-setup.sql`.
3. Enable Email auth in Supabase Authentication settings.
4. Publish the repository with GitHub Pages.

Never put a Supabase `service_role` key in browser code. Project ownership is enforced by Row Level Security.

## Planned
Richer drag-and-drop blocks, JavaScript editing, project export/import, ZIP export, deployment guidance, and APK packaging workflow.

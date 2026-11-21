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

-- Curated code library used by AevStudio's code search and AI assistant.
create table if not exists public.studio_code_snippets (
  id text primary key,
  category text not null check (category in ('HTML','CSS','JavaScript')),
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  code text not null,
  difficulty text not null default '初級',
  created_at timestamptz not null default now()
);
alter table public.studio_code_snippets enable row level security;
drop policy if exists "Anyone can read studio code snippets" on public.studio_code_snippets;
create policy "Anyone can read studio code snippets" on public.studio_code_snippets for select using (true);
insert into public.studio_code_snippets (id,category,title,description,tags,code,difficulty) values
('modal-dialog','HTML','モーダルダイアログ','ボタンから説明や確認画面を表示する基本構成.',array['ポップアップ','ダイアログ','画面','表示'],'<dialog id="myDialog">
  <p>メッセージ</p>
  <button onclick="this.closest(''dialog'').close()">閉じる</button>
</dialog>
<button onclick="document.querySelector(''#myDialog'').showModal()">開く</button>','初級'),
('responsive-grid','CSS','レスポンシブカードグリッド','画面幅に合わせてカードの列数を自動調整.',array['スマホ','タブレット','pc','カード','レイアウト'],'.grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px; }','初級'),
('dark-glass','CSS','ダーク・ガラス風パネル','半透明背景とぼかしを使ったパネルデザイン.',array['ダーク','ガラス','ぼかし','gaming','パネル'],'.glass { background:rgba(18,24,42,.72); border:1px solid rgba(255,255,255,.12); border-radius:16px; backdrop-filter:blur(14px); box-shadow:0 16px 50px #0005; }','中級'),
('copy-clipboard','JavaScript','テキストをコピー','ボタン操作で指定したテキストをクリップボードへコピー.',array['コピー','クリップボード','ボタン'],'async function copyText(text) {
  await navigator.clipboard.writeText(text);
  alert("コピーしました");
}','初級'),
('image-lightbox','JavaScript','画像の拡大表示','画像を選択すると大きく表示する簡易ライトボックス.',array['画像','拡大','写真','クリック','ギャラリー'],'document.querySelectorAll("[data-lightbox]").forEach(img => {
  img.addEventListener("click", () => {
    const view = document.querySelector("#lightbox");
    view.querySelector("img").src = img.src;
    view.showModal();
  });
});','中級'),
('theme-toggle','JavaScript','ダーク・ライト切り替え','ボタンでページのテーマを切り替え、選択を保存.',array['テーマ','ダークモード','ライトモード','設定'],'const button = document.querySelector("#themeToggle");
button.addEventListener("click", () => {
  document.documentElement.classList.toggle("light");
  localStorage.setItem("theme", document.documentElement.classList.contains("light") ? "light" : "dark");
});','中級'),
('sticky-header','CSS','スクロール追従ヘッダー','ページをスクロールしても上部に固定されるヘッダー.',array['ヘッダー','固定','スクロール','ナビゲーション'],'.header { position:sticky; top:0; z-index:100; background:rgba(10,14,25,.88); backdrop-filter:blur(12px); }','初級'),
('form-validation','JavaScript','入力フォームの簡易チェック','必須項目が入力されているかを確認する.',array['フォーム','入力','バリデーション','確認'],'const form = document.querySelector("#myForm");
form.addEventListener("submit", event => {
  if (!form.reportValidity()) event.preventDefault();
});','初級'),
('animated-gradient','CSS','アニメーションするグラデーション','背景色がゆっくり変化する演出.',array['アニメーション','背景','グラデーション','動き'],'.gradient { background:linear-gradient(120deg,#5947a8,#147d91,#5947a8); background-size:200% 200%; animation:flow 8s ease infinite; }
@keyframes flow { 50% { background-position:100% 50%; } }','中級')
on conflict (id) do update set category=excluded.category,title=excluded.title,description=excluded.description,tags=excluded.tags,code=excluded.code,difficulty=excluded.difficulty;

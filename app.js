import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cbfkgosvqiltsikextxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OWxhfU4hwbQz85zYoDOJSA_TWds3EZA";
const BUCKET = "aevshare";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const fileInput = $("fileInput"), dropzone = $("dropzone");
let localFiles = [];
let activeFilter = "all";
let toastTimer;
$("year").textContent = new Date().getFullYear();

function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
}
function kind(file) {
  const name = file.name.toLowerCase();
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (/\.(zip|7z|rar|tar|gz)$/i.test(name)) return "archive";
  return "other";
}
function iconFor(k) { return ({image:"▧",video:"▷",archive:"▣",pdf:"▤",other:"◇"})[k] || "◇"; }
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  const units = ["KB","MB","GB","TB"]; let n = bytes / 1024, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return n.toFixed(1) + " " + units[i];
}
function safeName(name) { return name.replace(/[\\/]/g,"_").replace(/[^\p{L}\p{N}._ -]/gu,"_").slice(0,140) || "file"; }
function loadLocal() {
  try { localFiles = JSON.parse(localStorage.getItem("aevshare-files") || "[]"); } catch { localFiles = []; }
}
function saveLocal() {
  try { localStorage.setItem("aevshare-files", JSON.stringify(localFiles.slice(0,100))); } catch {}
}
function emptyState(target, message="まだファイルがありません") {
  target.innerHTML = '<div class="empty-state"><span>▤</span><strong>' + message + '</strong><small>アップロードしたファイルがここに表示されます。</small></div>';
}
function renderRows(target, items) {
  target.innerHTML = "";
  if (!items.length) { emptyState(target); return; }
  items.forEach(item => {
    const row = document.createElement("div"); row.className = "file-row";
    const icon = document.createElement("div"); icon.className = "file-icon"; icon.textContent = iconFor(item.kind);
    const meta = document.createElement("div"); meta.className = "file-meta";
    const name = document.createElement("div"); name.className = "file-name"; name.textContent = item.name;
    const sub = document.createElement("div"); sub.className = "file-sub"; sub.textContent = formatSize(item.size) + " · " + new Date(item.createdAt).toLocaleString("ja-JP");
    meta.append(name, sub);
    const actions = document.createElement("div"); actions.className = "file-actions";
    const copy = document.createElement("button"); copy.className = "small-btn"; copy.textContent = "URLをコピー";
    copy.addEventListener("click", async () => { try { await navigator.clipboard.writeText(item.url); toast("共有URLをコピーしました"); } catch { window.prompt("共有URL", item.url); } });
    const open = document.createElement("button"); open.className = "small-btn"; open.textContent = "開く";
    open.addEventListener("click", () => window.open(item.url, "_blank", "noopener"));
    actions.append(copy, open); row.append(icon, meta, actions); target.append(row);
  });
}
function refresh() {
  renderRows($("recentList"), localFiles.slice(0,4));
  const filtered = activeFilter === "all" ? localFiles : localFiles.filter(f => f.kind === activeFilter);
  renderRows($("libraryList"), filtered);
}
function showView(view) {
  $("uploadView").hidden = view !== "upload";
  $("libraryView").hidden = view !== "library";
  $("settingsView").hidden = view !== "settings";
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view || (view === "library" && b.dataset.filter === activeFilter)));
  $("main").scrollTo?.({top:0,behavior:"smooth"});
}
function showLibrary(filter) {
  activeFilter = filter;
  const titles = {all:"最近のファイル",image:"画像",video:"動画",archive:"ZIP・圧縮ファイル",pdf:"PDF",other:"その他"};
  $("libraryTitle").textContent = titles[filter] || "ファイル";
  refresh(); showView("library");
}
async function uploadFiles(files) {
  if (!files.length) return;
  $("uploadQueue").hidden = false; $("uploadQueue").innerHTML = "";
  for (const file of files) {
    const item = document.createElement("div"); item.className = "queue-item";
    const label = document.createElement("div"); label.textContent = file.name + " · " + formatSize(file.size);
    const progress = document.createElement("div"); progress.className = "progress";
    const bar = document.createElement("i"); progress.append(bar); item.append(label, progress); $("uploadQueue").append(item);
    if (file.size > 50 * 1024 * 1024) { label.textContent += " — 50MBを超えています"; continue; }
    const path = new Date().toISOString().slice(0,10) + "/" + crypto.randomUUID() + "-" + safeName(file.name);
    try {
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {cacheControl:"3600", upsert:false, contentType:file.type || "application/octet-stream"});
      if (error) throw error;
      bar.style.width = "100%";
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const record = {name:file.name,size:file.size,kind:kind(file),url:data.publicUrl,path,createdAt:new Date().toISOString()};
      localFiles.unshift(record); saveLocal();
      label.textContent = file.name + " — アップロード完了";
      toast("アップロードが完了しました");
    } catch (err) {
      label.textContent = file.name + " — 失敗: " + (err?.message || "接続エラー");
    }
  }
  refresh();
  setTimeout(() => { $("uploadQueue").hidden = true; }, 9000);
  fileInput.value = "";
}
$("chooseBtn").addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => uploadFiles([...fileInput.files]));
dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("dragover"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", e => { e.preventDefault(); dropzone.classList.remove("dragover"); uploadFiles([...e.dataTransfer.files]); });
$("menuToggle").addEventListener("click", () => {
  const opened = $("sidebar").classList.toggle("open");
  $("menuToggle").setAttribute("aria-expanded", String(opened));
});
document.querySelectorAll("[data-view]").forEach(b => b.addEventListener("click", () => { showView(b.dataset.view); $("sidebar").classList.remove("open"); }));
document.querySelectorAll("[data-filter]").forEach(b => b.addEventListener("click", () => { showLibrary(b.dataset.filter); $("sidebar").classList.remove("open"); }));
$("showAllBtn").addEventListener("click", () => showLibrary("all"));
$("goUploadBtn").addEventListener("click", () => showView("upload"));
loadLocal(); refresh();
(async () => {
  try {
    const { error } = await supabase.storage.from(BUCKET).list("", {limit:1});
    $("connectionStatus").textContent = error ? "接続確認待ち：Storageのバケット・権限設定が必要です。" : "Supabaseとの接続を確認しました。";
  } catch { $("connectionStatus").textContent = "接続できません。Supabaseの設定を確認してください。"; }
})();
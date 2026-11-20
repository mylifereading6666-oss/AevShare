import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://cbfkgosvqiltsikextxv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_OWxhfU4hwbQz85zYoDOJSA_TWds3EZA";
const BUCKET = "aevshare";
const SHARE_SECONDS = 7 * 24 * 60 * 60;
const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const RECEIVED_KEY = "aevshare_received_links_v1";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (id) => document.getElementById(id);
const fileInput = $("fileInput"), dropzone = $("dropzone");
let currentUser = null, myFiles = [], webArchives = [], activeFilter = "all", toastTimer;

$("year").textContent = new Date().getFullYear();
function toast(message) {
  const el = $("toast"); el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}
function authMessage(message) { $("authMessage").textContent = message; }
function kind(name, mime="") {
  const n = name.toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif)$/i.test(n)) return "image";
  if (mime.startsWith("video/") || /\.(mp4|webm|mov)$/i.test(n)) return "video";
  if (mime === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (/\.(zip|7z|rar|tar|gz)$/i.test(n)) return "archive";
  return "other";
}
function iconFor(k) { return ({image:"▧",video:"▷",archive:"▣",pdf:"▤",other:"◇"})[k] || "◇"; }
function formatSize(bytes=0) {
  if (bytes < 1024) return bytes + " B";
  const units=["KB","MB","GB","TB"]; let n=bytes/1024,i=0;
  while(n>=1024&&i<units.length-1){n/=1024;i++;}
  return n.toFixed(1)+" "+units[i];
}
function safeName(name) { return name.replace(/[\\/]/g,"_").replace(/[^\p{L}\p{N}._ -]/gu,"_").slice(0,140)||"file"; }
function emptyState(target,message="まだファイルがありません") {
  target.innerHTML='<div class="empty-state"><span>▤</span><strong>'+message+'</strong><small>アップロードしたファイルがここに表示されます。</small></div>';
}
async function createShareUrl(item) {
  if(!item.isWebArchive && Date.now() >= item.expiresAt) throw new Error("30日間の削除期限を過ぎています。先にファイルを削除してください。");
  const {data,error}=await supabase.storage.from(BUCKET).createSignedUrl(item.path,SHARE_SECONDS,{download:false});
  if(error) throw error;
  return data.signedUrl;
}
async function renderRows(target,items) {
  target.innerHTML="";
  if(!items.length){emptyState(target);return;}
  for(const item of items){
    const row=document.createElement("div");row.className="file-row";
    const icon=document.createElement("div");icon.className="file-icon";icon.textContent=iconFor(item.kind);
    const meta=document.createElement("div");meta.className="file-meta";
    const name=document.createElement("div");name.className="file-name";name.textContent=item.name;
    const sub=document.createElement("div");sub.className="file-sub";sub.textContent=formatSize(item.size)+" · アップロード: "+new Date(item.createdAt).toLocaleString("ja-JP");
    const countdown=document.createElement("div");countdown.className="file-countdown";countdown.dataset.expires=item.expiresAt;
    meta.append(name,sub);
    const actions=document.createElement("div");actions.className="file-actions";
    const copy=document.createElement("button");copy.className="small-btn";copy.textContent="共有URLを発行・コピー";
    copy.addEventListener("click",async()=>{
      copy.disabled=true;copy.textContent="発行中…";
      try{const url=await createShareUrl(item);try{await navigator.clipboard.writeText(url);toast("7日間有効な共有URLをコピーしました");}catch{window.prompt("7日間有効な共有URL",url);}}
      catch(err){toast("URL発行に失敗: "+(err?.message||"エラー"));}
      finally{copy.disabled=false;copy.textContent="共有URLを発行・コピー";}
    });
    const open=document.createElement("button");open.className="small-btn";open.textContent="閲覧";
    open.addEventListener("click",async()=>{
      try{const url=await createShareUrl(item);window.location.assign(url);}
      catch(err){toast("ファイルを開けません: "+(err?.message||"エラー"));}
    });
    const download=document.createElement("button");download.className="small-btn";download.textContent="ダウンロード";
    download.addEventListener("click",async()=>{
      try{
        if(Date.now() >= item.expiresAt) throw new Error("保存期限の30日を過ぎています。");
        const {data,error}=await supabase.storage.from(BUCKET).createSignedUrl(item.path,SHARE_SECONDS,{download:item.name});
        if(error)throw error;
        window.location.assign(data.signedUrl);
      }catch(err){toast("ダウンロードURLを発行できません: "+(err?.message||"エラー"));}
    });
    const remove=document.createElement("button");remove.className="small-btn danger-btn";remove.textContent="完全削除";
    remove.addEventListener("click",async()=>{
      if(!confirm("このファイルを完全に削除しますか？\n削除後は復元できません。"))return;
      remove.disabled=true;remove.textContent="削除中…";
      try{const {error}=await supabase.storage.from(BUCKET).remove([item.path]);if(error)throw error;myFiles=myFiles.filter(f=>f.path!==item.path);refresh();toast("ファイル本体を完全に削除しました。");}
      catch(err){toast("削除できません: "+(err?.message||"エラー"));remove.disabled=false;remove.textContent="完全削除";}
    });
    actions.append(copy,open,download,remove);meta.append(name,sub,countdown);row.append(icon,meta,actions);target.append(row);
  }
}
function refresh(){
  renderRows($("recentList"),myFiles.slice(0,4));
  const filtered=activeFilter==="all"?myFiles:myFiles.filter(f=>f.kind===activeFilter);
  renderRows($("libraryList"),filtered);
}
function showView(view){
  $("uploadView").hidden=view!=="upload";$("libraryView").hidden=view!=="library";$("settingsView").hidden=view!=="settings";$("webarchiveView").hidden=view!=="webarchive";
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view||(view==="library"&&b.dataset.filter===activeFilter)));
  $("main").scrollTo?.({top:0,behavior:"smooth"});
}
function showLibrary(filter){
  activeFilter=filter;
  const titles={all:"すべてのファイル",image:"画像",video:"動画",archive:"ZIP・圧縮ファイル",pdf:"PDF",other:"その他"};
  $("libraryTitle").textContent=titles[filter]||"ファイル";refresh();showView("library");
}
async function loadFiles(){
  if(!currentUser)return;
  const storage=supabase.storage.from(BUCKET);
  const {data:rootData,error:rootError}=await storage.list(currentUser.id,{limit:1000,sortBy:{column:"created_at",order:"desc"}});
  if(rootError)throw rootError;
  const rootRows=(rootData||[]).filter(x=>x.name&&x.id);
  let nestedRows=[];
  try{const {data,error}=await storage.list(currentUser.id+"/web-archives",{limit:1000,sortBy:{column:"created_at",order:"desc"}});if(!error)nestedRows=(data||[]).filter(x=>x.name&&x.id);}
  catch(err){console.warn("旧アーカイブフォルダの読み込みをスキップしました",err);}
  const isArchive=x=>x.metadata?.aevshareType==="web-archive"||x.name?.startsWith("webarchive-")||x.name?.endsWith("-webarchive.json");
  const makeArchive=(x,path)=>{const meta={...(x.metadata||{}),...(x.user_metadata||{})};const sourceUrl=meta.sourceUrl||meta.originalName||"";return{name:sourceUrl||"保存したウェブページ",size:Number(meta.size)||0,path,createdAt:x.created_at||x.updated_at||new Date().toISOString(),sourceUrl};};
  const rootArchives=rootRows.filter(isArchive).map(x=>makeArchive(x,currentUser.id+"/"+x.name));
  const nestedArchives=nestedRows.map(x=>makeArchive(x,currentUser.id+"/web-archives/"+x.name));
  webArchives=[...rootArchives,...nestedArchives].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  myFiles=rootRows.filter(x=>!isArchive(x)).map(x=>({name:x.metadata?.originalName||x.name.replace(/^[0-9a-f-]{36}-/i,""),size:Number(x.metadata?.size)||0,kind:kind(x.name,x.metadata?.mimetype||""),path:currentUser.id+"/"+x.name,createdAt:x.created_at||x.updated_at||new Date().toISOString(),expiresAt:new Date(x.created_at||x.updated_at||new Date().toISOString()).getTime()+RETENTION_MS}));
  refresh();renderWebArchives();updateCountdowns();
}
async function renderWebArchives(){
  const target=$("webarchiveList");if(!target)return;target.replaceChildren();
  if(!webArchives.length){emptyState(target,"保存済みウェブページはありません");return;}
  for(const item of webArchives){
    const row=document.createElement("div");row.className="file-row archive-row";
    const preview=document.createElement("div");preview.className="archive-preview";preview.textContent="WEB";
    const meta=document.createElement("div");meta.className="file-meta";
    const name=document.createElement("div");name.className="file-name archive-url-name";name.textContent=item.sourceUrl||item.name;name.title=item.sourceUrl||item.name;
    const sub=document.createElement("div");sub.className="file-sub";sub.textContent="保存: "+new Date(item.createdAt).toLocaleString("ja-JP")+" · 無期限";
    meta.append(name,sub);
    const actions=document.createElement("div");actions.className="file-actions";
    const open=document.createElement("button");open.className="small-btn";open.textContent="閲覧";
    open.addEventListener("click",async()=>{
      const win=window.open("about:blank","_blank");
      if(!win){toast("ポップアップを許可してください。");return;}
      win.document.write("<!doctype html><meta charset=utf-8><title>読み込み中</title><body style='font:16px sans-serif;padding:24px'>アーカイブを読み込んでいます…</body>");
      try{
        const {data,error}=await supabase.storage.from(BUCKET).download(item.path);if(error)throw error;
        const raw=await data.text();let html=raw,title=item.name;
        if(raw.trimStart().startsWith("{")){const archive=JSON.parse(raw);if(typeof archive?.html!=="string")throw new Error("保存データにHTML本文がありません。");html=archive.html;title=archive.title||title;}
        else if(!/<html[\s>]/i.test(raw)&&!/^<!doctype html/i.test(raw.trimStart()))throw new Error("保存データがHTML形式ではありません。");
        win.document.open();win.document.write("<!doctype html><html><head><meta charset=utf-8><title></title></head><body style='margin:0'></body></html>");win.document.close();win.document.title=title||"AevShare Archive";
        const frame=win.document.createElement("iframe");frame.setAttribute("sandbox","allow-scripts allow-presentation");frame.style.cssText="display:block;border:0;width:100%;height:100vh;background:#fff";frame.srcdoc=html;win.document.body.append(frame);
      }catch(err){try{win.document.body.textContent="アーカイブを開けません: "+(err?.message||"エラー");}catch{}toast("アーカイブを開けません: "+(err?.message||"エラー"));}
    });
    const remove=document.createElement("button");remove.className="small-btn danger-btn";remove.textContent="完全削除";
    remove.addEventListener("click",async()=>{if(!confirm("このウェブアーカイブを完全に削除しますか？"))return;remove.disabled=true;try{const {error}=await supabase.storage.from(BUCKET).remove([item.path]);if(error)throw error;webArchives=webArchives.filter(x=>x.path!==item.path);renderWebArchives();toast("アーカイブを完全削除しました。");}catch(err){toast("削除失敗: "+(err?.message||"エラー"));remove.disabled=false;}});
    actions.append(open,remove);row.append(preview,meta,actions);target.append(row);
    supabase.storage.from(BUCKET).download(item.path).then(async({data,error})=>{
      if(error||!data||!preview.isConnected)return;
      try{
        const raw=await data.text();let html=raw;
        if(raw.trimStart().startsWith("{"))html=JSON.parse(raw).html||"";
        const doc=new DOMParser().parseFromString(html,"text/html");
        const img=doc.querySelector("img[src]");
        const src=img?.getAttribute("src");
        if(src){const image=document.createElement("img");image.alt="保存ページのプレビュー";image.src=src;preview.replaceChildren(image);}
      }catch(err){console.warn("アーカイブのプレビューを取得できません",err);}
    }).catch(err=>console.warn("アーカイブのプレビューを取得できません",err));
  }
}
async function saveWebArchive(){
  if(!currentUser){toast("先にログインしてください");return;}
  const input=$("archiveUrl"),permission=$("archivePermission"),button=$("archiveSaveBtn"),url=input.value.trim();
  if(!url){toast("保存するページのURLを入力してください。");return;}
  if(!permission.checked){toast("保存する権利または許可を確認してください。");return;}
  try{const parsed=new URL(url);if(parsed.protocol!=="https:"||parsed.username||parsed.password)throw new Error();}catch{toast("有効なHTTPSページURLを入力してください。");return;}
  button.disabled=true;button.textContent="ページと画像を取得中…";
  try{
    const {data,error}=await supabase.functions.invoke("aevshare-web-archive",{body:{url,permissionConfirmed:true}});
    if(error){
      let detail="";try{const response=error.context;if(response?.clone){const body=await response.clone().json();detail=body?.error||"";}}catch{}
      throw new Error(detail||error.message||"アーカイブを保存できませんでした。");
    }
    if(!data?.success)throw new Error(data?.error||"アーカイブを保存できませんでした。");
    input.value="";permission.checked=false;
    if(data.path){
      webArchives.unshift({name:url,size:Number(data.size)||0,path:data.path,createdAt:new Date().toISOString(),sourceUrl:url});
      renderWebArchives();
    }
    try{await loadFiles();}catch(listErr){console.warn("保存後の一覧再取得に失敗しました",listErr);}
    toast("ウェブアーカイブを保存しました（"+data.imageCount+"枚の画像を保存）。");
  }catch(err){toast("保存失敗: "+(err?.message||"接続エラー"));}
  finally{button.disabled=false;button.textContent="ページをアーカイブ保存";}
}
$("archiveSaveBtn")?.addEventListener("click",saveWebArchive);
$("archiveUrl")?.addEventListener("keydown",e=>{if(e.key==="Enter")saveWebArchive();});
function updateCountdowns(){
  document.querySelectorAll(".file-countdown").forEach(el=>{
    const left=Number(el.dataset.expires)-Date.now();
    if(left<=0){el.textContent="⚠ 削除期限超過：速やかに完全削除してください";el.classList.add("expired");return;}
    const total=Math.floor(left/1000),days=Math.floor(total/86400),hours=Math.floor((total%86400)/3600),minutes=Math.floor((total%3600)/60);
    el.textContent="削除期限まで残り "+days+"日 "+hours+"時間 "+minutes+"分";el.classList.remove("expired");
  });
}
setInterval(updateCountdowns,1000);
function getReceived(){try{return JSON.parse(localStorage.getItem(RECEIVED_KEY)||"[]");}catch{return [];}}
function saveReceived(items){localStorage.setItem(RECEIVED_KEY,JSON.stringify(items));renderReceived();}
function renderReceived(){
  const target=$("receivedList");if(!target)return;target.innerHTML="";const items=getReceived();
  if(!items.length){emptyState(target,"受信した共有URLはありません");return;}
  items.forEach((item,index)=>{const row=document.createElement("div");row.className="file-row";const meta=document.createElement("div");meta.className="file-meta";const name=document.createElement("div");name.className="file-name";name.textContent=item.label||"受信した共有ファイル";const sub=document.createElement("div");sub.className="file-sub";sub.textContent="この端末に保存された共有URL";meta.append(name,sub);const actions=document.createElement("div");actions.className="file-actions";const open=document.createElement("button");open.className="small-btn";open.textContent="共有ファイルを開く";open.addEventListener("click",()=>window.open(item.url,"_blank","noopener"));const remove=document.createElement("button");remove.className="small-btn danger-btn";remove.textContent="自分のリストから削除";remove.addEventListener("click",()=>{const next=getReceived();next.splice(index,1);saveReceived(next);toast("受信リストから削除しました。相手のファイル本体には影響しません。");});actions.append(open,remove);row.append(meta,actions);target.append(row);});
}
async function uploadFromUrl(){
  if(!currentUser){toast("先にログインしてください");return;}
  const input=$("remoteFileUrl"),button=$("remoteUploadBtn"),permission=$("remotePermission");
  const url=input.value.trim();
  if(!url){toast("ファイルのURLを入力してください。");return;}
  if(!permission?.checked){toast("取得・保存する権利または許可を確認してください。");return;}
  let parsed;
  try{parsed=new URL(url);if(parsed.protocol!=="https:"||parsed.username||parsed.password)throw new Error();}
  catch{toast("有効なHTTPSのファイルURLを入力してください。");return;}
  button.disabled=true;button.textContent="URLから取得中…";
  try{
    if(/(^|\.)youtube\.com$/i.test(parsed.hostname) || /(^|\.)youtu\.be$/i.test(parsed.hostname)){
      throw new Error("YouTubeの動画ページURLには対応していません。公開された直接ダウンロード可能なファイルURLを入力してください。");
    }
    const {data,error}=await supabase.functions.invoke("aevshare-url-upload",{body:{url,permissionConfirmed:true}});
    if(error){
      let detail="";
      try{
        const response=error.context;
        if(response && typeof response.clone==="function"){
          const body=await response.clone().json();
          detail=body?.error||"";
        }else if(response?.json && typeof response.json==="object"){
          detail=response.json.error||"";
        }
      }catch{}
      throw new Error(detail||error.message||"ファイルを取得できませんでした。");
    }
    if(!data?.success)throw new Error(data?.error||"ファイルを取得できませんでした。");
    toast("URLからファイルを保存しました: "+data.name);
    input.value="";
    permission.checked=false;
    await loadFiles();
  }catch(err){
    const message=err?.context?.json?.error||err?.message||"接続エラー";
    toast("URLアップロード失敗: "+message);
  }finally{button.disabled=false;button.textContent="URLからアップロード";}
}
$("remoteUploadBtn")?.addEventListener("click",uploadFromUrl);
$("remoteFileUrl")?.addEventListener("keydown",e=>{if(e.key==="Enter")uploadFromUrl();});
async function uploadFiles(files){
  if(!currentUser){toast("先にログインしてください");return;}
  if(!files.length)return;
  $("uploadQueue").hidden=false;$("uploadQueue").innerHTML="";
  for(const file of files){
    const item=document.createElement("div");item.className="queue-item";
    const label=document.createElement("div");label.textContent=file.name+" · "+formatSize(file.size);
    const progress=document.createElement("div");progress.className="progress";const bar=document.createElement("i");
    progress.append(bar);item.append(label,progress);$("uploadQueue").append(item);
    if(file.size>50*1024*1024){label.textContent+=" — 50MBを超えています";continue;}
    const path=currentUser.id+"/"+crypto.randomUUID()+"-"+safeName(file.name);
    try{
      const {error}=await supabase.storage.from(BUCKET).upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type||"application/octet-stream",metadata:{originalName:file.name,size:file.size}});
      if(error)throw error;
      bar.style.width="100%";label.textContent=file.name+" — アップロード完了";
      toast("非公開で保存しました。保存期間はアップロードから30日間です。");
    }catch(err){label.textContent=file.name+" — 失敗: "+(err?.message||"接続エラー");}
  }
  await loadFiles();setTimeout(()=>$("uploadQueue").hidden=true,9000);fileInput.value="";
}
async function enterWorkspace(user){
  currentUser=user;$("authPanel").hidden=true;$("workspace").hidden=false;$("accountEmail").textContent=user.email||"ログイン中";
  try{await loadFiles();}catch(err){toast("ファイル一覧を取得できません: "+(err?.message||"エラー"));}
}
async function leaveWorkspace(){
  currentUser=null;myFiles=[];webArchives=[];$("workspace").hidden=true;$("authPanel").hidden=false;
  $("loginPassword").value="";$("signupPassword").value="";
}
$("loginBtn").addEventListener("click",async()=>{
  const email=$("loginEmail").value.trim(),password=$("loginPassword").value;
  if(!email||!password){authMessage("メールアドレスとパスワードを入力してください。");return;}
  $("loginBtn").disabled=true;
  const {data,error}=await supabase.auth.signInWithPassword({email,password});
  $("loginBtn").disabled=false;
  if(error){authMessage("ログインできません: "+error.message);return;}
  authMessage("ログインしました。");await enterWorkspace(data.user);
});
$("signupBtn").addEventListener("click",async()=>{
  const email=$("signupEmail").value.trim(),password=$("signupPassword").value;
  if(!email||password.length<6){authMessage("メールアドレスと6文字以上のパスワードを入力してください。");return;}
  $("signupBtn").disabled=true;
  const {data,error}=await supabase.auth.signUp({email,password});
  $("signupBtn").disabled=false;
  if(error){authMessage("登録できません: "+error.message);return;}
  if(data.session){authMessage("アカウントを作成しました。");await enterWorkspace(data.user);}
  else authMessage("確認メールを送信しました。メール内の確認リンクを開いてからログインしてください。");
});
$("logoutBtn").addEventListener("click",async()=>{const {error}=await supabase.auth.signOut();if(error){toast(error.message);return;}await leaveWorkspace();authMessage("ログアウトしました。");});
$("chooseBtn").addEventListener("click",()=>fileInput.click());
fileInput.addEventListener("change",()=>uploadFiles([...fileInput.files]));
dropzone.addEventListener("dragover",e=>{e.preventDefault();dropzone.classList.add("dragover");});
dropzone.addEventListener("dragleave",()=>dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop",e=>{e.preventDefault();dropzone.classList.remove("dragover");uploadFiles([...e.dataTransfer.files]);});
function setMenuOpen(open){
  $("sidebar").classList.toggle("open",open);document.body.classList.toggle("menu-open",open);
  $("menuToggle").setAttribute("aria-expanded",String(open));$("menuToggle").setAttribute("aria-label",open?"メニューを閉じる":"メニューを開く");
}
$("menuToggle").addEventListener("click",()=>setMenuOpen(!$("sidebar").classList.contains("open")));
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>{showView(b.dataset.view);setMenuOpen(false);}));
document.querySelectorAll("[data-filter]").forEach(b=>b.addEventListener("click",()=>{showLibrary(b.dataset.filter);setMenuOpen(false);}));
$("showAllBtn").addEventListener("click",()=>showLibrary("all"));
$("goUploadBtn").addEventListener("click",()=>showView("upload"));
$("saveReceivedBtn")?.addEventListener("click",()=>{const url=$("receivedUrlInput").value.trim();if(!/^https:\/\//i.test(url)||!url.includes("supabase.co/storage/")){toast("Supabaseの共有URLを入力してください。");return;}const label=$("receivedLabelInput").value.trim()||"受信した共有ファイル";const items=getReceived();if(items.some(x=>x.url===url)){toast("このURLは登録済みです。");return;}items.unshift({url,label});saveReceived(items);$("receivedUrlInput").value="";$("receivedLabelInput").value="";toast("受信リストに追加しました。");});
renderReceived();
const consent=$("cookieConsent");if(consent){const choice=document.cookie.split("; ").find(x=>x.startsWith("aevshare_consent="));consent.hidden=!!choice;$("cookieAcceptBtn")?.addEventListener("click",()=>{document.cookie="aevshare_consent=accepted; Max-Age=31536000; Path=/; SameSite=Lax; Secure";consent.hidden=true;toast("Cookieへの同意を保存しました。");});$("cookieRejectBtn")?.addEventListener("click",()=>{document.cookie="aevshare_consent=declined; Max-Age=31536000; Path=/; SameSite=Lax; Secure";consent.hidden=true;toast("Cookieの任意利用には同意しない設定を保存しました。");});}
$("connectionStatus")?.replaceChildren();
const {data:{session}}=await supabase.auth.getSession();
if(session?.user)await enterWorkspace(session.user);

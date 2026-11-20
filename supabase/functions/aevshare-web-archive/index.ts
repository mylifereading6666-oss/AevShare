import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseHTML } from "https://esm.sh/linkedom@0.18.12";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const BUCKET="aevshare",MAX_HTML=10*1024*1024,MAX_IMAGE=25*1024*1024,MAX_VIDEO=25*1024*1024,MAX_TOTAL=50*1024*1024,TIMEOUT_MS=25000;
const ORIGIN="https://mylifereading6666-oss.github.io";
const cors={"Access-Control-Allow-Origin":ORIGIN,"Access-Control-Allow-Headers":"authorization, apikey, content-type, x-client-info","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"};
function json(body:Record<string,unknown>,status=200){return new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json; charset=utf-8"}});}
function private4(ip:string){const p=ip.split(".").map(Number);if(p.length!==4||p.some(n=>!Number.isInteger(n)||n<0||n>255))return true;const[a,b]=p;return a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||b===0))||(a===198&&(b===18||b===19||b===51))||(a===203&&b===0);}
function private6(ip:string){const v=ip.toLowerCase().split("%")[0];return v==="::"||v==="::1"||v.startsWith("::ffff:")||v.startsWith("fc")||v.startsWith("fd")||/^fe[89ab]/.test(v)||v.startsWith("ff")||v.startsWith("2001:db8");}
async function checked(raw:string){let u:URL;try{u=new URL(raw);}catch{throw new Error("URLの形式が正しくありません。");}if(u.protocol!=="https:"||u.username||u.password||(u.port&&u.port!=="443"))throw new Error("HTTPS（標準ポート443）のURLだけ利用できます。");const h=u.hostname.toLowerCase().replace(/^\[|\]$/g,"");if(!h.includes(".")||h==="localhost"||h.endsWith(".localhost")||h.endsWith(".local")||h.endsWith(".internal")||h.endsWith(".test")||/^[0-9.]+$/.test(h)||h.includes(":"))throw new Error("この接続先は安全確認のため利用できません。");const ips:string[]=[];try{ips.push(...await Deno.resolveDns(h,"A"));}catch{}try{ips.push(...await Deno.resolveDns(h,"AAAA"));}catch{}if(!ips.length||ips.some(ip=>ip.includes(":")?private6(ip):private4(ip)))throw new Error("接続先の安全性を確認できませんでした。");return u;}
async function fetchBounded(raw:string,max:number,htmlOnly=false,videoOnly=false){let u=await checked(raw),r:Response|null=null;const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),TIMEOUT_MS);try{for(let i=0;i<=3;i++){r=await fetch(u,{redirect:"manual",signal:ctl.signal,headers:{"User-Agent":"AevShare-Archive/1.0"}});if([301,302,303,307,308].includes(r.status)){const loc=r.headers.get("location");if(!loc||i===3)throw new Error("転送回数の上限を超えました。");u=await checked(new URL(loc,u).toString());continue;}break;}if(!r?.ok)throw new Error("ページまたは画像を取得できませんでした（HTTPエラー）。");const ct=(r.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();let resolvedType=ct;if(htmlOnly&&!["text/html","application/xhtml+xml"].includes(ct))throw new Error("HTML形式の公開ページURLを指定してください。");if(videoOnly){const ext=u.pathname.toLowerCase().match(/\.(mp4|webm|ogv|ogg)$/)?.[1];const inferred=ext==="mp4"?"video/mp4":ext==="webm"?"video/webm":ext?"video/ogg":"";if(!["video/mp4","video/webm","video/ogg"].includes(ct)&&!(ct==="application/octet-stream"&&inferred))throw new Error("MP4・WebM・OGGの直接動画ファイルではありません。");if(ct==="application/octet-stream"&&inferred)resolvedType=inferred;}if(!htmlOnly&&!videoOnly&&!ct.startsWith("image/"))throw new Error("画像形式ではありません。");const len=Number(r.headers.get("content-length")||0);if(len>max)throw new Error("取得データが容量上限を超えています。");const buf=new Uint8Array(await r.arrayBuffer());if(buf.length>max)throw new Error("取得データが容量上限を超えています。");return{bytes:buf,type:resolvedType,url:u};}finally{clearTimeout(timer);}}
function b64(bytes:Uint8Array){let s="";for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s);}
Deno.serve(async req=>{if(req.method==="OPTIONS")return new Response("ok",{headers:cors});if(req.method!=="POST")return json({success:false,error:"POSTのみ対応しています。"},405);if(req.headers.get("origin")!==ORIGIN)return json({success:false,error:"許可されていないアクセス元です。"},403);
try{const auth=req.headers.get("authorization")||"",key=req.headers.get("apikey")||"";if(!auth.startsWith("Bearer ")||!key)return json({success:false,error:"ログインが必要です。"},401);const sb=createClient(SUPABASE_URL,key,{global:{headers:{Authorization:auth}},auth:{persistSession:false,autoRefreshToken:false}});const{data:user,error:userErr}=await sb.auth.getUser();if(userErr||!user.user)return json({success:false,error:"ログイン状態を確認できませんでした。"},401);const body=await req.json().catch(()=>null);if(!body||typeof body.url!=="string"||body.url.length>4096)return json({success:false,error:"ページURLを正しく入力してください。"},400);if(body.permissionConfirmed!==true)return json({success:false,error:"保存する権利または許可の確認が必要です。"},400);
const page=await fetchBounded(body.url,MAX_HTML,true);const decoder=new TextDecoder("utf-8");const {document:doc}=parseHTML(decoder.decode(page.bytes));if(!doc)throw new Error("ページを解析できませんでした。");
doc.querySelectorAll("script,frame,object,embed,form,base,link[rel=stylesheet],meta[http-equiv=refresh],noscript").forEach(n=>n.remove());
for(const frame of [...doc.querySelectorAll("iframe")]){try{const src=new URL(frame.getAttribute("src")||"",page.url);const host=src.hostname.toLowerCase();const allowed=src.protocol==="https:"&&((host==="www.youtube.com"||host==="youtube.com"||host==="www.youtube-nocookie.com"||host==="youtube-nocookie.com")&&src.pathname.startsWith("/embed/")||(host==="player.vimeo.com"&&src.pathname.startsWith("/video/")));if(!allowed){frame.remove();continue;}frame.setAttribute("loading","lazy");frame.setAttribute("referrerpolicy","strict-origin-when-cross-origin");frame.setAttribute("allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen");frame.setAttribute("allowfullscreen","");frame.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");}catch{frame.remove();}}
for(const el of [...doc.querySelectorAll("*")]){for(const a of [...el.attributes]){const n=a.name.toLowerCase(),v=a.value.trim();if(n.startsWith("on")||n==="srcdoc"||((n==="href"||n==="src"||n==="xlink:href"||n==="action")&&/^\s*javascript:/i.test(v)))el.removeAttribute(a.name);}if(el.tagName==="A"){el.setAttribute("target","_blank");el.setAttribute("rel","noopener noreferrer");}}
const title=(doc.querySelector("title")?.textContent||doc.querySelector("h1")?.textContent||page.url.hostname).trim().slice(0,180);
const images=[...doc.querySelectorAll("img")];let total=page.bytes.length,imageCount=0;
for(const img of images){const src=img.getAttribute("src")||img.getAttribute("data-src");if(!src||/^(data:|blob:)/i.test(src))continue;try{const asset=await fetchBounded(new URL(src,page.url).toString(),MAX_IMAGE,false);if(total+asset.bytes.length>MAX_TOTAL){img.removeAttribute("src");continue;}const mime=asset.type==="image/svg+xml"?"image/svg+xml":asset.type;img.setAttribute("src","data:"+mime+";base64,"+b64(asset.bytes));img.removeAttribute("srcset");img.removeAttribute("data-src");total+=asset.bytes.length;imageCount++;}catch{ /* leave original URL as a visible fallback */ }}
doc.querySelectorAll("img").forEach(img=>{img.setAttribute("loading","lazy");img.setAttribute("referrerpolicy","no-referrer");});
// メイン動画を1本だけ選択する。video要素と許可済みYouTube/Vimeo iframeを候補にし、
// width/heightまたはstyleで判定できる表示面積が最大のものを優先（同点ならページ内で先に出るもの）。
// サブ動画・広告動画などはアーカイブから除外する。
const videoCandidates=[...doc.querySelectorAll("video,iframe")].filter(el=>{
  if(el.tagName.toLowerCase()==="video")return true;
  try{const u=new URL(el.getAttribute("src")||"",page.url);const h=u.hostname.toLowerCase();return u.protocol==="https:"&&((["youtube.com","www.youtube.com","youtube-nocookie.com","www.youtube-nocookie.com"].includes(h)&&u.pathname.startsWith("/embed/"))||(h==="player.vimeo.com"&&u.pathname.startsWith("/video/"));}catch{return false;}
});
const dimension=(el:string,attr:string)=>{
  const raw=el.getAttribute(attr)||el.getAttribute("data-"+attr)||"";
  const style=el.getAttribute("style")||"";
  const match=raw.match(/[0-9]+(?:\\.[0-9]+)?/)||style.match(new RegExp("(?:^|;)\\s*"+attr+"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)px","i"));
  return match?Number(match[0]):0;
};
const videoArea=(el:Element)=>dimension(el,"width")*dimension(el,"height");
let mainVideo:Element|null=null;
if(videoCandidates.length){
  mainVideo=videoCandidates.reduce((best,el)=>videoArea(el)>videoArea(best)?el:best,videoCandidates[0]);
  for(const el of videoCandidates)if(el!==mainVideo)el.remove();
}
// 公開されているMP4・WebM・OGGの直接動画ファイルは、選ばれたメインvideo要素の分だけ保存。
// HLS/DASH、DRM、ログイン必須の配信ストリームは対象外。
const videoSources:Element[]=mainVideo?.tagName.toLowerCase()==="video"
  ? [...(mainVideo.hasAttribute("src")?[mainVideo]:[]),...mainVideo.querySelectorAll("source[src]")]
  : [];
const videoCache=new Map<string,string>();
let videoCount=0;
for(const source of videoSources){
  const rawSrc=source.getAttribute("src");
  if(!rawSrc||/^(data:|blob:)/i.test(rawSrc))continue;
  try{
    const absolute=new URL(rawSrc,page.url).toString();
    let dataUrl=videoCache.get(absolute);
    if(!dataUrl){
      const asset=await fetchBounded(absolute,MAX_VIDEO,false,true);
      const encoded="data:"+asset.type+";base64,"+b64(asset.bytes);
      const estimated=encoded.length;
      if(total+estimated>MAX_TOTAL)throw new Error("メイン動画を含む保存データが50MBを超えます。");
      dataUrl=encoded;videoCache.set(absolute,dataUrl);total+=estimated;videoCount++;
    }
    source.setAttribute("src",dataUrl);
    if(source.tagName.toLowerCase()==="video"){source.setAttribute("controls","");source.setAttribute("playsinline","");source.setAttribute("preload","metadata");}
  }catch{
    // 取得できないメイン動画は元URLを残し、オンライン再生の可能性を維持する。
  }
}
if(mainVideo?.tagName.toLowerCase()==="video"){mainVideo.setAttribute("controls","");mainVideo.setAttribute("playsinline","");mainVideo.setAttribute("preload","metadata");}

doc.querySelectorAll("style").forEach(s=>{if((s.textContent||"").length>200000)s.remove();});
const html="<!doctype html>\n"+doc.documentElement.outerHTML;
const bytes=new TextEncoder().encode(html);if(bytes.length>MAX_TOTAL)throw new Error("画像を含む保存データが50MBを超えました。");
const path=user.user.id+"/webarchive-"+crypto.randomUUID()+".html";const{error:upErr}=await sb.storage.from(BUCKET).upload(path,bytes,{contentType:"text/plain; charset=utf-8",cacheControl:"3600",upsert:false,metadata:{aevshareType:"web-archive",originalName:body.url,pageTitle:title,size:bytes.length,mimetype:"text/html",sourceUrl:body.url,imageCount,videoCount}});
if(upErr)throw new Error("アーカイブの保存に失敗しました: "+upErr.message);return json({success:true,title,imageCount,videoCount,size:bytes.length,path});
}catch(e){const message=e instanceof Error?e.message:"予期しないエラーが発生しました。";return json({success:false,error:message},message.includes("URL")||message.includes("HTTPS")||message.includes("安全")||message.includes("容量")||message.includes("権利")?400:502);}});

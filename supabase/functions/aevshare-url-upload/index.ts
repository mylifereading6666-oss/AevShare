import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const BUCKET = "aevshare";
const MAX_BYTES = 50 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 25000;
const ALLOWED_ORIGIN = "https://mylifereading6666-oss.github.io";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0);
}

function isPrivateIPv6(ip: string): boolean {
  const value = ip.toLowerCase().split("%")[0];
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("::ffff:")) {
    const mapped = value.slice(7);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(mapped)) return isPrivateIPv4(mapped);
    return true;
  }
  return value.startsWith("fc") || value.startsWith("fd") ||
    /^fe[89ab]/.test(value) || value.startsWith("ff") ||
    value.startsWith("2001:db8");
}

async function validatePublicHttps(raw: string): Promise<URL> {
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("URLの形式が正しくありません。"); }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("HTTPS（標準ポート443）のURLだけ利用できます。");
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host.includes(".") || host === "localhost" || host.endsWith(".localhost") ||
      host.endsWith(".local") || host.endsWith(".internal") || host.endsWith(".test") ||
      /^[0-9.]+$/.test(host) || host.includes(":")) {
    throw new Error("このホスト名は安全確認のため利用できません。");
  }

  // DNS answers are checked before every request and redirect. Any private/reserved
  // address causes a fail-closed rejection.
  const records: string[] = [];
  try { records.push(...await Deno.resolveDns(host, "A")); } catch { /* no A record */ }
  try { records.push(...await Deno.resolveDns(host, "AAAA")); } catch { /* no AAAA record */ }
  if (!records.length) throw new Error("接続先のDNSを確認できませんでした。");
  for (const ip of records) {
    if (ip.includes(":") ? isPrivateIPv6(ip) : isPrivateIPv4(ip)) {
      throw new Error("プライベートネットワークへの接続は許可されていません。");
    }
  }
  return url;
}

function safeFileName(value: string): string {
  const cleaned = value.normalize("NFKC").replace(/[\\/\\0-\\x1f\\x7f]/g, "_")
    .replace(/[^\p{L}\p{N}._ -]/gu, "_").trim().slice(0, 140);
  return cleaned && cleaned !== "." && cleaned !== ".." ? cleaned : "downloaded-file";
}

function filenameFromResponse(response: Response, url: URL): string {
  const disposition = response.headers.get("content-disposition") || "";
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const plain = disposition.match(/filename="?([^";]+)"?/i);
  let name = "downloaded-file";
  try {
    if (utf8) name = decodeURIComponent(utf8[1]);
    else if (plain) name = plain[1];
    else name = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || name);
  } catch { /* keep fallback */ }
  return safeFileName(name);
}

async function fetchLimited(rawUrl: string): Promise<{ bytes: Uint8Array; name: string; contentType: string }> {
  let url = await validatePublicHttps(rawUrl);
  let response: Response | null = null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (let attempt = 0; attempt <= MAX_REDIRECTS; attempt++) {
      response = await fetch(url, { method: "GET", redirect: "manual", signal: controller.signal });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location || attempt === MAX_REDIRECTS) throw new Error("転送回数の上限を超えました。");
        const next = new URL(location, url).toString();
        url = await validatePublicHttps(next);
        continue;
      }
      break;
    }
    if (!response || !response.ok) throw new Error("配布元からファイルを取得できませんでした（HTTPエラー）。");
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_BYTES) throw new Error("ファイルが50MBを超えています。");
    if (!response.body) throw new Error("ファイルデータを読み取れませんでした。");

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new Error("ファイルが50MBを超えています。");
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    const contentType = (response.headers.get("content-type") || "application/octet-stream")
      .split(";")[0].trim().slice(0, 120);
    if (contentType.startsWith("text/html")) throw new Error("HTMLページではなく、ファイルそのもののURLを指定してください。");
    return { bytes, name: filenameFromResponse(response, url), contentType };
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "POSTのみ対応しています。" }, 405);
  if (req.headers.get("origin") !== ALLOWED_ORIGIN) return json({ success: false, error: "許可されていないアクセス元です。" }, 403);

  const authorization = req.headers.get("authorization") || "";
  const apiKey = req.headers.get("apikey") || "";
  if (!authorization.startsWith("Bearer ") || !apiKey) return json({ success: false, error: "ログインが必要です。" }, 401);

  try {
    const supabase = createClient(SUPABASE_URL, apiKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return json({ success: false, error: "ログイン状態を確認できませんでした。" }, 401);

    const body = await req.json().catch(() => null);
    if (!body || typeof body.url !== "string" || body.url.length > 4096) {
      return json({ success: false, error: "ファイルURLを正しく入力してください。" }, 400);
    }

    const { bytes, name, contentType } = await fetchLimited(body.url);
    const path = userData.user.id + "/" + crypto.randomUUID() + "-" + name;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      cacheControl: "3600",
      upsert: false,
      contentType,
      metadata: { originalName: name, size: bytes.byteLength, mimetype: contentType, source: "url" },
    });
    if (uploadError) throw new Error("AevShareへの保存に失敗しました: " + uploadError.message);
    return json({ success: true, name, size: bytes.byteLength });
  } catch (error) {
    const message = error instanceof Error ? error.message : "予期しないエラーが発生しました。";
    const status = message.includes("URL") || message.includes("HTTPS") || message.includes("50MB") ||
      message.includes("ホスト") || message.includes("ネットワーク") ? 400 : 502;
    return json({ success: false, error: message }, status);
  }
});

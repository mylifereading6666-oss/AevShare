// Supabase Edge Function: ai-code-search
// Required Edge Function secrets: OPENAI_API_KEY
// Optional: OPENAI_MODEL (defaults to gpt-4o-mini)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS" };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error:"Method not allowed" }), { status:405, headers:{...cors,"Content-Type":"application/json"} });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global:{ headers:{ Authorization:authHeader } } });
    const { data:{ user }, error:authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({error:"ログインが必要です"}), {status:401,headers:{...cors,"Content-Type":"application/json"}});
    const { query } = await req.json();
    if (typeof query !== "string" || query.trim().length < 2 || query.length > 500) return new Response(JSON.stringify({error:"検索内容は2〜500文字で入力してください"}), {status:400,headers:{...cors,"Content-Type":"application/json"}});
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: snippets, error } = await admin.from("studio_code_snippets").select("id,category,title,description,tags,difficulty,code").limit(100);
    if (error) throw error;
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    const model = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    const prompt = "ユーザーの目的に合うコードを、与えられた一覧から最大3件選んでください。コード自体は新規生成せず、必ず一覧内のidだけを選択してください。該当がなければmatchesを空配列にします。日本語で簡潔に説明してください。JSONのみ返答: {\"matches\":[\"id\"],\"explanation\":\"理由\"}";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method:"POST",
      headers:{ "Authorization":`Bearer ${apiKey}`, "Content-Type":"application/json" },
      body:JSON.stringify({ model, temperature:0.2, response_format:{type:"json_object"}, messages:[{role:"system",content:prompt},{role:"user",content:JSON.stringify({query:query.trim(),snippets:snippets.map(({id,category,title,description,tags,difficulty})=>({id,category,title,description,tags,difficulty}))})}] })
    });
    if (!response.ok) throw new Error("AI provider request failed");
    const payload = await response.json();
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content || "{}");
    const validIds = new Set(snippets.map(x=>x.id));
    const matches = Array.isArray(parsed.matches) ? parsed.matches.filter((id:string)=>validIds.has(id)).slice(0,3) : [];
    return new Response(JSON.stringify({matches, explanation:String(parsed.explanation||"目的に近いコードを選びました。")}), {headers:{...cors,"Content-Type":"application/json"}});
  } catch (e) {
    return new Response(JSON.stringify({error:"AI検索の処理に失敗しました"}), {status:500,headers:{...cors,"Content-Type":"application/json"}});
  }
});
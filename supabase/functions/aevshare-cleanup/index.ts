import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const adminKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const suppliedKey = req.headers.get("apikey");

  if (!supabaseUrl || !adminKey || suppliedKey !== adminKey) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: expired, error } = await admin.rpc("aevshare_expired_paths");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const paths = (expired ?? []).map((row: { name: string }) => row.name);
  let deleted = 0;

  for (let i = 0; i < paths.length; i += 1000) {
    const batch = paths.slice(i, i + 1000);
    const { error: removeError } = await admin.storage.from("aevshare").remove(batch);
    if (removeError) {
      return Response.json(
        { error: removeError.message, deleted, remaining: paths.length - deleted },
        { status: 500 },
      );
    }
    deleted += batch.length;
  }

  return Response.json({ success: true, deleted, checkedAt: new Date().toISOString() });
});

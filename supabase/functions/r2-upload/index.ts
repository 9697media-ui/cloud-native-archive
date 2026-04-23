// Edge function: presigned PUT URL para upload no Cloudflare R2
// Faz autenticação do usuário via JWT do Supabase (anon caller token)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_ACCESS_KEY_ID = Deno.env.get("R2_ACCESS_KEY_ID")!;
const R2_SECRET_ACCESS_KEY = Deno.env.get("R2_SECRET_ACCESS_KEY")!;
const R2_BUCKET = Deno.env.get("R2_BUCKET") ?? "lovableana";
const R2_PUBLIC_BASE = Deno.env.get("R2_PUBLIC_BASE") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { fileName, contentType } = await req.json();
    if (!fileName) {
      return new Response(JSON.stringify({ error: "fileName required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = String(fileName).replace(/[^\w.\-]+/g, "_");
    const key = `${user.id}/${crypto.randomUUID()}/${safeName}`;
    const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${key}`;

    const aws = new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });

    // Sign a PUT URL valid for 5 minutes
    const signed = await aws.sign(
      new Request(`${endpoint}?X-Amz-Expires=300`, {
        method: "PUT",
        headers: contentType ? { "Content-Type": contentType } : {},
      }),
      { aws: { signQuery: true } },
    );

    const publicUrl = R2_PUBLIC_BASE
      ? `${R2_PUBLIC_BASE.replace(/\/$/, "")}/${key}`
      : endpoint;

    return new Response(
      JSON.stringify({ uploadUrl: signed.url, key, publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

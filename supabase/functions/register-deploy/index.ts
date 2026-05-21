import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const ALLOWED_ENVS = new Set([
  "lovable",
  "cloudflare-preview",
  "cloudflare-production",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const expectedToken = Deno.env.get("DEPLOY_WEBHOOK_TOKEN");
    if (!expectedToken) {
      return new Response(
        JSON.stringify({ error: "DEPLOY_WEBHOOK_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const auth = req.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (token !== expectedToken) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { commit_sha, environment, deployed_by, name, description } = body ?? {};

    if (!commit_sha || typeof commit_sha !== "string") {
      return new Response(JSON.stringify({ error: "commit_sha required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!environment || !ALLOWED_ENVS.has(environment)) {
      return new Response(
        JSON.stringify({ error: `environment must be one of ${[...ALLOWED_ENVS].join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // New deploys become the active beta automatically.
    // Promotion to production is a manual admin action via the UI.
    const { data, error } = await supabase
      .from("ui_versions")
      .insert({
        name: name || `${environment} ${commit_sha.slice(0, 7)}`,
        description: description || null,
        commit_sha,
        environment,
        deployed_by: deployed_by || null,
        deployed_at: new Date().toISOString(),
        is_active_beta: true,
        is_active_production: false,
        config_json: {},
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, version: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

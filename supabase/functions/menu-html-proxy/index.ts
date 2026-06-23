import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_TEST_URL = "https://anabrasil.org/ana/";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const rawUrl = typeof body?.url === "string" && body.url.trim() ? body.url.trim() : DEFAULT_TEST_URL;
    const target = new URL(rawUrl);

    if (!/^https?:$/.test(target.protocol)) {
      return new Response(JSON.stringify({ error: "URL inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(target.toString(), {
      headers: {
        "user-agent": "Mozilla/5.0 Lovable Menu Detector",
        "accept": "text/html,application/xhtml+xml",
      },
    });

    if (!upstream.ok) {
      return new Response(JSON.stringify({ error: `Falha ao ler site: ${upstream.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = await upstream.text();
    return new Response(JSON.stringify({ html, sourceUrl: target.toString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
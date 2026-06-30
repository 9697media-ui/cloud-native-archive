import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, folderId, nextPageToken, redirectUri, code } = await req.json();
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    // Build the standalone Google consent URL (does NOT touch the app's auth session)
    if (action === "get_auth_url") {
      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.set("client_id", googleClientId!);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive.readonly");
      authUrl.searchParams.set("access_type", "offline");
      authUrl.searchParams.set("prompt", "consent");
      return new Response(JSON.stringify({ url: authUrl.toString() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange the authorization code for a refresh token and store it globally
    if (action === "exchange_code") {
      const exchange = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: new URLSearchParams({
          client_id: googleClientId!,
          client_secret: googleClientSecret!,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      const exchanged = await exchange.json();
      if (!exchanged.refresh_token) {
        return new Response(JSON.stringify({ error: "no_refresh_token", details: exchanged }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      await supabaseClient.from("global_settings").upsert({
        key: "google_drive_refresh_token",
        value: { refresh_token: exchanged.refresh_token },
      });
      return new Response(JSON.stringify({ connected: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch refresh token from global settings instead of a specific user profile
    const { data: setting } = await supabaseClient
      .from("global_settings")
      .select("value")
      .eq("key", "google_drive_refresh_token")
      .maybeSingle();

    const refreshToken = setting?.value?.refresh_token;

    // Lightweight connection check that does not expose the token.
    if (action === "check_auth") {
      return new Response(JSON.stringify({ connected: !!refreshToken }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!refreshToken) {
      return new Response(JSON.stringify({ error: "google_auth_required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Refresh access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: googleClientId!,
        client_secret: googleClientSecret!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;

    if (!accessToken) {
        return new Response(JSON.stringify({ error: "Could not refresh access token", details: tokens }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
        });
    }

    if (action === "get_folder_name") {
      const url = new URL(`https://www.googleapis.com/drive/v3/files/${folderId}`);
      url.searchParams.set("fields", "name, mimeType");
      
      const driveResponse = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await driveResponse.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list_files") {
      const q = `'${folderId}' in parents and trashed = false`;
      const url = new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set("q", q);
      url.searchParams.set("fields", "nextPageToken, files(id, name, mimeType, shortcutDetails)");
      url.searchParams.set("orderBy", "folder,name");
      if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

      const driveResponse = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const data = await driveResponse.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
// TODO: remover depois de criar os admins iniciais
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMINS = [
  { email: "mkt@anabrasil.org", name: "MKT ANA" },
  { email: "alyson-viana@hotmail.com", name: "Alyson Viana" },
];
const INITIAL_PASSWORD = "AnaBrasil@2026";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: any[] = [];

  for (const u of ADMINS) {
    try {
      // cria usuário (email já confirmado)
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: INITIAL_PASSWORD,
        email_confirm: true,
        user_metadata: { name: u.name },
      });

      let userId = created?.user?.id;

      if (cErr) {
        // se já existe, busca o id
        if (`${cErr.message}`.toLowerCase().includes("already")) {
          let page = 1;
          while (!userId) {
            const { data } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
            const found = data.users.find(
              (x) => (x.email ?? "").toLowerCase() === u.email.toLowerCase(),
            );
            if (found) userId = found.id;
            if (found || data.users.length < 1000) break;
            page++;
          }
          // atualiza senha para a inicial conhecida
          if (userId) {
            await admin.auth.admin.updateUserById(userId, { password: INITIAL_PASSWORD });
          }
        } else {
          results.push({ email: u.email, status: "error", error: cErr.message });
          continue;
        }
      }

      if (!userId) {
        results.push({ email: u.email, status: "error", error: "no user id" });
        continue;
      }

      // garante role admin
      const { error: rErr } = await admin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

      results.push({
        email: u.email,
        status: rErr ? "role_error" : "ok",
        userId,
        roleError: rErr?.message,
      });
    } catch (e) {
      results.push({ email: u.email, status: "exception", error: String(e) });
    }
  }

  return new Response(
    JSON.stringify({ password: INITIAL_PASSWORD, results }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

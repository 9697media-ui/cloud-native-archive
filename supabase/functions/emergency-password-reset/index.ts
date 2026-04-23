// TODO: remover após configurar domínio de e-mail oficial
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, newPassword } = await req.json();

    if (
      typeof email !== "string" ||
      typeof newPassword !== "string" ||
      !email.includes("@") ||
      newPassword.length < 6
    ) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    console.log(`[emergency-reset] Tentativa para: ${email}`);

    // Busca o usuário pelo e-mail (paginando se necessário)
    let foundUser: { id: string; email?: string } | null = null;
    let page = 1;
    const perPage = 1000;
    while (!foundUser) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error("[emergency-reset] erro listUsers", error);
        return new Response(
          JSON.stringify({ error: "Erro interno." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      foundUser = data.users.find(
        (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
      ) ?? null;
      if (foundUser || data.users.length < perPage) break;
      page++;
    }

    if (!foundUser) {
      console.log(`[emergency-reset] e-mail não encontrado: ${email}`);
      // resposta genérica para não revelar existência
      return new Response(
        JSON.stringify({ error: "Não foi possível redefinir a senha." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(foundUser.id, {
      password: newPassword,
    });

    if (updErr) {
      console.error("[emergency-reset] erro updateUserById", updErr);
      return new Response(
        JSON.stringify({ error: "Erro ao atualizar senha." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(`[emergency-reset] senha redefinida para: ${email}`);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[emergency-reset] exceção", e);
    return new Response(
      JSON.stringify({ error: "Erro inesperado." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

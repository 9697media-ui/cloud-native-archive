import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "me",
  title: "Current user",
  description:
    "Return the signed-in user's profile: name, email, unit, permission level and role.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const [profileRes, roleRes] = await Promise.all([
      client
        .from("profiles")
        .select("name,email,unit,permission_level,is_active,delegated_units,bond_type")
        .eq("user_id", userId)
        .maybeSingle(),
      client.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    ]);

    const payload = {
      user_id: userId,
      email: ctx.getUserEmail() ?? profileRes.data?.email ?? null,
      profile: profileRes.data ?? null,
      role: roleRes.data?.role ?? null,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});

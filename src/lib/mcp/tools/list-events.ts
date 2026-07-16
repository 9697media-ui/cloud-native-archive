import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

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
  name: "list_events",
  title: "List events",
  description:
    "List events from the ANA Brasil calendar visible to the signed-in user. Respects the app's row-level security. Returns up to `limit` rows ordered by start date.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .optional()
      .describe("Max rows to return (default 25, max 100)."),
    from: z
      .string()
      .optional()
      .describe("ISO date/datetime lower bound for start_datetime (inclusive)."),
    to: z
      .string()
      .optional()
      .describe("ISO date/datetime upper bound for start_datetime (inclusive)."),
    unit: z.string().optional().describe("Filter by organizing unit."),
    status: z.string().optional().describe("Filter by event status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, from, to, unit, status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const cappedLimit = Math.min(Math.max(limit ?? 25, 1), 100);
    let query = supabaseForUser(ctx)
      .from("events")
      .select(
        "id,title,description,unit,status,start_datetime,end_datetime,location,created_at",
      )
      .is("deleted_at", null)
      .order("start_datetime", { ascending: true })
      .limit(cappedLimit);

    if (from) query = query.gte("start_datetime", from);
    if (to) query = query.lte("start_datetime", to);
    if (unit) query = query.eq("unit", unit);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { events: data ?? [], count: data?.length ?? 0 },
    };
  },
});

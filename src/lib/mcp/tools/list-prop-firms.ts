import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, requireAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_prop_firms",
  title: "List prop firms",
  description:
    "List prop trading firms tracked on PropFirm Knowledge with trust score, profit split, payout frequency and pricing.",
  inputSchema: {
    query: z.string().describe("Filter firms by name.").optional(),
    limit: z.number().int().describe("Max results, default 20, max 100.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const take = Math.min(Math.max(limit ?? 20, 1), 100);
    let q = supabaseForUser(ctx)
      .from("prop_firms")
      .select(
        "name, slug, trust_score, profit_split, payout_frequency, pricing_summary, max_funding, website_url, is_featured",
      )
      .order("trust_score", { ascending: false, nullsFirst: false })
      .limit(take);

    if (query?.trim()) q = q.ilike("name", `%${query.trim()}%`);

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { items: data ?? [] },
    };
  },
});

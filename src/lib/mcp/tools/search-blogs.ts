import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, requireAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "search_blogs",
  title: "Search articles",
  description:
    "Search PropFirm Knowledge articles by keyword. Returns title, slug, status, category and excerpt.",
  inputSchema: {
    query: z.string().describe("Keyword to match against title, slug or excerpt.").optional(),
    status: z
      .enum(["draft", "scheduled", "pending_approval", "published", "archived"])
      .describe("Filter by publication status.")
      .optional(),
    limit: z.number().int().describe("Max results, default 10, max 50.").optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, status, limit }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const take = Math.min(Math.max(limit ?? 10, 1), 50);
    let q = supabaseForUser(ctx)
      .from("blogs")
      .select("id, title, slug, excerpt, status, published_at, is_featured")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(take);

    if (status) q = q.eq("status", status);
    if (query?.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(`title.ilike.${term},slug.ilike.${term},excerpt.ilike.${term}`);
    }

    const { data, error } = await q;
    if (error) return errorResult(error.message);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { items: data ?? [] },
    };
  },
});

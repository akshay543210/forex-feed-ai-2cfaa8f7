import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, requireAuth, supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_blog",
  title: "Get article",
  description: "Fetch one PropFirm Knowledge article by slug, including its full markdown content.",
  inputSchema: { slug: z.string().describe("Article slug, e.g. how-prop-firms-really-work.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;

    const { data, error } = await supabaseForUser(ctx)
      .from("blogs")
      .select(
        "id, title, slug, excerpt, content, status, cover_image_url, seo_title, seo_description, seo_keywords, faq, published_at",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error) return errorResult(error.message);
    if (!data) return errorResult(`No article found with slug "${slug}".`);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      structuredContent: { blog: data },
    };
  },
});

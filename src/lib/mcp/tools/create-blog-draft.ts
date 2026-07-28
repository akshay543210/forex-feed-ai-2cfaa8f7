import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorResult, requireAuth, supabaseForUser } from "../supabase";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default defineTool({
  name: "create_blog_draft",
  title: "Create article draft",
  description:
    "Create a new PropFirm Knowledge article as a draft (never published directly). Content should be markdown with H2/H3 headings, short paragraphs and bullet points.",
  inputSchema: {
    title: z.string().describe("Article title."),
    content: z.string().describe("Full article body in markdown."),
    slug: z.string().describe("URL slug; generated from the title when omitted.").optional(),
    excerpt: z.string().describe("Short summary shown on cards and in search.").optional(),
    seo_title: z.string().describe("SEO title, ideally under 60 characters.").optional(),
    seo_description: z
      .string()
      .describe("SEO meta description, ideally 50-160 characters.")
      .optional(),
    seo_keywords: z.array(z.string()).describe("Target keywords.").optional(),
    category_slug: z.string().describe("Category slug, e.g. prop-firm-reviews.").optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const unauth = requireAuth(ctx);
    if (unauth) return unauth;
    const supabase = supabaseForUser(ctx);

    let categoryId: string | null = null;
    if (input.category_slug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", input.category_slug)
        .maybeSingle();
      if (!cat) return errorResult(`Unknown category slug "${input.category_slug}".`);
      categoryId = cat.id;
    }

    const words = input.content.trim().split(/\s+/).length;
    const { data, error } = await supabase
      .from("blogs")
      .insert({
        title: input.title,
        slug: input.slug?.trim() || slugify(input.title),
        content: input.content,
        excerpt: input.excerpt ?? null,
        seo_title: input.seo_title ?? null,
        seo_description: input.seo_description ?? null,
        seo_keywords: input.seo_keywords ?? null,
        category_id: categoryId,
        author_id: ctx.getUserId(),
        status: "draft",
        source: "ai_assisted",
        reading_time_minutes: Math.max(1, Math.round(words / 220)),
      })
      .select("id, slug, status")
      .single();

    if (error) return errorResult(error.message);
    return {
      content: [
        { type: "text" as const, text: `Draft created: /admin/editor (slug: ${data.slug})` },
      ],
      structuredContent: { blog: data },
    };
  },
});

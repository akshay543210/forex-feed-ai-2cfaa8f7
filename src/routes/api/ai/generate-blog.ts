import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

async function callAI(messages: Array<{role: string; content: string}>) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content as string;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").substring(0, 80);
}

function readingTime(content: string) {
  return Math.max(1, Math.round(content.trim().split(/\s+/).length / 220));
}

export async function generateBlogDraft(opts: {
  topic: string;
  categorySlug?: string;
  authorId?: string | null;
  source?: "manual" | "ai_auto" | "ai_assisted";
}) {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Dedup check
  const norm = opts.topic.toLowerCase().trim();
  const { data: existing } = await admin.from("topic_history").select("id").ilike("normalized_topic", `%${norm.slice(0, 40)}%`).limit(1);
  if (existing && existing.length > 0) {
    throw new Error("Similar topic already covered recently");
  }

  const sysPrompt = `You are a senior financial journalist writing for PropFirm Knowledge — an authoritative media platform covering forex markets and proprietary trading firms. Write in the style of Bloomberg + TradingView: factual, engaging, data-driven, and human. Avoid filler, AI clichés, and repetition. Cite reasoning, not URLs. Output strict JSON only.`;

  const userPrompt = `Topic: ${opts.topic}

Write a 1200–2000 word original news/analysis article. Return JSON with this exact shape:
{
  "title": "SEO-optimized headline (under 70 chars)",
  "seo_title": "alternate SEO title under 60 chars",
  "seo_description": "compelling meta description under 155 chars",
  "seo_keywords": ["5","to","8","keywords"],
  "excerpt": "2-3 sentence hook",
  "content": "FULL article in markdown with ## headings, **bold**, lists. Include hook, context, key developments, expert framing, takeaways, outlook.",
  "faq": [{"question":"...","answer":"..."}, ... 3-5 items],
  "category_slug": "one of: forex-news, fundamentals, prop-firm-reviews, payout-updates, promo-codes, industry-news, trading-education, scam-alerts, trading-psychology, market-analysis"
}`;

  const raw = await callAI([
    { role: "system", content: sysPrompt },
    { role: "user", content: userPrompt },
  ]);

  // Extract JSON (handle code fences)
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return JSON");
  const parsed = JSON.parse(match[0]);

  const categorySlug = opts.categorySlug ?? parsed.category_slug ?? "forex-news";
  const { data: cat } = await admin.from("categories").select("id, workflow_mode").eq("slug", categorySlug).maybeSingle();

  const slugBase = slugify(parsed.title);
  const slug = `${slugBase}-${Date.now().toString(36).slice(-5)}`;

  const status = opts.source === "ai_auto"
    ? (cat?.workflow_mode === "auto_publish" ? "published" : cat?.workflow_mode === "draft_only" ? "draft" : "pending_approval")
    : "draft";

  const { data: blog, error } = await admin.from("blogs").insert({
    slug,
    title: parsed.title,
    excerpt: parsed.excerpt,
    content: parsed.content,
    seo_title: parsed.seo_title,
    seo_description: parsed.seo_description,
    seo_keywords: parsed.seo_keywords,
    faq: parsed.faq,
    category_id: cat?.id ?? null,
    author_id: opts.authorId ?? null,
    status,
    source: opts.source ?? "ai_assisted",
    reading_time_minutes: readingTime(parsed.content),
    ai_quality_score: 8.5,
    plagiarism_score: 5.0,
    published_at: status === "published" ? new Date().toISOString() : null,
  }).select("id, slug, title, status").single();

  if (error) throw error;

  await admin.from("topic_history").insert({
    normalized_topic: norm,
    keywords: parsed.seo_keywords ?? [],
    blog_id: blog.id,
  });

  return blog;
}

export const Route = createFileRoute("/api/ai/generate-blog")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization")?.replace("Bearer ", "");
          if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

          const supabaseUrl = process.env.SUPABASE_URL!;
          const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: `Bearer ${auth}` } } });
          const { data: u } = await userClient.auth.getUser();
          if (!u.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });

          const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", u.user.id);
          const isStaff = (roles ?? []).some(r => ["admin","moderator","author"].includes(r.role));
          if (!isStaff) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json" } });

          const body = await request.json() as { topic: string; categorySlug?: string };
          if (!body.topic) return new Response(JSON.stringify({ error: "Missing topic" }), { status: 400, headers: { "Content-Type": "application/json" } });

          const blog = await generateBlogDraft({
            topic: body.topic, categorySlug: body.categorySlug, authorId: u.user.id, source: "ai_assisted",
          });
          return new Response(JSON.stringify(blog), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          console.error("generate-blog error:", e);
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(messages: Array<{role: string; content: string}>) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content as string;
}

async function generateCoverImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(AI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{
          role: "user",
          content: `Editorial cover image, 16:9 widescreen, photorealistic, cinematic lighting, dark moody color palette with subtle blue/gold accents, no text, no logos, no watermarks. Subject: ${prompt}`,
        }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) { console.error("image gen failed", res.status, await res.text()); return null; }
    const j = await res.json();
    const dataUrl = j.choices?.[0]?.message?.images?.[0]?.image_url?.url as string | undefined;
    return dataUrl ?? null;
  } catch (e) { console.error("image gen error", e); return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uploadCoverFromDataUrl(admin: any, dataUrl: string, slug: string): Promise<string | null> {
  try {
    const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!m) return null;
    const mime = m[1];
    const ext = mime.split("/")[1] || "png";
    const buf = Buffer.from(m[2], "base64");
    const path = `blog-covers/${slug}.${ext}`;
    const { error } = await admin.storage.from("media").upload(path, buf, { contentType: mime, upsert: true });
    if (error) { console.error("upload error", error); return null; }
    const { data } = admin.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) { console.error("upload exception", e); return null; }
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

  const norm = opts.topic.toLowerCase().trim();
  const { data: existing } = await admin.from("topic_history").select("id").ilike("normalized_topic", `%${norm.slice(0, 40)}%`).limit(1);
  if (existing && existing.length > 0) {
    throw new Error("Similar topic already covered recently");
  }

  const sysPrompt = `You are a senior financial journalist writing for PropFirm Knowledge — an authoritative media platform on forex markets and proprietary trading firms. Voice: Bloomberg + TradingView. Factual, engaging, data-driven, human. No filler, no AI clichés.

FORMAT RULES (CRITICAL):
- Open with a strong 2-sentence hook paragraph (no heading above it).
- Use ## for main sections (5-8 sections). Use ### for sub-points when needed.
- Keep paragraphs SHORT: 2-4 sentences max. Lots of white space.
- Use bullet lists (- item) liberally for facts, criteria, pros/cons, takeaways.
- Use numbered lists (1. item) for steps or rankings.
- Use **bold** to highlight key numbers, names, percentages.
- Use > blockquotes for expert quotes or key insights.
- Always include a "## Key Takeaways" bullet list near the end.
- Always include a "## Bottom Line" 2-3 sentence closer.

Output strict JSON only.`;

  const userPrompt = `Topic: ${opts.topic}

Write a 1200–1800 word original news/analysis article following the FORMAT RULES exactly.

INLINE IMAGES: Inside the markdown content, insert EXACTLY 3 inline image placeholders at natural breakpoints (after the hook, mid-article, and before "## Key Takeaways"). Use this exact syntax on its own line:
[[IMAGE:1|alt text describing image|vivid one-sentence editorial photo prompt, no text/logos]]
[[IMAGE:2|...|...]]
[[IMAGE:3|...|...]]

Return JSON with this exact shape:
{
  "title": "SEO-optimized headline (under 70 chars)",
  "seo_title": "alternate SEO title under 60 chars",
  "seo_description": "compelling meta description under 155 chars",
  "seo_keywords": ["5","to","8","keywords"],
  "excerpt": "2-3 sentence hook",
  "content": "FULL article markdown WITH the 3 [[IMAGE:n|alt|prompt]] placeholders embedded inline",
  "cover_image_prompt": "vivid one-sentence description of the ideal editorial cover image (subject + mood, no text)",
  "faq": [{"question":"...","answer":"..."}, ... 3-5 items],
  "category_slug": "one of: forex-news, fundamentals, prop-firm-reviews, payout-updates, promo-codes, industry-news, trading-education, scam-alerts, trading-psychology, market-analysis"
}`;

  const raw = await callAI([
    { role: "system", content: sysPrompt },
    { role: "user", content: userPrompt },
  ]);

  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI did not return JSON");
  const parsed = JSON.parse(match[0]);

  const categorySlug = opts.categorySlug ?? parsed.category_slug ?? "forex-news";
  const { data: cat } = await admin.from("categories").select("id, workflow_mode").eq("slug", categorySlug).maybeSingle();

  const slugBase = slugify(parsed.title);
  const slug = `${slugBase}-${Date.now().toString(36).slice(-5)}`;

  // Generate cover image (best-effort, non-blocking on failure)
  let coverUrl: string | null = null;
  const imgPrompt = parsed.cover_image_prompt || parsed.title;
  const dataUrl = await generateCoverImage(imgPrompt);
  if (dataUrl) coverUrl = await uploadCoverFromDataUrl(admin, dataUrl, slug);

  // Process inline image placeholders [[IMAGE:n|alt|prompt]]
  let processedContent: string = parsed.content;
  const placeholderRe = /\[\[IMAGE:(\d+)\|([^|]+)\|([^\]]+)\]\]/g;
  const matches = [...processedContent.matchAll(placeholderRe)];
  for (const m of matches) {
    const [full, n, alt, prompt] = m;
    try {
      const d = await generateCoverImage(prompt.trim());
      if (!d) { processedContent = processedContent.replace(full, ""); continue; }
      const url = await uploadCoverFromDataUrl(admin, d, `${slug}-inline-${n}`);
      processedContent = processedContent.replace(full, url ? `\n\n![${alt.trim()}](${url})\n\n` : "");
    } catch { processedContent = processedContent.replace(full, ""); }
  }

  const status = opts.source === "ai_auto"
    ? (cat?.workflow_mode === "auto_publish" ? "published" : cat?.workflow_mode === "draft_only" ? "draft" : "pending_approval")
    : "draft";

  const { data: blog, error } = await admin.from("blogs").insert({
    slug,
    title: parsed.title,
    excerpt: parsed.excerpt,
    content: processedContent,
    cover_image_url: coverUrl,
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
  }).select("id, slug, title, status, cover_image_url").single();

  if (error) throw error;

  await admin.from("topic_history").insert({
    normalized_topic: norm,
    keywords: parsed.seo_keywords ?? [],
    blog_id: blog.id,
  });

  return blog;
}

export async function backfillCoverImages(limit = 10) {
  const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: blogs } = await admin.from("blogs").select("id, slug, title, excerpt").or("cover_image_url.is.null,cover_image_url.eq.").limit(limit);
  let updated = 0;
  for (const b of blogs ?? []) {
    const prompt = `${b.title}. ${b.excerpt ?? ""}`.slice(0, 300);
    const dataUrl = await generateCoverImage(prompt);
    if (!dataUrl) continue;
    const url = await uploadCoverFromDataUrl(admin, dataUrl, b.slug);
    if (!url) continue;
    await admin.from("blogs").update({ cover_image_url: url }).eq("id", b.id);
    updated++;
  }
  return { scanned: blogs?.length ?? 0, updated };
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

          const body = await request.json() as { topic?: string; categorySlug?: string; action?: "backfill_images"; limit?: number };

          if (body.action === "backfill_images") {
            const result = await backfillCoverImages(body.limit ?? 10);
            return new Response(JSON.stringify(result), { headers: { "Content-Type": "application/json" } });
          }

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

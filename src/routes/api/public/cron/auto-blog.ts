import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";
import { generateBlogDraft } from "../../ai/generate-blog";

async function fetchRssTopics(feedUrl: string): Promise<Array<{ title: string; link: string }>> {
  try {
    const res = await fetch(feedUrl, { headers: { "User-Agent": "PropFirmKnowledgeBot/1.0" } });
    if (!res.ok) return [];
    const text = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const xml = parser.parse(text);
    const items = xml?.rss?.channel?.item ?? xml?.feed?.entry ?? [];
    const arr = Array.isArray(items) ? items : [items];
    return arr.slice(0, 5).map((it: { title?: string | { "#text"?: string }; link?: string | { "@_href"?: string } }) => ({
      title: typeof it.title === "string" ? it.title : (it.title?.["#text"] ?? ""),
      link: typeof it.link === "string" ? it.link : (it.link?.["@_href"] ?? ""),
    })).filter((x: { title: string }) => x.title);
  } catch { return []; }
}

export const Route = createFileRoute("/api/public/cron/auto-blog")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
          const { data: sources } = await admin.from("rss_sources").select("*").eq("is_active", true).limit(4);

          const topics: Array<{ title: string; categorySlug?: string }> = [];
          for (const s of sources ?? []) {
            const items = await fetchRssTopics(s.feed_url);
            for (const it of items.slice(0, 1)) {
              topics.push({ title: it.title, categorySlug: s.category_slug ?? undefined });
            }
          }

          if (topics.length === 0) {
            topics.push({ title: "Weekly forex market outlook and prop firm industry roundup", categorySlug: "market-analysis" });
          }

          let created = 0;
          for (const t of topics.slice(0, 2)) {
            try {
              await generateBlogDraft({ topic: t.title, categorySlug: t.categorySlug, source: "ai_auto" });
              created++;
            } catch (e) {
              console.error("auto-blog skip:", (e as Error).message);
            }
          }

          await admin.from("rss_sources").update({ last_fetched_at: new Date().toISOString() }).in("id", (sources ?? []).map(s => s.id));
          return new Response(JSON.stringify({ ok: true, created }), { headers: { "Content-Type": "application/json" } });
        } catch (e) {
          console.error("cron error:", e);
          return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://propfirmknowledge.in";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const [{ data: blogs }, { data: cats }, { data: firms }] = await Promise.all([
          admin.from("blogs").select("slug, updated_at").eq("status", "published").limit(5000),
          admin.from("categories").select("slug"),
          admin.from("prop_firms").select("slug, updated_at"),
        ]);
        const urls = [
          { loc: BASE_URL + "/", priority: 1.0 },
          { loc: BASE_URL + "/about", priority: 0.6 },
          { loc: BASE_URL + "/contact", priority: 0.6 },
          { loc: BASE_URL + "/privacy", priority: 0.3 },
          { loc: BASE_URL + "/terms", priority: 0.3 },
          { loc: BASE_URL + "/disclaimer", priority: 0.3 },
          { loc: BASE_URL + "/search", priority: 0.4 },
          { loc: BASE_URL + "/prop-firms", priority: 0.9 },
          { loc: BASE_URL + "/payouts", priority: 0.9 },
          { loc: BASE_URL + "/promo-codes", priority: 0.8 },
          ...(cats ?? []).map(c => ({ loc: `${BASE_URL}/category/${c.slug}`, priority: 0.8 })),
          ...(firms ?? []).map(f => ({ loc: `${BASE_URL}/prop-firms/${f.slug}`, lastmod: f.updated_at, priority: 0.7 })),
          ...(blogs ?? []).map(b => ({ loc: `${BASE_URL}/blog/${b.slug}`, lastmod: b.updated_at, priority: 0.6 })),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => { const lm = (u as { lastmod?: string }).lastmod; return `  <url><loc>${u.loc}</loc>${lm ? `<lastmod>${lm}</lastmod>` : ""}<priority>${u.priority}</priority></url>`; }).join("\n")}
</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=600, s-maxage=3600" } });
      },
    },
  },
});

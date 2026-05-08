import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const [{ data: blogs }, { data: cats }, { data: firms }] = await Promise.all([
          admin.from("blogs").select("slug, updated_at").eq("status", "published").limit(5000),
          admin.from("categories").select("slug"),
          admin.from("prop_firms").select("slug, updated_at"),
        ]);
        const urls = [
          { loc: origin + "/", priority: 1.0 },
          { loc: origin + "/prop-firms", priority: 0.9 },
          { loc: origin + "/payouts", priority: 0.9 },
          { loc: origin + "/promo-codes", priority: 0.8 },
          ...(cats ?? []).map(c => ({ loc: `${origin}/category/${c.slug}`, priority: 0.8 })),
          ...(firms ?? []).map(f => ({ loc: `${origin}/prop-firms/${f.slug}`, lastmod: f.updated_at, priority: 0.7 })),
          ...(blogs ?? []).map(b => ({ loc: `${origin}/blog/${b.slug}`, lastmod: b.updated_at, priority: 0.6 })),
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

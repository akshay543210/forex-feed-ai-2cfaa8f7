import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BlogCard, type BlogCardData } from "@/components/site/BlogCard";
import { TopPropFirms } from "@/components/site/TopPropFirms";
import { LatestPayouts } from "@/components/site/LatestPayouts";
import { EconomicCalendar } from "@/components/site/EconomicCalendar";
import { NewsletterCTA } from "@/components/site/NewsletterCTA";
import { JsonLd } from "@/components/site/JsonLd";
import { buildHead, organizationJsonLd } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => buildHead({
    title: "Forex News, Prop Firm Reviews & Payouts",
    description: "AI-curated forex news, in-depth prop firm reviews, verified payouts, promo codes and trading education — your all-in-one media platform.",
    type: "website",
    path: "/",
  }),
  component: HomePage,
});

type Category = { id: string; slug: string; name: string; color: string | null };

function HomePage() {
  const [featured, setFeatured] = useState<BlogCardData[]>([]);
  const [latest, setLatest] = useState<BlogCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const sel = "slug,title,excerpt,cover_image_url,reading_time_minutes,published_at,author:profiles!blogs_author_id_fkey(display_name),category:categories(name,slug,color)";
    supabase.from("blogs").select(sel).eq("status", "published").eq("is_featured", true)
      .order("published_at", { ascending: false }).limit(3)
      .then(({ data }) => setFeatured((data as unknown as BlogCardData[]) ?? []));
    supabase.from("blogs").select(sel).eq("status", "published")
      .order("published_at", { ascending: false }).limit(9)
      .then(({ data }) => setLatest((data as unknown as BlogCardData[]) ?? []));
    supabase.from("categories").select("id,slug,name,color").order("sort_order")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  const hero = featured[0] ?? latest[0];
  const sideFeat = (featured.length > 1 ? featured.slice(1, 3) : latest.slice(1, 3));

  return (
    <SiteLayout>
      <JsonLd data={organizationJsonLd()} />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-12">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">AI-curated · Updated 24/7</span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight max-w-4xl">
          The <span className="text-gradient">all-in-one</span> media platform for forex & prop firms.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Breaking news, fundamental analysis, in-depth prop firm reviews, verified payouts and exclusive promo codes — in one trusted place.
        </p>

        <div className="mt-10 grid lg:grid-cols-3 gap-6">
          {hero && (
            <div className="lg:col-span-2">
              <BlogCard blog={hero} size="lg" />
            </div>
          )}
          <div className="grid gap-6">
            {sideFeat.map(b => <BlogCard key={b.slug} blog={b} />)}
          </div>
        </div>
      </section>

      {/* Categories strip */}
      <section className="mx-auto max-w-7xl px-4 pb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <Link key={c.slug} to="/category/$slug" params={{ slug: c.slug }}
              className="rounded-full glass px-3 py-1.5 text-xs hover:border-primary/40 hover:text-primary transition-colors">
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Main grid: latest + sidebar widgets */}
      <section className="mx-auto max-w-7xl px-4 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl font-bold">Latest stories</h2>
            <Link to="/category/$slug" params={{ slug: "forex-news" }} className="text-sm text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
              All news <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {latest.map(b => <BlogCard key={b.slug} blog={b} />)}
            {latest.length === 0 && (
              <div className="col-span-full rounded-xl glass p-12 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p>Articles will appear here once auto-generation runs.</p>
                <p className="text-xs mt-1">Sign in as admin to trigger your first AI batch.</p>
              </div>
            )}
          </div>
        </div>
        <aside className="space-y-6">
          <TopPropFirms />
          <EconomicCalendar />
          <LatestPayouts />
          <NewsletterCTA />
        </aside>
      </section>
    </SiteLayout>
  );
}

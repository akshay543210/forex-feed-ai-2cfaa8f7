import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BlogCard, type BlogCardData } from "@/components/site/BlogCard";
import { buildHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/search")({
  head: () => buildHead({ title: "Search — PropFirm Knowledge", description: "Search forex news, prop firm reviews, payouts and education." }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<BlogCardData[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    const { data } = await supabase.from("blogs")
      .select("slug,title,excerpt,cover_image_url,reading_time_minutes,published_at,author:profiles!blogs_author_id_fkey(display_name),category:categories(name,slug,color)")
      .eq("status", "published")
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%`)
      .limit(30);
    setResults((data as unknown as BlogCardData[]) ?? []);
    setLoading(false);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-4xl font-bold mb-6">Search</h1>
        <form onSubmit={run} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search articles..."
              className="w-full pl-9 pr-3 py-2.5 rounded-md bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button className="rounded-md bg-gradient-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Search</button>
        </form>
        <div className="mt-8 grid sm:grid-cols-2 gap-5">
          {results.map(r => <BlogCard key={r.slug} blog={r} />)}
          {!loading && q && results.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">No results.</p>}
        </div>
      </div>
    </SiteLayout>
  );
}

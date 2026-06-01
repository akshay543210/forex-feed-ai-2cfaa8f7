import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BlogCard, type BlogCardData } from "@/components/site/BlogCard";
import { JsonLd } from "@/components/site/JsonLd";
import { buildHead, breadcrumbJsonLd } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("categories").select("*").eq("slug", params.slug).maybeSingle();
    if (!data) throw notFound();
    return { category: data };
  },
  head: ({ loaderData, params }) => buildHead({
    title: loaderData?.category ? `${loaderData.category.name} — Latest Articles` : "Category",
    description: loaderData?.category?.description ?? `Latest articles, news and analysis in the ${loaderData?.category?.name ?? "selected"} category on PropFirm Knowledge.`,
    path: `/category/${params.slug}`,
  }),
  notFoundComponent: () => (
    <SiteLayout><div className="mx-auto max-w-3xl p-12 text-center"><h1 className="text-3xl font-bold">Category not found</h1></div></SiteLayout>
  ),
  errorComponent: ({ error }) => <SiteLayout><div className="p-12 text-center text-destructive">{error.message}</div></SiteLayout>,
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const [posts, setPosts] = useState<BlogCardData[]>([]);
  useEffect(() => {
    const sel = "slug,title,excerpt,cover_image_url,reading_time_minutes,published_at,author:profiles!blogs_author_id_fkey(display_name),category:categories(name,slug,color)";
    supabase.from("blogs").select(sel).eq("status", "published").eq("category_id", category.id)
      .order("published_at", { ascending: false }).limit(30)
      .then(({ data }) => setPosts((data as unknown as BlogCardData[]) ?? []));
  }, [category.id]);

  return (
    <SiteLayout>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" }, { name: category.name, url: `/category/${category.slug}` },
      ])} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <p className="text-xs text-muted-foreground mb-2"><Link to="/">Home</Link> / {category.name}</p>
        <h1 className="font-display text-4xl font-bold" style={{ color: category.color ?? undefined }}>{category.name}</h1>
        {category.description && <p className="mt-2 text-muted-foreground max-w-2xl">{category.description}</p>}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map(p => <BlogCard key={p.slug} blog={p} />)}
          {posts.length === 0 && <p className="col-span-full text-center text-muted-foreground py-16">No articles yet in this category.</p>}
        </div>
      </div>
    </SiteLayout>
  );
}

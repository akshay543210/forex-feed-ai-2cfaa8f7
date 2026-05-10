import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clock, User, Calendar } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BlogCard, type BlogCardData } from "@/components/site/BlogCard";
import { JsonLd } from "@/components/site/JsonLd";
import { buildHead, articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("blogs")
      .select("*, author:profiles!blogs_author_id_fkey(display_name,avatar_url,bio,expertise), category:categories(name,slug,color)")
      .eq("slug", params.slug).eq("status", "published").maybeSingle();
    if (!data) throw notFound();
    return { blog: data };
  },
  head: ({ loaderData }) => {
    const b = loaderData?.blog;
    if (!b) return buildHead({ title: "Article", description: "" });
    return buildHead({
      title: b.seo_title ?? b.title,
      description: b.seo_description ?? b.excerpt ?? "",
      image: b.cover_image_url ?? undefined,
      type: "article",
      keywords: b.seo_keywords ?? undefined,
      publishedTime: b.published_at ?? undefined,
      modifiedTime: b.last_updated_at ?? b.updated_at ?? undefined,
      author: b.author?.display_name ?? "Editorial Team",
    });
  },
  notFoundComponent: () => <SiteLayout><div className="mx-auto max-w-3xl p-12 text-center"><h1 className="text-3xl font-bold">Article not found</h1><Link to="/" className="text-primary">Back home</Link></div></SiteLayout>,
  errorComponent: ({ error }) => <SiteLayout><div className="p-12 text-center text-destructive">{error.message}</div></SiteLayout>,
  component: BlogPage,
});

function BlogPage() {
  const { blog } = Route.useLoaderData();
  const [related, setRelated] = useState<BlogCardData[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!blog.category_id) return;
    const sel = "slug,title,excerpt,cover_image_url,reading_time_minutes,published_at,author:profiles!blogs_author_id_fkey(display_name),category:categories(name,slug,color)";
    supabase.from("blogs").select(sel).eq("status", "published").eq("category_id", blog.category_id).neq("id", blog.id)
      .order("published_at", { ascending: false }).limit(3)
      .then(({ data }) => setRelated((data as unknown as BlogCardData[]) ?? []));
  }, [blog.id, blog.category_id]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const faqArr = Array.isArray(blog.faq) ? blog.faq as Array<{ question: string; answer: string }> : [];

  return (
    <SiteLayout>
      <div className="fixed top-0 left-0 right-0 h-1 z-[60] bg-transparent">
        <div className="h-full bg-gradient-primary transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <JsonLd data={articleJsonLd({
        title: blog.title, description: blog.excerpt ?? "", image: blog.cover_image_url ?? undefined,
        url, publishedTime: blog.published_at ?? new Date().toISOString(),
        modifiedTime: blog.last_updated_at ?? blog.updated_at ?? undefined,
        author: blog.author?.display_name ?? "Editorial Team",
      })} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" },
        ...(blog.category ? [{ name: blog.category.name, url: `/category/${blog.category.slug}` }] : []),
        { name: blog.title, url },
      ])} />
      {faqArr.length > 0 && <JsonLd data={faqJsonLd(faqArr)} />}

      <article className="mx-auto max-w-3xl px-4 py-10">
        {blog.category && (
          <Link to="/category/$slug" params={{ slug: blog.category.slug }}
            className="inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium mb-4"
            style={{ color: blog.category.color ?? undefined }}>
            {blog.category.name}
          </Link>
        )}
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">{blog.title}</h1>
        {blog.excerpt && <p className="mt-4 text-lg text-muted-foreground">{blog.excerpt}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y border-border py-4">
          <span className="inline-flex items-center gap-1.5"><User className="h-4 w-4" />{blog.author?.display_name ?? "Editorial Team"}</span>
          {blog.published_at && <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatRelative(blog.published_at)}</span>}
          {blog.reading_time_minutes && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{blog.reading_time_minutes} min read</span>}
          {blog.last_updated_at && blog.last_updated_at !== blog.published_at &&
            <span className="text-xs">Updated {formatRelative(blog.last_updated_at)}</span>}
        </div>

        {blog.cover_image_url && (
          <img src={blog.cover_image_url} alt={blog.title} className="mt-6 w-full rounded-xl shadow-card" />
        )}

        <div className="prose prose-invert prose-lg max-w-none mt-8 prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-foreground/90 prose-li:my-1 prose-li:marker:text-primary prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-img:rounded-xl prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-code:before:content-none prose-code:after:content-none prose-hr:border-border"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(blog.content) }} />

        {faqArr.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-bold mb-4">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqArr.map((q, i) => (
                <details key={i} className="rounded-lg glass p-4 group">
                  <summary className="font-medium cursor-pointer">{q.question}</summary>
                  <p className="mt-2 text-sm text-muted-foreground">{q.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {Array.isArray(blog.sources) && (blog.sources as Array<{title: string; url: string}>).length > 0 && (
          <section className="mt-10 rounded-lg border border-border p-4 text-sm">
            <h3 className="font-medium mb-2">Sources</h3>
            <ul className="space-y-1 text-muted-foreground">
              {(blog.sources as Array<{title: string; url: string}>).map((s, i) => (
                <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">{s.title || s.url}</a></li>
              ))}
            </ul>
          </section>
        )}

        {blog.author && (
          <section className="mt-10 rounded-xl glass p-5 flex items-start gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-primary/30 flex items-center justify-center font-bold text-lg">
              {blog.author.avatar_url ? <img src={blog.author.avatar_url} alt="" className="h-full w-full rounded-full object-cover" /> : (blog.author.display_name?.[0] ?? "P")}
            </div>
            <div>
              <p className="font-medium">{blog.author.display_name}</p>
              {blog.author.expertise && <p className="text-xs text-primary">{blog.author.expertise}</p>}
              {blog.author.bio && <p className="mt-1 text-sm text-muted-foreground">{blog.author.bio}</p>}
            </div>
          </section>
        )}
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 border-t border-border">
          <h2 className="font-display text-2xl font-bold mb-6">Related reads</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map(r => <BlogCard key={r.slug} blog={r} />)}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}

// Markdown→HTML for trusted AI-generated content with rich typography
function renderMarkdown(md: string): string {
  if (!md) return "";
  if (md.trim().startsWith("<")) return md;

  // Escape HTML first
  let src = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Restore intentional markdown blockquote markers we just escaped
  src = src.replace(/^&gt; /gm, "> ");

  const lines = src.split("\n");
  const out: string[] = [];
  let i = 0;
  const flushList = (buf: string[], ordered: boolean) => {
    if (!buf.length) return;
    const tag = ordered ? "ol" : "ul";
    out.push(`<${tag}>${buf.map(x => `<li>${inline(x)}</li>`).join("")}</${tag}>`);
    buf.length = 0;
  };
  const inline = (s: string) => s
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  const ulBuf: string[] = [];
  const olBuf: string[] = [];
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^#{1,6}\s/.test(trimmed)) {
      flushList(ulBuf, false); flushList(olBuf, true);
      const level = trimmed.match(/^#+/)![0].length;
      const text = trimmed.replace(/^#+\s/, "");
      out.push(`<h${level}>${inline(text)}</h${level}>`);
      i++; continue;
    }
    if (/^>\s?/.test(trimmed)) {
      flushList(ulBuf, false); flushList(olBuf, true);
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${inline(quoteLines.join(" "))}</blockquote>`);
      continue;
    }
    if (/^[-*]\s/.test(trimmed)) {
      flushList(olBuf, true);
      ulBuf.push(trimmed.replace(/^[-*]\s/, ""));
      i++; continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      flushList(ulBuf, false);
      olBuf.push(trimmed.replace(/^\d+\.\s/, ""));
      i++; continue;
    }
    if (trimmed === "") {
      flushList(ulBuf, false); flushList(olBuf, true);
      i++; continue;
    }
    if (/^(---|\*\*\*|___)$/.test(trimmed)) {
      flushList(ulBuf, false); flushList(olBuf, true);
      out.push("<hr/>");
      i++; continue;
    }
    // Paragraph: gather consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6}\s|>|[-*]\s|\d+\.\s|---|\*\*\*|___)/.test(lines[i].trim())) {
      paraLines.push(lines[i].trim());
      i++;
    }
    out.push(`<p>${inline(paraLines.join(" "))}</p>`);
  }
  flushList(ulBuf, false); flushList(olBuf, true);
  return out.join("\n");
}

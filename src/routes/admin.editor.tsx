import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, Eye, Upload, Image as ImageIcon, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { slugify, readingTime } from "@/lib/format";
import { RichEditor } from "@/components/editor/RichEditor";

type Category = { id: string; name: string; slug: string };
type FAQItem = { question: string; answer: string };

export const Route = createFileRoute("/admin/editor")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  component: EditorPage,
});

function EditorPage() {
  const nav = useNavigate();
  const { id } = Route.useSearch();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");

  const [categories, setCategories] = useState<Category[]>([]);
  const [userId, setUserId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [faq, setFaq] = useState<FAQItem[]>([]);
  const [status, setStatus] = useState<"draft" | "published" | "pending_approval">("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);
  const [uploading, setUploading] = useState(false);

  const rt = useMemo(() => readingTime(content || ""), [content]);
  const slugAuto = useMemo(() => slugify(title), [title]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { nav({ to: "/auth" }); return; }
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const isStaff = (r ?? []).some(x => ["admin", "moderator", "author"].includes(x.role));
      if (!isStaff) { nav({ to: "/account" }); return; }
      setUserId(data.user.id);
      setAuthed(true);

      const { data: cats } = await supabase.from("categories").select("id,name,slug").order("sort_order");
      setCategories(cats ?? []);

      if (id) {
        const { data: blog } = await supabase.from("blogs").select("*").eq("id", id).maybeSingle();
        if (blog) {
          setTitle(blog.title); setSlug(blog.slug); setExcerpt(blog.excerpt ?? "");
          setContent(blog.content); setCoverUrl(blog.cover_image_url ?? "");
          setCategoryId(blog.category_id ?? "");
          setSeoTitle(blog.seo_title ?? ""); setSeoDescription(blog.seo_description ?? "");
          setSeoKeywords((blog.seo_keywords ?? []).join(", "));
          setFaq(Array.isArray(blog.faq) ? (blog.faq as FAQItem[]) : []);
          setStatus(blog.status as typeof status);
          setIsFeatured(!!blog.is_featured); setIsBreaking(!!blog.is_breaking);
        }
      }
      setLoading(false);
    })();
  }, [id, nav]);

  useEffect(() => { if (!id && !slug) setSlug(slugAuto); }, [slugAuto, id, slug]);

  const uploadCover = async (file: File) => {
    setUploading(true); setMsg("");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/${Date.now()}-${slugify(title || "image")}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setCoverUrl(data.publicUrl);
      setMsg("Cover uploaded");
    } catch (e) { setMsg((e as Error).message); }
    finally { setUploading(false); }
  };

  const generateAICover = async () => {
    if (!title.trim()) { setMsg("Add a title first"); return; }
    setUploading(true); setMsg("Generating AI cover image...");
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch("/api/ai/generate-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` },
        body: JSON.stringify({ prompt: `${title}. ${excerpt}`.slice(0, 300), slug: slug || slugAuto }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setCoverUrl(j.url);
      setMsg("AI cover generated");
    } catch (e) { setMsg((e as Error).message); }
    finally { setUploading(false); }
  };

  const save = async (publish = false) => {
    if (!title.trim() || !content.trim()) { setMsg("Title and content required"); return; }
    setSaving(true); setMsg("");
    try {
      const finalStatus = publish ? "published" : status;
      const finalSlug = slug || slugAuto;
      const payload = {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt || null,
        content,
        cover_image_url: coverUrl || null,
        category_id: categoryId || null,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        seo_keywords: seoKeywords ? seoKeywords.split(",").map(s => s.trim()).filter(Boolean) : null,
        faq: faq.filter(f => f.question && f.answer),
        status: finalStatus,
        is_featured: isFeatured,
        is_breaking: isBreaking,
        reading_time_minutes: rt,
        published_at: finalStatus === "published" ? new Date().toISOString() : null,
        last_updated_at: new Date().toISOString(),
        source: "manual" as const,
      };

      if (id) {
        const { error } = await supabase.from("blogs").update(payload).eq("id", id);
        if (error) throw error;
        setMsg(publish ? "Published!" : "Saved");
      } else {
        const { data, error } = await supabase.from("blogs").insert({ ...payload, author_id: userId }).select("id").single();
        if (error) throw error;
        setMsg(publish ? "Published!" : "Draft saved");
        nav({ to: "/admin/editor", search: { id: data.id } });
      }
    } catch (e) { setMsg((e as Error).message); }
    finally { setSaving(false); }
  };

  if (loading) return <SiteLayout hideTicker><div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div></SiteLayout>;
  if (!authed) return null;

  return (
    <SiteLayout hideTicker>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <Link to="/admin" className="text-xs text-primary">← Admin</Link>
            <h1 className="font-display text-3xl font-bold mt-1">{id ? "Edit Article" : "New Article"}</h1>
            <p className="text-xs text-muted-foreground mt-1">{rt} min read · {content.trim().split(/\s+/).filter(Boolean).length} words</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save(false)} disabled={saving} className="rounded-md border border-border px-3 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save draft
            </button>
            <button onClick={() => save(true)} disabled={saving} className="rounded-md bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
              Publish
            </button>
          </div>
        </div>
        {msg && <p className="mb-4 text-sm text-primary">{msg}</p>}

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-4">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title…"
              className="w-full bg-transparent border-0 border-b border-border px-0 py-2 font-display text-3xl font-bold focus:outline-none focus:border-primary" />

            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short excerpt (1-2 sentences shown on cards)…"
              rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />

            <div className="flex items-center gap-2 border-b border-border">
              <button onClick={() => setTab("write")} className={`px-3 py-2 text-sm border-b-2 ${tab==="write"?"border-primary text-primary":"border-transparent text-muted-foreground"}`}>Write</button>
              <button onClick={() => setTab("preview")} className={`px-3 py-2 text-sm border-b-2 inline-flex items-center gap-1 ${tab==="preview"?"border-primary text-primary":"border-transparent text-muted-foreground"}`}><Eye className="h-3.5 w-3.5" /> Preview</button>
              <span className="ml-auto text-xs text-muted-foreground pr-1">Markdown · ## heading · **bold** · - bullet · &gt; quote</span>
            </div>

            {tab === "write" ? (
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder={`# Hook paragraph here\n\n## Section heading\nShort paragraph in 2-4 sentences.\n\n- bullet point\n- another bullet\n\n**Bold for key numbers.**\n\n> Expert quote or callout.\n\n## Key Takeaways\n- Takeaway 1\n- Takeaway 2\n\n## Bottom Line\nClosing 2-3 sentences.`}
                rows={28} className="w-full bg-background border border-border rounded-md px-4 py-3 font-mono text-sm leading-relaxed" />
            ) : (
              <div className="prose prose-invert prose-lg max-w-none rounded-md border border-border bg-background/50 p-6 min-h-[600px]">
                <div dangerouslySetInnerHTML={{ __html: previewMd(content) }} />
              </div>
            )}

            <FAQEditor items={faq} onChange={setFaq} />
          </div>

          <aside className="space-y-4">
            <Card title="Status">
              <select value={status} onChange={e => setStatus(e.target.value as typeof status)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending review</option>
                <option value="published">Published</option>
              </select>
              <label className="flex items-center gap-2 text-sm mt-3"><input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} /> Featured</label>
              <label className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={isBreaking} onChange={e => setIsBreaking(e.target.checked)} /> Breaking news</label>
            </Card>

            <Card title="Category">
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                <option value="">— Select —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Card>

            <Card title="Slug">
              <input value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder={slugAuto}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono" />
              <p className="text-xs text-muted-foreground mt-1">/blog/{slug || slugAuto}</p>
            </Card>

            <Card title="Cover Image">
              {coverUrl && <img src={coverUrl} alt="cover" className="w-full rounded-md mb-2" />}
              <div className="flex flex-col gap-2">
                <label className="rounded-md border border-border px-3 py-2 text-sm text-center cursor-pointer hover:bg-muted inline-flex items-center justify-center gap-2">
                  <Upload className="h-4 w-4" /> Upload image
                  <input type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && uploadCover(e.target.files[0])} />
                </label>
                <button onClick={generateAICover} disabled={uploading} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted inline-flex items-center justify-center gap-2 disabled:opacity-50">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate with AI
                </button>
                <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="or paste image URL"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs" />
              </div>
            </Card>

            <Card title="SEO">
              <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="SEO title (≤60 chars)"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm mb-2" />
              <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="Meta description (≤155 chars)"
                rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm mb-2" />
              <input value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="keyword1, keyword2"
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
            </Card>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl glass p-4">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5"><ImageIcon className="h-3 w-3 hidden" />{title}</h3>
      {children}
    </div>
  );
}

function FAQEditor({ items, onChange }: { items: FAQItem[]; onChange: (i: FAQItem[]) => void }) {
  const update = (i: number, key: keyof FAQItem, val: string) => {
    const next = [...items]; next[i] = { ...next[i], [key]: val }; onChange(next);
  };
  return (
    <div className="rounded-xl glass p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold">FAQ (optional, boosts SEO)</h3>
        <button onClick={() => onChange([...items, { question: "", answer: "" }])} className="text-xs rounded-md border border-border px-2 py-1">+ Add</button>
      </div>
      {items.map((it, i) => (
        <div key={i} className="mb-3 space-y-2">
          <input value={it.question} onChange={e => update(i, "question", e.target.value)} placeholder="Question" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <textarea value={it.answer} onChange={e => update(i, "answer", e.target.value)} placeholder="Answer" rows={2} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm" />
          <button onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="text-xs text-destructive">Remove</button>
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-muted-foreground">No FAQ items yet.</p>}
    </div>
  );
}

// Lightweight preview renderer (matches blog page formatting closely)
function previewMd(md: string): string {
  if (!md) return "<p class='text-muted-foreground'>Nothing to preview yet…</p>";
  let src = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/^&gt; /gm, "> ");
  const lines = src.split("\n");
  const out: string[] = [];
  let i = 0;
  const inline = (s: string) => s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const ulBuf: string[] = []; const olBuf: string[] = [];
  const flush = () => {
    if (ulBuf.length) { out.push(`<ul>${ulBuf.map(x => `<li>${inline(x)}</li>`).join("")}</ul>`); ulBuf.length = 0; }
    if (olBuf.length) { out.push(`<ol>${olBuf.map(x => `<li>${inline(x)}</li>`).join("")}</ol>`); olBuf.length = 0; }
  };
  while (i < lines.length) {
    const t = lines[i].trim();
    if (/^#{1,6}\s/.test(t)) { flush(); const lvl = t.match(/^#+/)![0].length; out.push(`<h${lvl}>${inline(t.replace(/^#+\s/, ""))}</h${lvl}>`); i++; continue; }
    if (/^>\s?/.test(t)) { flush(); const q: string[] = []; while (i < lines.length && /^>\s?/.test(lines[i].trim())) { q.push(lines[i].trim().replace(/^>\s?/, "")); i++; } out.push(`<blockquote>${inline(q.join(" "))}</blockquote>`); continue; }
    if (/^[-*]\s/.test(t)) { ulBuf.push(t.replace(/^[-*]\s/, "")); i++; continue; }
    if (/^\d+\.\s/.test(t)) { olBuf.push(t.replace(/^\d+\.\s/, "")); i++; continue; }
    if (t === "") { flush(); i++; continue; }
    flush();
    const p: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,6}\s|>|[-*]\s|\d+\.\s)/.test(lines[i].trim())) { p.push(lines[i].trim()); i++; }
    out.push(`<p>${inline(p.join(" "))}</p>`);
  }
  flush();
  return out.join("\n");
}

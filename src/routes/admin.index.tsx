import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, FileText, ListChecks, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminPage,
});

function AdminPage() {
  const nav = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState("");
  const [stats, setStats] = useState({ blogs: 0, drafts: 0, pending: 0, queue: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { nav({ to: "/auth" }); return; }
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const isStaff = (r ?? []).some(x => ["admin","moderator","author"].includes(x.role));
      if (!isStaff) { nav({ to: "/account" }); return; }
      setAuthed(true); setLoading(false);

      const [b, d, p, q] = await Promise.all([
        supabase.from("blogs").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("blogs").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("blogs").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
        supabase.from("ai_topic_queue").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setStats({ blogs: b.count ?? 0, drafts: d.count ?? 0, pending: p.count ?? 0, queue: q.count ?? 0 });
    })();
  }, [nav]);

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true); setMsg("");
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch("/api/ai/generate-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` },
        body: JSON.stringify({ topic }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Generation failed");
      setMsg(`Draft created: ${j.title}`);
      setTopic("");
    } catch (e) {
      setMsg((e as Error).message);
    } finally { setGenerating(false); }
  };

  const runCron = async () => {
    setMsg("Running auto-batch...");
    const res = await fetch("/api/public/cron/auto-blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const j = await res.json();
    setMsg(res.ok ? `Auto batch: ${j.created ?? 0} drafts created` : (j.error || "Failed"));
  };

  const backfillImages = async () => {
    setMsg("Generating cover images for existing blogs...");
    const { data: session } = await supabase.auth.getSession();
    const res = await fetch("/api/ai/generate-blog", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token ?? ""}` },
      body: JSON.stringify({ action: "backfill_images", limit: 10 }),
    });
    const j = await res.json();
    setMsg(res.ok ? `Backfilled ${j.updated}/${j.scanned} blogs with cover images` : (j.error || "Failed"));
  };

  if (loading) return <SiteLayout hideTicker><div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div></SiteLayout>;
  if (!authed) return null;

  return (
    <SiteLayout hideTicker>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <div className="mt-6 grid sm:grid-cols-4 gap-3">
          {[
            ["Published", stats.blogs, FileText],
            ["Drafts", stats.drafts, FileText],
            ["Pending review", stats.pending, ListChecks],
            ["AI queue", stats.queue, Sparkles],
          ].map(([k, v, Icon]) => {
            const I = Icon as typeof FileText;
            return (
              <div key={k as string} className="rounded-xl glass p-4">
                <I className="h-4 w-4 text-primary" />
                <p className="text-2xl font-display font-bold mt-2">{v as number}</p>
                <p className="text-xs text-muted-foreground">{k as string}</p>
              </div>
            );
          })}
        </div>

        <section className="mt-8 rounded-xl glass p-6">
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> AI Article Generator</h2>
          <p className="text-sm text-muted-foreground mt-1">Enter a topic or keyword and AI will research and write a draft.</p>
          <div className="mt-4 flex gap-2">
            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. FTMO new payout policy 2026"
              className="flex-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
            <button onClick={generate} disabled={generating}
              className="rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 inline-flex items-center gap-2">
              {generating && <Loader2 className="h-4 w-4 animate-spin" />} Generate draft
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/admin/editor" className="rounded-md bg-gradient-primary text-primary-foreground px-3 py-1.5 text-xs font-medium">✍️ Write new article</Link>
            <button onClick={runCron} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">Run auto-batch now</button>
            <button onClick={backfillImages} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">Backfill cover images</button>
            <Link to="/admin/blogs" className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">Manage blogs</Link>
            <Link to="/admin/manage" className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted">Manage everything</Link>
          </div>
          {msg && <p className="mt-3 text-sm text-primary">{msg}</p>}
        </section>
      </div>
    </SiteLayout>
  );
}

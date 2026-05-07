import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/admin/blogs")({ component: AdminBlogs });

type Row = { id: string; slug: string; title: string; status: string; source: string; created_at: string; ai_quality_score: number | null };

function AdminBlogs() {
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { nav({ to: "/auth" }); return; }
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      if (!(r ?? []).some(x => ["admin","moderator","author"].includes(x.role))) { nav({ to: "/account" }); return; }
      load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const load = async () => {
    const base = supabase.from("blogs").select("id,slug,title,status,source,created_at,ai_quality_score").order("created_at", { ascending: false }).limit(100);
    const { data } = filter === "all" ? await base : await base.eq("status", filter as "draft"|"pending_approval"|"published"|"rejected"|"scheduled");
    setRows((data as Row[]) ?? []);
  };

  const setStatus = async (id: string, status: "published"|"rejected"|"draft") => {
    const patch = status === "published"
      ? { status, published_at: new Date().toISOString() }
      : { status };
    await supabase.from("blogs").update(patch).eq("id", id);
    load();
  };

  return (
    <SiteLayout hideTicker>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-3xl font-bold">Blogs</h1>
          <Link to="/admin" className="text-xs text-primary">← Back</Link>
        </div>
        <div className="mt-4 flex gap-2">
          {["all","draft","pending_approval","published","rejected"].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs ${filter===s?"bg-primary text-primary-foreground":"glass"}`}>
              {s.replace("_"," ")}
            </button>
          ))}
        </div>
        <div className="mt-6 rounded-xl glass divide-y divide-border">
          {rows.map(r => (
            <div key={r.id} className="p-4 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground">/{r.slug} · {r.source} · {formatRelative(r.created_at)} {r.ai_quality_score ? `· quality ${r.ai_quality_score}` : ""}</p>
              </div>
              <span className="text-xs rounded-full bg-muted px-2 py-0.5">{r.status}</span>
              {r.status !== "published" && <button onClick={() => setStatus(r.id, "published")} className="text-xs rounded-md bg-gradient-primary px-2 py-1 text-primary-foreground">Publish</button>}
              {r.status !== "rejected" && <button onClick={() => setStatus(r.id, "rejected")} className="text-xs rounded-md border border-border px-2 py-1">Reject</button>}
              <Link to="/blog/$slug" params={{ slug: r.slug }} className="text-xs text-primary">View</Link>
            </div>
          ))}
          {rows.length === 0 && <p className="p-8 text-center text-muted-foreground text-sm">No blogs.</p>}
        </div>
      </div>
    </SiteLayout>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Trash2, Plus, Check, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin/manage")({ component: AdminManage });

function AdminManage() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { nav({ to: "/auth" }); return; }
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      if (!(r ?? []).some(x => x.role === "admin")) { nav({ to: "/account" }); return; }
      setReady(true);
    })();
  }, [nav]);

  if (!ready) return <SiteLayout hideTicker><div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div></SiteLayout>;

  return (
    <SiteLayout hideTicker>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-3xl font-bold">Manage everything</h1>
          <Link to="/admin" className="text-xs text-primary">← Dashboard</Link>
        </div>
        <Tabs defaultValue="firms" className="mt-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="firms">Prop Firms</TabsTrigger>
            <TabsTrigger value="promos">Promo Codes</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="sources">RSS Sources</TabsTrigger>
            <TabsTrigger value="subs">Subscribers</TabsTrigger>
            <TabsTrigger value="users">Users & Roles</TabsTrigger>
          </TabsList>
          <TabsContent value="firms"><PropFirmsAdmin /></TabsContent>
          <TabsContent value="promos"><PromosAdmin /></TabsContent>
          <TabsContent value="payouts"><PayoutsAdmin /></TabsContent>
          <TabsContent value="sources"><RssAdmin /></TabsContent>
          <TabsContent value="subs"><SubsAdmin /></TabsContent>
          <TabsContent value="users"><UsersAdmin /></TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function PropFirmsAdmin() {
  const [rows, setRows] = useState<{ id: string; name: string; slug: string; trust_score: number | null; is_featured: boolean }[]>([]);
  const [name, setName] = useState("");
  const load = async () => {
    const { data } = await supabase.from("prop_firms").select("id,name,slug,trust_score,is_featured").order("popularity_score", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!name.trim()) return;
    await supabase.from("prop_firms").insert({ name, slug: slugify(name) });
    setName(""); load();
  };
  const del = async (id: string) => { await supabase.from("prop_firms").delete().eq("id", id); load(); };
  const toggleFeat = async (id: string, v: boolean) => { await supabase.from("prop_firms").update({ is_featured: !v }).eq("id", id); load(); };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="New prop firm name" className="flex-1 rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <button onClick={add} className="rounded-md bg-gradient-primary px-3 text-sm text-primary-foreground inline-flex items-center gap-1"><Plus className="h-4 w-4" /> Add</button>
      </div>
      <div className="rounded-xl glass divide-y divide-border">
        {rows.map(r => (
          <div key={r.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">/{r.slug} · trust {r.trust_score ?? 0}</p>
            </div>
            <button onClick={() => toggleFeat(r.id, r.is_featured)} className="text-xs rounded border border-border px-2 py-1">{r.is_featured ? "Featured" : "Feature"}</button>
            <Link to="/prop-firms/$slug" params={{ slug: r.slug }} className="text-xs text-primary">View</Link>
            <button onClick={() => del(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No firms yet.</p>}
      </div>
    </div>
  );
}

function PromosAdmin() {
  const [rows, setRows] = useState<{ id: string; code: string; discount_text: string | null; is_active: boolean; firm_id: string | null }[]>([]);
  const [firms, setFirms] = useState<{ id: string; name: string }[]>([]);
  const [code, setCode] = useState(""); const [discount, setDiscount] = useState(""); const [firmId, setFirmId] = useState("");
  const load = async () => {
    const [{ data: p }, { data: f }] = await Promise.all([
      supabase.from("promo_codes").select("id,code,discount_text,is_active,firm_id").order("created_at", { ascending: false }),
      supabase.from("prop_firms").select("id,name").order("name"),
    ]);
    setRows(p ?? []); setFirms(f ?? []);
  };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!code.trim()) return;
    await supabase.from("promo_codes").insert({ code, discount_text: discount || null, firm_id: firmId || null });
    setCode(""); setDiscount(""); setFirmId(""); load();
  };
  return (
    <div className="mt-4 space-y-3">
      <div className="grid sm:grid-cols-4 gap-2">
        <input value={code} onChange={e => setCode(e.target.value)} placeholder="CODE" className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input value={discount} onChange={e => setDiscount(e.target.value)} placeholder="20% OFF" className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <select value={firmId} onChange={e => setFirmId(e.target.value)} className="rounded-md bg-background border border-border px-3 py-2 text-sm">
          <option value="">— Firm —</option>
          {firms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <button onClick={add} className="rounded-md bg-gradient-primary px-3 text-sm text-primary-foreground">Add code</button>
      </div>
      <div className="rounded-xl glass divide-y divide-border">
        {rows.map(r => (
          <div key={r.id} className="p-3 flex items-center gap-3">
            <span className="font-mono font-bold">{r.code}</span>
            <span className="text-xs text-muted-foreground flex-1">{r.discount_text}</span>
            <button onClick={async () => { await supabase.from("promo_codes").update({ is_active: !r.is_active }).eq("id", r.id); load(); }} className="text-xs rounded border border-border px-2 py-1">{r.is_active ? "Active" : "Inactive"}</button>
            <button onClick={async () => { await supabase.from("promo_codes").delete().eq("id", r.id); load(); }} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No codes.</p>}
      </div>
    </div>
  );
}

function PayoutsAdmin() {
  const [rows, setRows] = useState<{ id: string; amount_usd: number; status: string; proof_url: string | null; user_id: string }[]>([]);
  const load = async () => {
    const { data } = await supabase.from("payout_submissions").select("id,amount_usd,status,proof_url,user_id").order("created_at", { ascending: false }).limit(50);
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);
  const setStatus = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("payout_submissions").update({ status }).eq("id", id); load();
  };
  return (
    <div className="mt-4 rounded-xl glass divide-y divide-border">
      {rows.map(r => (
        <div key={r.id} className="p-3 flex items-center gap-3">
          <span className="font-bold">${r.amount_usd}</span>
          <span className="text-xs rounded-full bg-muted px-2 py-0.5">{r.status}</span>
          {r.proof_url && <a href={r.proof_url} target="_blank" rel="noreferrer" className="text-xs text-primary truncate flex-1">proof</a>}
          <button onClick={() => setStatus(r.id, "approved")} className="text-xs rounded bg-gradient-primary px-2 py-1 text-primary-foreground inline-flex items-center gap-1"><Check className="h-3 w-3" />Approve</button>
          <button onClick={() => setStatus(r.id, "rejected")} className="text-xs rounded border border-border px-2 py-1 inline-flex items-center gap-1"><X className="h-3 w-3" />Reject</button>
        </div>
      ))}
      {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No submissions.</p>}
    </div>
  );
}

function RssAdmin() {
  const [rows, setRows] = useState<{ id: string; name: string; feed_url: string; is_active: boolean; category_slug: string | null }[]>([]);
  const [name, setName] = useState(""); const [url, setUrl] = useState(""); const [cat, setCat] = useState("");
  const load = async () => { const { data } = await supabase.from("rss_sources").select("*").order("name"); setRows((data as typeof rows) ?? []); };
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!url.trim()) return;
    await supabase.from("rss_sources").insert({ name: name || url, feed_url: url, category_slug: cat || null });
    setName(""); setUrl(""); setCat(""); load();
  };
  return (
    <div className="mt-4 space-y-3">
      <div className="grid sm:grid-cols-4 gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Source name" className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://feed.url/rss" className="rounded-md bg-background border border-border px-3 py-2 text-sm sm:col-span-2" />
        <input value={cat} onChange={e => setCat(e.target.value)} placeholder="category-slug" className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
      </div>
      <button onClick={add} className="rounded-md bg-gradient-primary px-3 py-2 text-sm text-primary-foreground">Add RSS source</button>
      <div className="rounded-xl glass divide-y divide-border">
        {rows.map(r => (
          <div key={r.id} className="p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground truncate">{r.feed_url} · {r.category_slug}</p>
            </div>
            <button onClick={async () => { await supabase.from("rss_sources").update({ is_active: !r.is_active }).eq("id", r.id); load(); }} className="text-xs rounded border border-border px-2 py-1">{r.is_active ? "On" : "Off"}</button>
            <button onClick={async () => { await supabase.from("rss_sources").delete().eq("id", r.id); load(); }} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No sources.</p>}
      </div>
    </div>
  );
}

function SubsAdmin() {
  const [rows, setRows] = useState<{ id: string; email: string; status: string; created_at: string }[]>([]);
  useEffect(() => { supabase.from("subscribers").select("id,email,status,created_at").order("created_at", { ascending: false }).limit(200).then(({ data }) => setRows((data as typeof rows) ?? [])); }, []);
  return (
    <div className="mt-4 rounded-xl glass divide-y divide-border max-h-[60vh] overflow-auto">
      {rows.map(r => (
        <div key={r.id} className="p-3 flex items-center gap-3 text-sm">
          <span className="flex-1 truncate">{r.email}</span>
          <span className="text-xs rounded-full bg-muted px-2 py-0.5">{r.status}</span>
        </div>
      ))}
      {rows.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">No subscribers yet.</p>}
    </div>
  );
}

function UsersAdmin() {
  const [rows, setRows] = useState<{ user_id: string; role: string; display_name: string | null }[]>([]);
  const [msg] = useState("");
  const load = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role").order("created_at", { ascending: false }).limit(200);
    const ids = [...new Set((roles ?? []).map(r => r.user_id))];
    const { data: profs } = ids.length ? await supabase.from("profiles").select("id, display_name").in("id", ids) : { data: [] };
    const map = new Map((profs ?? []).map(p => [p.id, p.display_name]));
    setRows((roles ?? []).map(r => ({ ...r, display_name: map.get(r.user_id) ?? null })));
  };
  useEffect(() => { load(); }, []);
  const removeRole = async (user_id: string, role: string) => {
    await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role as "admin"); load();
  };
  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs text-muted-foreground">To promote a user, ask them to sign up first, then run a backend role assignment. Below are current role assignments.</p>
      <div className="rounded-xl glass divide-y divide-border max-h-[60vh] overflow-auto">
        {rows.map(r => (
          <div key={r.user_id + r.role} className="p-3 flex items-center gap-3 text-sm">
            <span className="flex-1 truncate">{r.display_name ?? r.user_id.slice(0, 8)}</span>
            <span className="text-xs rounded-full bg-primary/15 text-primary px-2 py-0.5 capitalize">{r.role}</span>
            <button onClick={() => removeRole(r.user_id, r.role)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      {msg && <p className="text-xs">{msg}</p>}
      
    </div>
  );
}

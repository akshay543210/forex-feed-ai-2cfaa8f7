import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Plus } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import { formatRelative, formatUSD } from "@/lib/format";

export const Route = createFileRoute("/payouts")({
  head: () => buildHead({
    title: "Verified Prop Firm Payouts — Approved & Rejected Reports",
    description: "Community-submitted, verified payout proofs from prop trading firms. See who is paying — and who is rejecting traders.",
  }),
  component: PayoutsPage,
});

type Payout = {
  id: string; amount_usd: number; status: string; created_at: string; notes: string | null;
  prop_firms: { name: string; slug: string } | null;
};

function PayoutsPage() {
  const [items, setItems] = useState<Payout[]>([]);
  const [filter, setFilter] = useState<"all"|"approved"|"rejected">("all");
  const [user, setUser] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user?.id ?? null));
  }, []);
  useEffect(() => {
    let q = supabase.from("payout_submissions")
      .select("id,amount_usd,status,created_at,notes,prop_firms(name,slug)")
      .order("created_at", { ascending: false }).limit(50);
    if (filter !== "all") q = q.eq("status", filter);
    else q = q.in("status", ["approved","rejected"]);
    q.then(({ data }) => setItems((data as unknown as Payout[]) ?? []));
  }, [filter]);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-4xl font-bold">Payout Proofs</h1>
            <p className="mt-2 text-muted-foreground">Verified payouts and rejections — community-reported.</p>
          </div>
          {user && (
            <button onClick={() => setShowForm(s => !s)} className="inline-flex items-center gap-1 rounded-md bg-gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> Submit payout
            </button>
          )}
        </div>

        {showForm && user && <SubmitPayoutForm userId={user} onDone={() => { setShowForm(false); setFilter(f => f); }} />}

        <div className="mt-6 flex gap-2">
          {(["all","approved","rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs ${filter===f ? "bg-primary text-primary-foreground" : "glass"}`}>
              {f[0].toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {items.map(p => (
            <div key={p.id} className="rounded-lg glass p-4 flex items-start gap-4">
              {p.status === "approved"
                ? <CheckCircle2 className="h-6 w-6 text-success shrink-0 mt-0.5" />
                : <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="font-display text-xl font-bold">{formatUSD(p.amount_usd)}</p>
                <p className="text-sm text-muted-foreground">{p.prop_firms?.name ?? "Unknown firm"} · {formatRelative(p.created_at)}</p>
                {p.notes && <p className="mt-1 text-sm">{p.notes}</p>}
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-muted-foreground text-sm py-8 text-center">No payouts yet for this filter.</p>}
        </div>
      </div>
    </SiteLayout>
  );
}

function SubmitPayoutForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [firms, setFirms] = useState<Array<{id: string; name: string}>>([]);
  const [firmId, setFirmId] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => { supabase.from("prop_firms").select("id,name").order("name").then(({ data }) => setFirms(data ?? [])); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("payout_submissions").insert({
      user_id: userId, firm_id: firmId || null, amount_usd: Number(amount), notes, proof_url: proof || null, status: "pending",
    });
    setLoading(false);
    if (!error) { setAmount(""); setNotes(""); setProof(""); onDone(); }
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl glass p-5 grid sm:grid-cols-2 gap-3">
      <select value={firmId} onChange={e => setFirmId(e.target.value)} required className="rounded-md bg-background border border-border px-3 py-2 text-sm">
        <option value="">Select firm</option>
        {firms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Amount USD" className="rounded-md bg-background border border-border px-3 py-2 text-sm" />
      <input type="url" value={proof} onChange={e => setProof(e.target.value)} placeholder="Proof URL (screenshot link)" className="sm:col-span-2 rounded-md bg-background border border-border px-3 py-2 text-sm" />
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" className="sm:col-span-2 rounded-md bg-background border border-border px-3 py-2 text-sm h-20" />
      <button disabled={loading} className="sm:col-span-2 rounded-md bg-gradient-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">Submit for review</button>
    </form>
  );
}

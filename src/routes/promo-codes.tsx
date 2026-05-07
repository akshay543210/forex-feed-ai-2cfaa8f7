import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/promo-codes")({
  head: () => buildHead({
    title: "Active Prop Firm Promo Codes & Discount Coupons",
    description: "All currently active discount codes for top proprietary trading firms — verified and updated daily.",
  }),
  component: PromosPage,
});

type Promo = { id: string; code: string; description: string|null; discount_text: string|null; expires_at: string|null; firm: { name: string; slug: string } | null };

function PromosPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [copied, setCopied] = useState<string|null>(null);
  useEffect(() => {
    supabase.from("promo_codes")
      .select("id,code,description,discount_text,expires_at,firm:prop_firms(name,slug)")
      .eq("is_active", true).order("created_at", { ascending: false })
      .then(({ data }) => setPromos((data as unknown as Promo[]) ?? []));
  }, []);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl font-bold">Prop Firm Promo Codes</h1>
        <p className="mt-2 text-muted-foreground">Verified discount codes — click to copy.</p>
        {promos.length === 0 ? (
          <p className="mt-12 text-muted-foreground text-center">No active codes right now. Check back soon.</p>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            {promos.map(p => (
              <button key={p.id} onClick={() => { navigator.clipboard.writeText(p.code); setCopied(p.id); setTimeout(()=>setCopied(null), 2000); }}
                className="text-left rounded-xl glass p-5 hover:border-primary/40 transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{p.firm?.name ?? "—"}</p>
                    <p className="font-mono text-xl font-bold text-primary">{p.code}</p>
                  </div>
                  {copied === p.id ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
                </div>
                {p.discount_text && <p className="mt-2 text-sm font-medium">{p.discount_text}</p>}
                {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
              </button>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

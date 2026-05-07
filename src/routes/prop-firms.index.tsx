import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { JsonLd } from "@/components/site/JsonLd";
import { buildHead, breadcrumbJsonLd } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/prop-firms/")({
  head: () => buildHead({
    title: "Prop Firm Directory — Reviews, Trust Scores & Payouts",
    description: "Compare top proprietary trading firms — funding levels, profit splits, payout speeds, trust scores and verified trader reviews.",
  }),
  component: FirmsList,
});

type Firm = {
  slug: string; name: string; logo_url: string | null; description: string | null;
  profit_split: string | null; max_funding: string | null; payout_frequency: string | null;
  trust_score: number | null; popularity_score: number | null;
};

function FirmsList() {
  const [firms, setFirms] = useState<Firm[]>([]);
  useEffect(() => {
    supabase.from("prop_firms").select("*").order("popularity_score", { ascending: false })
      .then(({ data }) => setFirms((data as Firm[]) ?? []));
  }, []);

  return (
    <SiteLayout>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", url: "/" }, { name: "Prop Firms", url: "/prop-firms" }])} />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-4xl font-bold">Prop Firm Directory</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">Compare top firms by trust score, funding, payouts and trader feedback.</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {firms.map(f => (
            <Link key={f.slug} to="/prop-firms/$slug" params={{ slug: f.slug }}
              className="rounded-xl glass shadow-card p-5 hover:border-primary/40 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-lg bg-gradient-primary/30 flex items-center justify-center font-bold text-lg">
                  {f.logo_url ? <img src={f.logo_url} alt={f.name} className="h-full w-full object-contain rounded-lg" /> : f.name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold">{f.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <Star className="h-3 w-3 fill-warning" /> {f.trust_score ?? "—"}/10
                  </div>
                </div>
              </div>
              {f.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{f.description}</p>}
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-muted-foreground">Profit split</dt><dd className="font-medium">{f.profit_split ?? "—"}</dd></div>
                <div><dt className="text-muted-foreground">Max funding</dt><dd className="font-medium">{f.max_funding ?? "—"}</dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">Payouts</dt><dd className="font-medium">{f.payout_frequency ?? "—"}</dd></div>
              </dl>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}

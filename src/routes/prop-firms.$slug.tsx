import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, ExternalLink, Check, X } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { JsonLd } from "@/components/site/JsonLd";
import { buildHead, breadcrumbJsonLd } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/prop-firms/$slug")({
  loader: async ({ params }) => {
    const { data } = await supabase.from("prop_firms").select("*").eq("slug", params.slug).maybeSingle();
    if (!data) throw notFound();
    return { firm: data };
  },
  head: ({ loaderData }) => buildHead({
    title: loaderData?.firm ? `${loaderData.firm.name} Review — Rules, Payouts & Trust Score` : "Prop Firm",
    description: loaderData?.firm?.description ?? "Prop firm review.",
    image: loaderData?.firm?.logo_url ?? undefined,
  }),
  notFoundComponent: () => <SiteLayout><div className="p-12 text-center"><h1 className="text-3xl font-bold">Firm not found</h1></div></SiteLayout>,
  errorComponent: ({ error }) => <SiteLayout><div className="p-12 text-center text-destructive">{error.message}</div></SiteLayout>,
  component: FirmPage,
});

type Promo = { id: string; code: string; description: string | null; discount_text: string | null; expires_at: string | null };
type Review = { id: string; rating: number; title: string | null; body: string; created_at: string };

function FirmPage() {
  const { firm } = Route.useLoaderData();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    supabase.from("promo_codes").select("*").eq("firm_id", firm.id).eq("is_active", true)
      .then(({ data }) => setPromos((data as Promo[]) ?? []));
    supabase.from("propfirm_reviews").select("id,rating,title,body,created_at")
      .eq("firm_id", firm.id).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => setReviews((data as Review[]) ?? []));
  }, [firm.id]);

  return (
    <SiteLayout>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Home", url: "/" }, { name: "Prop Firms", url: "/prop-firms" }, { name: firm.name, url: `/prop-firms/${firm.slug}` },
      ])} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs text-muted-foreground mb-3">
          <Link to="/">Home</Link> / <Link to="/prop-firms">Prop Firms</Link> / {firm.name}
        </p>
        <header className="flex items-start gap-5">
          <div className="h-20 w-20 rounded-xl bg-gradient-primary/30 flex items-center justify-center font-bold text-3xl shrink-0">
            {firm.logo_url ? <img src={firm.logo_url} alt={firm.name} className="h-full w-full object-contain rounded-xl" /> : firm.name[0]}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-4xl font-bold">{firm.name}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1 text-warning"><Star className="h-4 w-4 fill-warning" /> {firm.trust_score ?? "—"}/10 trust</span>
              {firm.website_url && <a href={firm.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">Visit site <ExternalLink className="h-3 w-3" /></a>}
            </div>
            {firm.description && <p className="mt-3 text-muted-foreground">{firm.description}</p>}
          </div>
        </header>

        <section className="mt-8 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            ["Profit split", firm.profit_split],
            ["Max funding", firm.max_funding],
            ["Min account", firm.min_account_size],
            ["Pricing", firm.pricing_summary],
            ["Payout frequency", firm.payout_frequency],
            ["Scaling", firm.scaling_plan],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-lg glass p-3">
              <p className="text-xs text-muted-foreground">{k}</p>
              <p className="font-medium">{(v as string) ?? "—"}</p>
            </div>
          ))}
        </section>

        {(firm.pros?.length || firm.cons?.length) && (
          <section className="mt-8 grid md:grid-cols-2 gap-4">
            {firm.pros?.length > 0 && (
              <div className="rounded-xl glass p-5">
                <h3 className="font-display font-bold mb-3 text-success">Pros</h3>
                <ul className="space-y-2 text-sm">
                  {firm.pros.map((p: string, i: number) => <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-success shrink-0 mt-0.5" />{p}</li>)}
                </ul>
              </div>
            )}
            {firm.cons?.length > 0 && (
              <div className="rounded-xl glass p-5">
                <h3 className="font-display font-bold mb-3 text-destructive">Cons</h3>
                <ul className="space-y-2 text-sm">
                  {firm.cons.map((p: string, i: number) => <li key={i} className="flex gap-2"><X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />{p}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        {promos.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-2xl font-bold mb-3">Active promo codes</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {promos.map(p => (
                <div key={p.id} className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono font-bold text-primary">{p.code}</p>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  </div>
                  {p.discount_text && <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">{p.discount_text}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl font-bold mb-3">Trader reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="rounded-lg glass p-4">
                  <div className="flex items-center gap-2 text-warning text-sm mb-1">
                    {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-warning" />)}
                  </div>
                  {r.title && <p className="font-medium">{r.title}</p>}
                  <p className="text-sm text-muted-foreground mt-1">{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

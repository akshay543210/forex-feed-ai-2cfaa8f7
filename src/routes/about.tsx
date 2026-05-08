import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () => buildHead({
    title: "About — PropFirm Knowledge",
    description: "PropFirm Knowledge is an independent media platform covering forex markets, prop firm reviews, verified payouts and trading education.",
    type: "website",
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 prose prose-invert">
        <h1 className="font-display text-4xl font-bold mb-6">About PropFirm Knowledge</h1>
        <p className="text-lg text-muted-foreground">
          PropFirm Knowledge is the all-in-one media platform for the forex and prop trading industry —
          combining AI-curated news, in-depth firm reviews, verified payouts, promo codes and education.
        </p>
        <h2 className="font-display text-2xl font-bold mt-10 mb-3">Our Mission</h2>
        <p className="text-muted-foreground">
          To bring transparency, speed and trust to a fragmented industry — by aggregating credible
          sources, surfacing community-verified payouts, and educating the next generation of traders.
        </p>
        <h2 className="font-display text-2xl font-bold mt-10 mb-3">Editorial Standards</h2>
        <p className="text-muted-foreground">
          Every published article — human-written or AI-assisted — is cross-checked against multiple
          reputable sources, scored for originality and clarity, and reviewed for factual coherence
          before going live.
        </p>
      </article>
    </SiteLayout>
  );
}

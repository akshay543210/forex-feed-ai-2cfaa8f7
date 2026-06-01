import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/disclaimer")({
  head: () => buildHead({ title: "Disclaimer", description: "Risk and editorial disclaimer for PropFirm Knowledge — trading involves risk and content is for informational purposes only.", type: "website", path: "/disclaimer" }),
  component: () => (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 prose prose-invert">
        <h1 className="font-display text-4xl font-bold mb-6">Disclaimer</h1>
        <p>All content on PropFirm Knowledge is for educational and informational purposes only. Nothing on this site should be construed as financial, investment, or trading advice.</p>
        <p>Forex and CFD trading carries a high level of risk, including the risk of losing more than your initial investment. Always do your own research and consult a licensed professional before trading.</p>
        <p>Prop firm reviews reflect editorial opinion and community sentiment at time of writing. Firm rules and payouts can change — always verify directly with the firm.</p>
      </article>
    </SiteLayout>
  ),
});

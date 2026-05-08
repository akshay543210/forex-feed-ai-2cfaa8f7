import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => buildHead({ title: "Terms of Service — PropFirm Knowledge", description: "Terms of service governing the use of PropFirm Knowledge.", type: "website" }),
  component: () => (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 prose prose-invert">
        <h1 className="font-display text-4xl font-bold mb-6">Terms of Service</h1>
        <p>By accessing PropFirm Knowledge, you agree to use the platform for lawful purposes. Content is provided for educational and informational use only and does not constitute financial advice.</p>
        <h2 className="font-display text-2xl font-bold mt-8 mb-3">User Content</h2>
        <p>By submitting reviews, payouts or comments, you grant us a non-exclusive license to display and moderate your content. We reserve the right to remove content that violates our community standards.</p>
        <h2 className="font-display text-2xl font-bold mt-8 mb-3">Liability</h2>
        <p>Trading carries risk of capital loss. We are not liable for any decisions or losses based on information published on this platform.</p>
      </article>
    </SiteLayout>
  ),
});

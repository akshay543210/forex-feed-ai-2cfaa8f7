import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => buildHead({ title: "Privacy Policy — PropFirm Knowledge", description: "How PropFirm Knowledge collects, uses and protects your personal data.", type: "website" }),
  component: () => (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 prose prose-invert">
        <h1 className="font-display text-4xl font-bold mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().getFullYear()}</p>
        <p>We collect minimal personal data — your email when you subscribe, your account info if you sign up, and anonymized analytics. We never sell your data to third parties.</p>
        <h2 className="font-display text-2xl font-bold mt-8 mb-3">Cookies & Analytics</h2>
        <p>We use privacy-respecting analytics and Google AdSense. You may opt out of personalized ads via your browser or Google's Ads Settings.</p>
        <h2 className="font-display text-2xl font-bold mt-8 mb-3">Your Rights</h2>
        <p>You may request deletion of your account or unsubscribe from emails at any time by contacting privacy@propfirmknowledge.com.</p>
      </article>
    </SiteLayout>
  ),
});

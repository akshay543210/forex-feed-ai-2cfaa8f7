import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => buildHead({
    title: "Contact — PropFirm Knowledge",
    description: "Get in touch with the PropFirm Knowledge editorial team for tips, partnerships, or scam reports.",
    type: "website",
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-bold mb-6">Contact Us</h1>
        <p className="text-muted-foreground mb-8">
          Have a tip, scam report, partnership inquiry, or correction? We'd love to hear from you.
        </p>
        <div className="rounded-xl glass p-6 space-y-3">
          <p><span className="font-medium">Editorial:</span> <a className="text-primary hover:underline" href="mailto:editorial@propfirmknowledge.com">editorial@propfirmknowledge.com</a></p>
          <p><span className="font-medium">Partnerships:</span> <a className="text-primary hover:underline" href="mailto:partners@propfirmknowledge.com">partners@propfirmknowledge.com</a></p>
          <p><span className="font-medium">Scam reports:</span> <a className="text-primary hover:underline" href="mailto:tips@propfirmknowledge.com">tips@propfirmknowledge.com</a></p>
        </div>
      </article>
    </SiteLayout>
  );
}

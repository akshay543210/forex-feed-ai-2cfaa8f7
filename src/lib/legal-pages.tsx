import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";

const PAGES = {
  about: {
    title: "About PropFirm Knowledge",
    desc: "Independent media coverage of the forex and prop trading industry.",
    body: `PropFirm Knowledge is an independent editorial team covering the forex and proprietary trading industry. We combine experienced human editorial oversight with AI-assisted research to deliver fast, accurate, and well-sourced coverage of market news, prop firm reviews, payouts, and education.

Our mission is to bring transparency to an industry that has historically lacked it — through verified payout reports, scam alerts, in-depth firm reviews, and rigorous fundamental analysis.`,
  },
  contact: {
    title: "Contact",
    desc: "Get in touch with the PropFirm Knowledge editorial team.",
    body: `Editorial inquiries: editorial@propfirmknowledge.com\nTips and scam reports: tips@propfirmknowledge.com\nAdvertising: ads@propfirmknowledge.com\n\nWe respond to most inquiries within 48 hours.`,
  },
  privacy: {
    title: "Privacy Policy",
    desc: "How we collect and use your data.",
    body: `We collect only the data necessary to operate the platform: email for newsletter, account credentials, and aggregated analytics. We do not sell personal data. Cookies are used for authentication and Adsense personalization. You can request deletion of your data at any time.`,
  },
  terms: {
    title: "Terms of Service",
    desc: "Terms governing use of PropFirm Knowledge.",
    body: `By using PropFirm Knowledge you agree that all content is for educational and informational purposes only. We do not provide financial, investment, or trading advice. Trading involves substantial risk of loss. Reviews and ratings reflect editorial opinion based on publicly available information and community reports.`,
  },
  disclaimer: {
    title: "Disclaimer",
    desc: "Important risk and editorial disclosures.",
    body: `PropFirm Knowledge publishes news, reviews, and analysis for informational purposes only. Nothing on this site constitutes financial, investment, legal, or tax advice. Trading and proprietary firm participation involve substantial risk. Past performance does not guarantee future results. Some links may be affiliate links — these never influence editorial coverage.`,
  },
} as const;

function makePage(key: keyof typeof PAGES) {
  return createFileRoute(`/${key}`)({
    head: () => buildHead({ title: PAGES[key].title, description: PAGES[key].desc }),
    component: () => (
      <SiteLayout>
        <article className="mx-auto max-w-3xl px-4 py-12">
          <h1 className="font-display text-4xl font-bold">{PAGES[key].title}</h1>
          <div className="prose prose-invert mt-6 whitespace-pre-line text-muted-foreground">{PAGES[key].body}</div>
        </article>
      </SiteLayout>
    ),
  });
}

export const aboutRoute = makePage("about");
export const contactRoute = makePage("contact");
export const privacyRoute = makePage("privacy");
export const termsRoute = makePage("terms");
export const disclaimerRoute = makePage("disclaimer");

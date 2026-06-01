type Meta = {
  title: string;
  description: string;
  image?: string;
  /** Relative path like "/about" — used for canonical and og:url. */
  path?: string;
  /** Legacy absolute canonical (rarely used; prefer `path`). */
  canonical?: string;
  type?: "website" | "article";
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
};

const SITE = "PropFirm Knowledge";
const MAX_TITLE = 60;

function clampTitle(raw: string): string {
  const withSite = raw.includes(SITE) ? raw : `${raw} | ${SITE}`;
  if (withSite.length <= MAX_TITLE) return withSite;
  // If the bare title already fits, drop the site suffix.
  if (raw.length <= MAX_TITLE) return raw;
  // Otherwise truncate gracefully on word boundary.
  const cut = raw.slice(0, MAX_TITLE - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

function clampDescription(raw: string): string {
  const d = raw.trim();
  if (d.length >= 50 && d.length <= 160) return d;
  if (d.length > 160) return d.slice(0, 158).trimEnd() + "…";
  // Too short — pad with site tagline so it lands in the 50–160 window.
  const pad = " — PropFirm Knowledge: forex news, prop firm reviews, payouts and promo codes.";
  return (d + pad).slice(0, 160);
}

export function buildHead(m: Meta) {
  const title = clampTitle(m.title);
  const description = clampDescription(m.description);
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: m.type ?? "website" },
    { property: "og:site_name", content: SITE },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (m.path) meta.push({ property: "og:url", content: m.path });
  if (m.keywords?.length) meta.push({ name: "keywords", content: m.keywords.join(", ") });
  if (m.image) {
    meta.push({ property: "og:image", content: m.image });
    meta.push({ name: "twitter:image", content: m.image });
  }
  if (m.author) meta.push({ name: "author", content: m.author });
  if (m.publishedTime) meta.push({ property: "article:published_time", content: m.publishedTime });
  if (m.modifiedTime) meta.push({ property: "article:modified_time", content: m.modifiedTime });

  const links: Array<Record<string, string>> = [];
  const canonical = m.canonical ?? m.path;
  if (canonical) links.push({ rel: "canonical", href: canonical });
  return { meta, links };
}

export function articleJsonLd(opts: {
  title: string; description: string; image?: string; url: string;
  publishedTime: string; modifiedTime?: string; author: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: opts.title,
    description: opts.description,
    image: opts.image ? [opts.image] : undefined,
    datePublished: opts.publishedTime,
    dateModified: opts.modifiedTime ?? opts.publishedTime,
    author: [{ "@type": "Person", name: opts.author }],
    publisher: {
      "@type": "Organization",
      name: SITE,
      logo: { "@type": "ImageObject", url: "/logo.png" },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
  };
}

export function breadcrumbJsonLd(crumbs: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem", position: i + 1, name: c.name, item: c.url,
    })),
  };
}

export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(i => ({
      "@type": "Question", name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE,
    url: "https://propfirmknowledge.in",
    description: "All-in-one media platform for the forex and prop firm industry.",
  };
}

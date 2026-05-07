type Meta = {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  type?: "website" | "article";
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
};

const SITE = "PropFirm Knowledge";

export function buildHead(m: Meta) {
  const title = m.title.includes(SITE) ? m.title : `${m.title} | ${SITE}`;
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: m.description.slice(0, 158) },
    { property: "og:title", content: title },
    { property: "og:description", content: m.description.slice(0, 158) },
    { property: "og:type", content: m.type ?? "website" },
    { property: "og:site_name", content: SITE },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: m.description.slice(0, 158) },
  ];
  if (m.keywords?.length) meta.push({ name: "keywords", content: m.keywords.join(", ") });
  if (m.image) {
    meta.push({ property: "og:image", content: m.image });
    meta.push({ name: "twitter:image", content: m.image });
  }
  if (m.author) meta.push({ name: "author", content: m.author });
  if (m.publishedTime) meta.push({ property: "article:published_time", content: m.publishedTime });
  if (m.modifiedTime) meta.push({ property: "article:modified_time", content: m.modifiedTime });

  const links: Array<Record<string, string>> = [];
  if (m.canonical) links.push({ rel: "canonical", href: m.canonical });
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
    url: "https://propfirm-knowledge.lovable.app",
    description: "All-in-one media platform for the forex and prop firm industry.",
  };
}

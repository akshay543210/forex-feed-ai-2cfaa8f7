import { createFileRoute } from "@tanstack/react-router";

const SITE_URL = "https://propfirmknowledge.in";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /auth\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
        return new Response(body, { headers: { "Content-Type": "text/plain" } });
      },
    },
  },
});

import { createFileRoute } from "@tanstack/react-router";

// AdSense ads.txt — replace pub-XXXXXXXXXXXXXXXX with your real publisher ID
// once your AdSense account is approved. Format:
// google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
export const Route = createFileRoute("/ads.txt")({
  server: {
    handlers: {
      GET: async () => {
        const body = `google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n`;
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

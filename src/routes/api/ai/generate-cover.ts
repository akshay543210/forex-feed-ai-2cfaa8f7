import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const CHAT_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export const Route = createFileRoute("/api/ai/generate-cover")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization")?.replace("Bearer ", "");
          if (!auth) return json({ error: "Unauthorized" }, 401);

          const supabaseUrl = process.env.SUPABASE_URL!;
          const anon = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: `Bearer ${auth}` } } });
          const { data: u, error: uErr } = await userClient.auth.getUser();
          if (uErr || !u.user) return json({ error: "Unauthorized" }, 401);

          const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", u.user.id);
          if (!(roles ?? []).some(r => ["admin", "moderator", "author"].includes(r.role))) return json({ error: "Forbidden" }, 403);

          const body = await request.json() as { prompt?: string; slug?: string };
          if (!body.prompt || !body.slug) return json({ error: "Missing prompt or slug" }, 400);

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return json({ error: "AI not configured (missing LOVABLE_API_KEY)" }, 500);

          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!serviceKey) return json({ error: "Storage not configured (missing service role)" }, 500);

          // Try image generation via chat-completions image model (proven path used in generate-blog).
          const res = await fetch(CHAT_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{
                role: "user",
                content: `Editorial cover image, 16:9 widescreen, photorealistic, cinematic lighting, dark moody color palette with subtle blue/gold accents, no text, no logos, no watermarks. Subject: ${body.prompt}`,
              }],
              modalities: ["image", "text"],
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            console.error("generate-cover: AI gateway error", res.status, text);
            if (res.status === 429) return json({ error: "Rate limit reached. Try again in a moment." }, 429);
            if (res.status === 402) return json({ error: "AI credits exhausted. Add credits in Workspace → Usage." }, 402);
            return json({ error: `Image generation failed (${res.status}): ${text.slice(0, 200)}` }, 500);
          }

          const j = await res.json() as {
            choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }>; content?: string } }>;
          };
          const dataUrl = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!dataUrl) {
            console.error("generate-cover: no image in response", JSON.stringify(j).slice(0, 500));
            return json({ error: "Model returned no image. Try a different prompt." }, 502);
          }

          const m = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
          if (!m) {
            console.error("generate-cover: bad data url prefix", dataUrl.slice(0, 80));
            return json({ error: "Bad image data" }, 502);
          }
          const mime = m[1];
          const ext = (mime.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "");
          const buf = Buffer.from(m[2], "base64");

          const admin = createClient(supabaseUrl, serviceKey);
          const path = `blog-covers/${body.slug}-${Date.now().toString(36).slice(-5)}.${ext}`;
          const { error: upErr } = await admin.storage.from("media").upload(path, buf, { contentType: mime, upsert: true });
          if (upErr) {
            console.error("generate-cover: upload error", upErr);
            return json({ error: `Upload failed: ${upErr.message}` }, 500);
          }
          const { data } = admin.storage.from("media").getPublicUrl(path);
          return json({ url: data.publicUrl });
        } catch (e) {
          console.error("generate-cover: unexpected error", e);
          return json({ error: (e as Error).message || "Unexpected error" }, 500);
        }
      },
    },
  },
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });
}

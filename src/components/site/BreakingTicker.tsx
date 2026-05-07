import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Item = { id: string; slug: string; title: string };

export function BreakingTicker() {
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    supabase.from("blogs")
      .select("id, slug, title")
      .eq("status", "published")
      .or("is_breaking.eq.true,category_id.not.is.null")
      .order("published_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setItems(data ?? []));
  }, []);

  const display = items.length > 0 ? items : [
    { id: "p1", slug: "", title: "Welcome to PropFirm Knowledge — your daily edge in forex and prop trading" },
    { id: "p2", slug: "", title: "AI-curated news, payouts and reviews — updated 24/7" },
  ];
  const loop = [...display, ...display];

  return (
    <div className="border-b border-border bg-card/80 backdrop-blur-md overflow-hidden">
      <div className="mx-auto max-w-7xl flex items-center gap-3 px-4 py-2">
        <span className="flex items-center gap-1.5 rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider shrink-0">
          <Zap className="h-3 w-3" /> Breaking
        </span>
        <div className="overflow-hidden flex-1">
          <div className="flex gap-10 animate-ticker whitespace-nowrap text-sm">
            {loop.map((it, i) => (
              it.slug
                ? <Link key={i} to="/blog/$slug" params={{ slug: it.slug }} className="hover:text-primary text-muted-foreground">{it.title}</Link>
                : <span key={i} className="text-muted-foreground">{it.title}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

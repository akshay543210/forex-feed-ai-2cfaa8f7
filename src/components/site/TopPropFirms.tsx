import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Firm = { slug: string; name: string; logo_url: string | null; trust_score: number | null; popularity_score: number | null };

export function TopPropFirms() {
  const [firms, setFirms] = useState<Firm[]>([]);
  useEffect(() => {
    supabase.from("prop_firms")
      .select("slug,name,logo_url,trust_score,popularity_score")
      .order("popularity_score", { ascending: false })
      .limit(5)
      .then(({ data }) => setFirms(data ?? []));
  }, []);

  return (
    <div className="rounded-xl glass shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold flex items-center gap-2"><Award className="h-4 w-4 text-warning" /> Top Prop Firms Today</h3>
        <Link to="/prop-firms" className="text-xs text-primary hover:underline">All</Link>
      </div>
      <ul className="space-y-3">
        {firms.map((f, i) => (
          <li key={f.slug}>
            <Link to="/prop-firms/$slug" params={{ slug: f.slug }} className="flex items-center gap-3 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-md">
              <span className="font-display font-bold text-lg w-6 text-center text-muted-foreground">{i + 1}</span>
              <div className="h-9 w-9 rounded-lg bg-gradient-primary/30 flex items-center justify-center text-sm font-bold">
                {f.logo_url ? <img src={f.logo_url} alt={f.name} className="h-full w-full object-contain rounded-lg" /> : f.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{f.name}</p>
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Trust {f.trust_score ?? "—"}/10
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

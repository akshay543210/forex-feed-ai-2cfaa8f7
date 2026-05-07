import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRelative, formatUSD } from "@/lib/format";

type Payout = {
  id: string;
  amount_usd: number;
  status: string;
  created_at: string;
  prop_firms: { name: string; slug: string } | null;
};

export function LatestPayouts() {
  const [items, setItems] = useState<Payout[]>([]);
  useEffect(() => {
    supabase.from("payout_submissions")
      .select("id,amount_usd,status,created_at,prop_firms(name,slug)")
      .in("status", ["approved", "rejected"])
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => setItems((data as unknown as Payout[]) ?? []));
  }, []);

  return (
    <div className="rounded-xl glass shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold flex items-center gap-2"><DollarSign className="h-4 w-4 text-success" /> Latest Payouts</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No verified payouts yet — be the first to submit.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map(p => (
            <li key={p.id} className="flex items-center gap-3 text-sm">
              {p.status === "approved"
                ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="truncate"><span className="font-bold text-foreground">{formatUSD(p.amount_usd)}</span>{" "}
                  <span className="text-muted-foreground">— {p.prop_firms?.name ?? "Unknown"}</span></p>
                <p className="text-xs text-muted-foreground">{formatRelative(p.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

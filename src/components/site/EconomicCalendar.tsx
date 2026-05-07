import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Event = { id: string; title: string; currency: string | null; impact: string | null; event_time: string; forecast: string | null; previous: string | null };

export function EconomicCalendar() {
  const [events, setEvents] = useState<Event[]>([]);
  useEffect(() => {
    const now = new Date();
    const in24h = new Date(Date.now() + 36 * 3600_000);
    supabase.from("economic_events")
      .select("*")
      .gte("event_time", now.toISOString())
      .lte("event_time", in24h.toISOString())
      .order("event_time")
      .limit(6)
      .then(({ data }) => setEvents(data ?? []));
  }, []);

  return (
    <div className="rounded-xl glass shadow-card p-5">
      <h3 className="font-display font-bold flex items-center gap-2 mb-4"><CalendarClock className="h-4 w-4 text-primary" /> Economic Calendar</h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No high-impact events in the next 36 hours.</p>
      ) : (
        <ul className="space-y-2.5">
          {events.map(e => (
            <li key={e.id} className="flex items-start gap-3 text-sm">
              <span className={`mt-0.5 inline-flex h-5 px-1.5 items-center rounded text-[10px] font-bold ${
                e.impact === "High" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
              }`}>{e.currency}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.event_time).toLocaleString(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                  {e.forecast && <> · Fcst {e.forecast}</>}
                  {e.previous && <> · Prev {e.previous}</>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

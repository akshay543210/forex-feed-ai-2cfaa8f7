import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    const token = crypto.randomUUID();
    const { error } = await supabase.from("subscribers").insert({ email, confirm_token: token, status: "pending" });
    if (error) {
      setState("err");
      setMsg(error.message.includes("duplicate") ? "You're already subscribed." : "Couldn't subscribe. Try again.");
    } else {
      setState("ok");
      setMsg("Thanks! Check your inbox to confirm.");
      setEmail("");
    }
  };

  return (
    <div className="rounded-xl bg-gradient-primary/15 border border-primary/30 shadow-glow p-6">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-lg">Daily forex & prop firm digest</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Top stories, payouts and promo codes — delivered each morning.</p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input id="newsletter-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com" aria-label="Email address"
          className="flex-1 rounded-md bg-background/60 border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <button type="submit" disabled={state === "loading"}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />} Subscribe
        </button>
      </form>
      {msg && <p className={`mt-2 text-xs ${state === "ok" ? "text-success" : "text-destructive"}`}>{msg}</p>}
    </div>
  );
}

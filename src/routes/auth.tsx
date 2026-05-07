import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => buildHead({ title: "Sign in", description: "Sign in or create an account." }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin"|"signup">("signin");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/account" }); });
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { display_name: name } },
      });
      if (error) setErr(error.message); else nav({ to: "/account" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message); else nav({ to: "/account" });
    }
    setLoading(false);
  };

  const google = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/account" } });
  };

  return (
    <SiteLayout hideTicker>
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl glass shadow-card p-6">
          <h1 className="font-display text-2xl font-bold">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Submit reviews, payouts and join the community.</p>
          <button onClick={google} className="mt-5 w-full rounded-md border border-border bg-background hover:bg-muted py-2.5 text-sm font-medium">
            Continue with Google
          </button>
          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
          </div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Display name"
                className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
            )}
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email"
              className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password (min 8)"
              className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm" />
            {err && <p className="text-xs text-destructive">{err}</p>}
            <button disabled={loading} className="w-full rounded-md bg-gradient-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50">
              {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
          <button onClick={() => setMode(m => m === "signin" ? "signup" : "signin")} className="mt-4 text-xs text-muted-foreground hover:text-foreground w-full text-center">
            {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </SiteLayout>
  );
}

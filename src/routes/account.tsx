import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { buildHead } from "@/lib/seo";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/account")({
  head: () => buildHead({ title: "Account", description: "Manage your account" }),
  component: AccountPage,
});

function AccountPage() {
  const nav = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { nav({ to: "/auth" }); return; }
      setUser(data.user);
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      setRoles((r ?? []).map(x => x.role as string));
    });
  }, [nav]);

  const isStaff = roles.some(r => ["admin","moderator","author"].includes(r));

  return (
    <SiteLayout hideTicker>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">Your account</h1>
        {user && <p className="text-muted-foreground mt-1">{user.email}</p>}
        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          {roles.map(r => <span key={r} className="rounded-full bg-primary/15 text-primary px-2 py-0.5 capitalize">{r}</span>)}
        </div>
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <Link to="/payouts" className="rounded-xl glass p-5 hover:border-primary/40">Submit payout proof</Link>
          {isStaff && <Link to="/admin" className="rounded-xl glass p-5 hover:border-primary/40">Open admin dashboard</Link>}
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => nav({ to: "/" }))}
          className="mt-8 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">Sign out</button>
      </div>
    </SiteLayout>
  );
}

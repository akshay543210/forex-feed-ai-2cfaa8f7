import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import logoAsset from "@/assets/propfirm-knowledge-logo.jpg.asset.json";
import { SocialLinks } from "./SocialLinks";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const NAV = [
  { to: "/category/forex-news", label: "Forex News" },
  { to: "/category/prop-firm-reviews", label: "Reviews" },
  { to: "/category/payout-updates", label: "Payouts" },
  { to: "/category/promo-codes", label: "Promos" },
  { to: "/prop-firms", label: "Prop Firms" },
  { to: "/category/trading-education", label: "Education" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <img src={logoAsset.url} alt="PropFirm Knowledge" className="h-9 w-9 rounded-lg object-cover shadow-glow" />
          <span className="text-gradient hidden sm:inline">PropFirm Knowledge</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden xl:flex mr-1"><SocialLinks size="sm" /></div>
          <a href="https://shop.propfirmknowledge.in/" target="_blank" rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 rounded-md bg-gradient-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 shadow-glow">
            <ShoppingBag className="h-3.5 w-3.5" /> Store
          </a>
          <Link to="/search" className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted">
            <Search className="h-4 w-4" />
          </Link>
          {user ? (
            <Link to="/account" className="hidden md:inline-flex rounded-md bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-muted">
              Account
            </Link>
          ) : (
            <Link to="/auth" className="hidden md:inline-flex rounded-md bg-gradient-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 shadow-glow">
              Sign in
            </Link>
          )}
          <button onClick={() => setOpen(v => !v)} className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-muted" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-card/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-1">
            {NAV.map(n => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">
                {n.label}
              </Link>
            ))}
            <Link to="/search" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted">Search</Link>
            <a href="https://shop.propfirmknowledge.in/" target="_blank" rel="noopener noreferrer" className="mt-2 rounded-md bg-gradient-primary px-3 py-2 text-sm font-semibold text-primary-foreground text-center inline-flex items-center justify-center gap-1.5">
              <ShoppingBag className="h-4 w-4" /> Visit Store · 30% OFF
            </a>
            {!user && <Link to="/auth" onClick={() => setOpen(false)} className="mt-1 rounded-md border border-border px-3 py-2 text-sm font-medium text-center">Sign in</Link>}
            <div className="mt-3 flex justify-center"><SocialLinks size="sm" /></div>
          </div>
        </div>
      )}
    </header>
  );
}

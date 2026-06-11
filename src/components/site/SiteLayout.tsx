import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { BreakingTicker } from "./BreakingTicker";
import { StoreBanner } from "./StoreBanner";

export function SiteLayout({ children, hideTicker = false }: { children: ReactNode; hideTicker?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {!hideTicker && <StoreBanner />}
      {!hideTicker && <BreakingTicker />}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

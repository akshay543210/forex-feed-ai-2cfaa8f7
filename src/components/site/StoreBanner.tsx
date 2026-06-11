import { ShoppingBag, Sparkles, ArrowRight } from "lucide-react";

/**
 * Scrolling marquee banner promoting the PropFirm Knowledge Store.
 * Use site-wide (home, blog pages, etc.).
 */
export function StoreBanner() {
  const items = [
    { icon: Sparkles, text: "Exclusive 30% OFF on funded accounts — Claim it now" },
    { icon: ShoppingBag, text: "Shop verified prop firm accounts at PropFirm Knowledge Store" },
    { icon: Sparkles, text: "Instant delivery · Trusted by 10,000+ traders" },
    { icon: ShoppingBag, text: "Use code PKOFF for maximum savings" },
  ];
  const loop = [...items, ...items];

  return (
    <a
      href="https://shop.propfirmknowledge.in/"
      target="_blank"
      rel="noopener noreferrer"
      className="group block relative overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-y border-primary/30 hover:border-primary transition-colors"
      aria-label="Visit PropFirm Knowledge Store"
    >
      <div className="flex whitespace-nowrap animate-[marquee_35s_linear_infinite] py-2.5">
        {loop.map((it, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-6 text-sm font-medium text-foreground">
            <it.icon className="h-4 w-4 text-primary shrink-0" />
            {it.text}
            <ArrowRight className="h-3.5 w-3.5 text-primary opacity-60 group-hover:translate-x-1 transition-transform" />
            <span className="text-primary mx-2">•</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </a>
  );
}

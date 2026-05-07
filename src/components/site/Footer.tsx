import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <h4 className="font-display font-bold text-foreground mb-3">PropFirm Knowledge</h4>
          <p className="text-muted-foreground">All-in-one media platform for the forex and prop firm industry.</p>
        </div>
        <div>
          <h5 className="font-medium mb-3">Content</h5>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/category/forex-news" className="hover:text-foreground">Forex News</Link></li>
            <li><Link to="/category/prop-firm-reviews" className="hover:text-foreground">Reviews</Link></li>
            <li><Link to="/category/payout-updates" className="hover:text-foreground">Payouts</Link></li>
            <li><Link to="/category/promo-codes" className="hover:text-foreground">Promo Codes</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-3">Resources</h5>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/prop-firms" className="hover:text-foreground">Prop Firm Directory</Link></li>
            <li><Link to="/category/trading-education" className="hover:text-foreground">Education</Link></li>
            <li><Link to="/category/scam-alerts" className="hover:text-foreground">Scam Alerts</Link></li>
            <li><a href="/sitemap.xml" className="hover:text-foreground">Sitemap</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-medium mb-3">Legal</h5>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
            <li><Link to="/disclaimer" className="hover:text-foreground">Disclaimer</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <p>© {new Date().getFullYear()} PropFirm Knowledge. All rights reserved.</p>
          <p>Educational content only — not financial advice.</p>
        </div>
      </div>
    </footer>
  );
}

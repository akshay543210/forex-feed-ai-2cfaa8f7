# PropFirm Knowledge — Build Plan (Phase 1)

A premium dark-themed media platform for the forex & prop firm industry: email/Google auth, role-gated admin, manual + AI-assisted publishing, scheduled auto-generation (2 posts/day, 12h apart), prop firm reviews, payout tracking, full Adsense-friendly SEO.

Live scraping of ForexFactory, Twitter/X, Discord, Telegram, Trustpilot etc. is **not** included — those violate ToS or need paid APIs. We use **RSS feeds + Perplexity (AI web research)** for trending topic discovery and **Lovable AI (Gemini default, GPT optional)** for article writing.

---

## Public site

- **Homepage**
  - Sticky **Breaking News ticker** (forex fundamentals + prop firm updates)
  - Hero: latest forex news
  - **Top Prop Firms Today** ranking widget (trust score + payout volume)
  - **Latest Payout Proofs** widget (approved + rejected feed)
  - **Economic Calendar Highlights** (next 24h high-impact events)
  - Trending prop firm news, new promo codes, featured reviews, education, trending tags cloud, newsletter CTA
- **Category pages**: Forex News, Fundamentals, Prop Firm Reviews, Payout Updates, Promo Codes, Trading Education, Scam Alerts, Trading Psychology, Market Analysis
- **Single blog page**: reading progress bar, **reading time estimate**, table of contents, author byline, FAQ accordion, share buttons, **auto-generated related articles**, comments
- **Prop firm directory** + per-firm pages (overview, rules, profit split, pricing, scaling, pros/cons, trust score, payout proofs, reviews, active promo codes)
- **Payouts page**: approved + rejected feeds, filter by firm, community upvotes/comments, submission form (logged-in)
- **Promo codes page**: copy-to-clipboard, expiry, firm filter
- **Search**, **trending**, **tag**, **author** pages
- **Legal/Adsense**: About, Contact, Privacy, Terms, Disclaimer, Cookie Policy
- **Newsletter system**: email capture (Lovable Cloud `subscribers` table), double opt-in, unsubscribe, admin broadcast tool

## SEO foundation

- Dynamic meta + OG/Twitter tags per route
- **Auto-generated JSON-LD**: Article, FAQ, Breadcrumb, Organization, Review schema
- **Auto-generated breadcrumbs** from route tree
- **Dynamic sitemap.xml** (rebuilt on publish), robots.txt, RSS feed
- Canonical URLs, **AI-generated SEO tags** (meta title/description/keywords) per article
- **Auto-generated internal links** (AI scans new article, finds 3–5 relevant existing posts, inserts contextual links)
- Image pipeline: upload → server-side compress → **WebP conversion** + responsive srcset  
  
## E-E-A-T Optimization
  Optimize the platform for Google E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness):
  - Add author bios with expertise details
  - Show “Last Updated” timestamps on articles
  - Add source references section in articles
  - Add editorial review workflow
  - Display transparent About/Contact information
  - Add “Reviewed by PropFirm Knowledge Editorial Team” option
  - Include organization schema markup
  - Show author social/profile links if available
  - Display trust indicators on prop firm reviews and payout reports
  - Prioritize factual, verified, trustworthy content

## Admin dashboard (`/admin`, role-gated)

- Rich text + markdown editor for manual posts
- AI draft generator: topic/keywords → Perplexity research → Gemini long-form → review → publish/schedule
- **AI workflow mode toggle** (per category): `auto_publish` | `draft_only` | `manual_approval`
- AI auto-queue: review, edit, approve, reject
- Schedule posts (date/time)
- Manage prop firms, promo codes, categories, tags, subscribers
- Moderate comments, payout submissions, reports
- User & role management
- Analytics (views, top posts, subscriber growth)

## Auto-generation engine

- Cron via `/api/public/cron/auto-blog` (12h interval, shared-secret)
- **Topic discovery**: curated RSS (Reuters, Yahoo Finance, Investing.com, FXStreet) + Perplexity sonar query for trending forex/prop firm topics
- **Duplicate prevention**: vector/keyword similarity check against last 90 days of titles + slugs; **keyword cannibalization** check (rejects topics overlapping existing ranked keywords)
- Writes 1200–3000 word article with Gemini (journalism prompt: hook, context, developments, facts, expert framing, takeaways, FAQ, CTA, outlook)
- Cross-checks 2+ sources, humanization + SEO polish pass
- **AI quality score** (clarity, originality, SEO, factual coherence) — must pass threshold
- **Plagiarism score check** (n-gram overlap vs source material + Perplexity quote scan) — must pass threshold
- Routes to `auto_publish` / `draft` / `pending_approval` based on category mode
- Enforces 12h gap and category rotation

## Performance & Core Web Vitals

- No particle background, minimal Framer Motion (transitions + ticker only)
- Route-level code splitting, lazy images, skeleton loaders
- **Edge caching** for homepage, trending feeds, sitemap (Cache-Control + stale-while-revalidate)
- WebP + responsive images, font-display: swap
- Mobile-first layout, sticky navbar with mobile drawer
- Lighthouse target: 90+ on mobile

## Auth & roles

- Lovable Cloud: email/password + Google
- `user_roles` table (admin/moderator/author/user) + `has_role()` security-definer

## Database (Lovable Cloud, full RLS)

`profiles`, `user_roles`, `categories`, `tags`, `blogs` (status, source, ai_quality_score, plagiarism_score, reading_time, workflow_mode), `blog_tags`, `related_blogs`, `prop_firms`, `propfirm_reviews`, `payout_submissions`, `promo_codes`, `comments`, `likes`, `bookmarks`, `votes`, `reports`, `notifications`, `seo_metadata`, `ai_topic_queue`, `topic_history` (for dedup), `rss_sources`, `subscribers`, `economic_events`, `cache_entries`

## Tech

- TanStack Start (React 19, TS, Tailwind v4, TanStack Query, Framer Motion)
- Lovable Cloud (DB, auth, storage)
- Lovable AI Gateway: `gemini-2.5-pro` writing, `gemini-2.5-flash` headlines/SEO/quality scoring
- Perplexity connector for research
- `fast-xml-parser` for RSS, `sharp`-equivalent edge image processing for WebP

---

## Design

Dark luxury, neon blue/purple accents, glassmorphism cards, subtle motion. Inspired by TradingView/Bloomberg density.

---

## Deferred to later phases

- ForexFactory / TradingView / Bloomberg / Twitter/X / Discord / Telegram / Trustpilot scraping (ToS / paid API)
- Twitter/X login (needs native Supabase setup)
- Real-time economic calendar feed (needs paid Finnhub/Twelve Data) — Phase 1 uses curated/manually-seeded events shown in the highlights widget
- Mobile app, push notifications, paid memberships
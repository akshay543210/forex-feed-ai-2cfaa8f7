
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'author', 'user');
CREATE TYPE public.blog_status AS ENUM ('draft', 'scheduled', 'pending_approval', 'published', 'rejected');
CREATE TYPE public.blog_source AS ENUM ('manual', 'ai_auto', 'ai_assisted');
CREATE TYPE public.workflow_mode AS ENUM ('auto_publish', 'draft_only', 'manual_approval');
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.subscriber_status AS ENUM ('pending', 'confirmed', 'unsubscribed');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  expertise TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ CATEGORIES ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  workflow_mode public.workflow_mode NOT NULL DEFAULT 'manual_approval',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ TAGS ============
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tags public read" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Staff manage tags" ON public.tags FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'author'));

-- ============ BLOGS ============
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.blog_status NOT NULL DEFAULT 'draft',
  source public.blog_source NOT NULL DEFAULT 'manual',
  reading_time_minutes INTEGER,
  ai_quality_score NUMERIC(4,2),
  plagiarism_score NUMERIC(4,2),
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  faq JSONB,
  sources JSONB,
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_breaking BOOLEAN NOT NULL DEFAULT false,
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_blogs_status_published ON public.blogs(status, published_at DESC);
CREATE INDEX idx_blogs_category ON public.blogs(category_id);
CREATE INDEX idx_blogs_slug ON public.blogs(slug);
CREATE TRIGGER trg_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published blogs are public" ON public.blogs FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR auth.uid() = author_id);
CREATE POLICY "Authors create blogs" ON public.blogs FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'author'));
CREATE POLICY "Authors update own; staff updates all" ON public.blogs FOR UPDATE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Admins delete blogs" ON public.blogs FOR DELETE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- blog_tags
CREATE TABLE public.blog_tags (
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, tag_id)
);
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Blog tags public read" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Staff manage blog tags" ON public.blog_tags FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'author'));

-- related_blogs
CREATE TABLE public.related_blogs (
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  related_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  similarity NUMERIC(4,3),
  PRIMARY KEY (blog_id, related_id)
);
ALTER TABLE public.related_blogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Related public read" ON public.related_blogs FOR SELECT USING (true);
CREATE POLICY "Staff manage related" ON public.related_blogs FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- ============ PROP FIRMS ============
CREATE TABLE public.prop_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  founded_year INTEGER,
  headquarters TEXT,
  description TEXT,
  profit_split TEXT,
  max_funding TEXT,
  min_account_size TEXT,
  pricing_summary TEXT,
  payout_frequency TEXT,
  scaling_plan TEXT,
  rules JSONB,
  pros TEXT[],
  cons TEXT[],
  trust_score NUMERIC(3,1) DEFAULT 0,
  popularity_score NUMERIC(6,2) DEFAULT 0,
  total_payouts_usd NUMERIC(14,2) DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_prop_firms_updated BEFORE UPDATE ON public.prop_firms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.prop_firms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prop firms public read" ON public.prop_firms FOR SELECT USING (true);
CREATE POLICY "Staff manage prop firms" ON public.prop_firms FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- propfirm_reviews
CREATE TABLE public.propfirm_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.prop_firms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.propfirm_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews public read" ON public.propfirm_reviews FOR SELECT USING (true);
CREATE POLICY "Users create reviews" ON public.propfirm_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.propfirm_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users/staff delete reviews" ON public.propfirm_reviews FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- payout_submissions
CREATE TABLE public.payout_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_id UUID REFERENCES public.prop_firms(id) ON DELETE SET NULL,
  amount_usd NUMERIC(12,2) NOT NULL,
  proof_url TEXT,
  notes TEXT,
  status public.payout_status NOT NULL DEFAULT 'pending',
  is_rejected BOOLEAN NOT NULL DEFAULT false,
  rejection_reason TEXT,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payouts_status ON public.payout_submissions(status, created_at DESC);
ALTER TABLE public.payout_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved payouts public" ON public.payout_submissions FOR SELECT USING (status IN ('approved','rejected') OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Users submit payouts" ON public.payout_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff update payouts" ON public.payout_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- promo_codes
CREATE TABLE public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID REFERENCES public.prop_firms(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_text TEXT,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Promo codes public" ON public.promo_codes FOR SELECT USING (true);
CREATE POLICY "Staff manage promo codes" ON public.promo_codes FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments public read" ON public.comments FOR SELECT USING (NOT is_hidden OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Users post comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own" ON public.comments FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Users delete own" ON public.comments FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- likes / bookmarks
CREATE TABLE public.likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, blog_id)
);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes public read" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_id UUID NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, blog_id)
);
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bookmarks own read" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users bookmark" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unbookmark" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- subscribers
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  status public.subscriber_status NOT NULL DEFAULT 'pending',
  confirm_token TEXT,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone subscribe" ON public.subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read subs" ON public.subscribers FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update subs" ON public.subscribers FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- AI topic queue + history + RSS sources
CREATE TABLE public.rss_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  feed_url TEXT NOT NULL UNIQUE,
  category_slug TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rss_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSS public read" ON public.rss_sources FOR SELECT USING (true);
CREATE POLICY "Admins manage RSS" ON public.rss_sources FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ai_topic_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  keywords TEXT[],
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  source_url TEXT,
  source_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  blog_id UUID REFERENCES public.blogs(id) ON DELETE SET NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);
CREATE INDEX idx_topic_queue_status ON public.ai_topic_queue(status, created_at);
ALTER TABLE public.ai_topic_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read queue" ON public.ai_topic_queue FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Staff manage queue" ON public.ai_topic_queue FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE TABLE public.topic_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  normalized_topic TEXT NOT NULL,
  keywords TEXT[],
  blog_id UUID REFERENCES public.blogs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_topic_history_norm ON public.topic_history(normalized_topic);
ALTER TABLE public.topic_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read history" ON public.topic_history FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Staff write history" ON public.topic_history FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- economic events
CREATE TABLE public.economic_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  country TEXT,
  currency TEXT,
  impact TEXT,
  event_time TIMESTAMPTZ NOT NULL,
  forecast TEXT,
  previous TEXT,
  actual TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_econ_event_time ON public.economic_events(event_time);
ALTER TABLE public.economic_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Econ events public" ON public.economic_events FOR SELECT USING (true);
CREATE POLICY "Admins manage events" ON public.economic_events FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Media public read" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Auth users upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users update own media" ON storage.objects FOR UPDATE USING (bucket_id = 'media' AND auth.uid() = owner);
CREATE POLICY "Users delete own media" ON storage.objects FOR DELETE USING (bucket_id = 'media' AND (auth.uid() = owner OR public.has_role(auth.uid(), 'admin')));

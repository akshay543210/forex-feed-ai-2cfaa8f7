
DROP POLICY IF EXISTS "Approved payouts public" ON public.payout_submissions;

CREATE POLICY "Public read approved/rejected" ON public.payout_submissions
  FOR SELECT
  USING (
    status IN ('approved'::payout_status, 'rejected'::payout_status)
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'moderator'::app_role)
  );

REVOKE SELECT ON public.payout_submissions FROM anon, authenticated;
GRANT SELECT (id, amount_usd, status, created_at, firm_id) ON public.payout_submissions TO anon;
GRANT SELECT ON public.payout_submissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payout_submissions TO authenticated;
GRANT ALL ON public.payout_submissions TO service_role;

DROP POLICY IF EXISTS "RSS public read" ON public.rss_sources;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

DROP POLICY IF EXISTS "Anyone subscribe" ON public.subscribers;
CREATE POLICY "Anyone subscribe" ON public.subscribers
  FOR INSERT
  WITH CHECK (email IS NOT NULL AND length(email) BETWEEN 3 AND 320 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

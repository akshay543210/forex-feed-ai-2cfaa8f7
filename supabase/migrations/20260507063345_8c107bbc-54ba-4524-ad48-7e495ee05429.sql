
-- Fix search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Replace overly broad bucket listing
DROP POLICY IF EXISTS "Media public read" ON storage.objects;
CREATE POLICY "Media public read" ON storage.objects FOR SELECT
USING (bucket_id = 'media' AND (auth.role() = 'anon' IS NOT NULL));
-- Note: public bucket files are still served via direct URL; we don't need broad list.
-- Restrict SELECT on storage.objects in 'media' to owner or staff for listing context:
DROP POLICY IF EXISTS "Media public read" ON storage.objects;
CREATE POLICY "Media owner/staff list" ON storage.objects FOR SELECT
USING (
  bucket_id = 'media' AND (
    auth.uid() = owner
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  )
);

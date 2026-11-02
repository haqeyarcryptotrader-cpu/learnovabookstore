ALTER TABLE public.community_posts ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
UPDATE public.community_posts SET status = 'approved';
ALTER TABLE public.community_posts ADD CONSTRAINT community_posts_status_check CHECK (status IN ('pending','approved'));
DROP POLICY "posts public read" ON public.community_posts;
CREATE POLICY "posts read approved own or admin" ON public.community_posts FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "posts admin approve" ON public.community_posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
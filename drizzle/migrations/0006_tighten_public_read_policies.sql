DROP POLICY IF EXISTS "likes public read" ON public.post_likes;
CREATE POLICY "likes read on visible posts" ON public.post_likes FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id AND (p.status = 'approved' OR p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

DROP POLICY IF EXISTS "comments public read" ON public.post_comments;
CREATE POLICY "comments read on visible posts" ON public.post_comments FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.community_posts p WHERE p.id = post_id AND (p.status = 'approved' OR p.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

DROP POLICY IF EXISTS "reviews public read" ON public.book_reviews;
CREATE POLICY "reviews read for existing books" ON public.book_reviews FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.books b WHERE b.id = book_id));

DROP POLICY IF EXISTS "anyone can place order" ON public.orders;
CREATE POLICY "place order as self or guest" ON public.orders FOR INSERT TO anon, authenticated
WITH CHECK ((user_id IS NULL OR user_id = auth.uid()) AND status = 'new' AND length(customer_name) BETWEEN 1 AND 200 AND length(phone) BETWEEN 3 AND 40);

DROP POLICY IF EXISTS "post images read" ON storage.objects;
CREATE POLICY "post images owner or admin read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'post-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
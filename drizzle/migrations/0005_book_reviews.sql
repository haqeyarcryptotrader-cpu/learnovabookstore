CREATE TABLE public.book_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  user_id uuid NOT NULL,
  author_name text NOT NULL DEFAULT '',
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (book_id, user_id)
);
GRANT SELECT ON public.book_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.book_reviews TO authenticated;
GRANT ALL ON public.book_reviews TO service_role;
ALTER TABLE public.book_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.book_reviews FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "reviews own insert" ON public.book_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews own update" ON public.book_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews own or admin delete" ON public.book_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));
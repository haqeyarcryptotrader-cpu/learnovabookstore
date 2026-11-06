CREATE TABLE public.book_access (
  user_id uuid NOT NULL,
  book_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id)
);
GRANT SELECT, INSERT, DELETE ON public.book_access TO authenticated;
GRANT ALL ON public.book_access TO service_role;
ALTER TABLE public.book_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own access read" ON public.book_access FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin grant" ON public.book_access FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin revoke" ON public.book_access FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.admin_grant_book(_email text, _book_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(_email));
  IF uid IS NULL THEN RAISE EXCEPTION 'No account with this email'; END IF;
  INSERT INTO public.book_access(user_id, book_id) VALUES (uid, _book_id) ON CONFLICT DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION public.reader_pdf_link(_book_id text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.pdf_link FROM public.books b
  WHERE b.id::text = _book_id AND (b.soft_price = 0 OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.book_access a WHERE a.user_id = auth.uid() AND a.book_id = _book_id))
$$;
REVOKE EXECUTE ON FUNCTION public.admin_grant_book(text,text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reader_pdf_link(text) FROM anon;
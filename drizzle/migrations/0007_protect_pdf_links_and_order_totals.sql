REVOKE SELECT ON public.books FROM anon, authenticated;
GRANT SELECT (id, title, author, category, hard_price, soft_price, cover_url, description, in_stock, sample_pages, created_at) ON public.books TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.book_pdf_links()
RETURNS TABLE(id text, pdf_link text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.pdf_link FROM public.books b
  WHERE b.soft_price = 0 OR public.has_role(auth.uid(), 'admin');
$$;
GRANT EXECUTE ON FUNCTION public.book_pdf_links() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.price_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE it jsonb; b public.books; p numeric; q int; tot numeric := 0; out_items jsonb := '[]'::jsonb;
BEGIN
  IF jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 OR jsonb_array_length(NEW.items) > 50 THEN
    RAISE EXCEPTION 'Invalid order items';
  END IF;
  FOR it IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
    SELECT * INTO b FROM public.books WHERE id = it->>'book_id';
    IF NOT FOUND THEN RAISE EXCEPTION 'Unknown book'; END IF;
    q := COALESCE((it->>'qty')::int, 0);
    IF q < 1 OR q > 100 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    IF it->>'format' = 'hard' THEN p := b.hard_price;
    ELSIF it->>'format' = 'soft' THEN p := b.soft_price; q := 1;
    ELSE RAISE EXCEPTION 'Invalid format'; END IF;
    IF p IS NULL THEN RAISE EXCEPTION 'Format not available'; END IF;
    tot := tot + p * q;
    out_items := out_items || jsonb_build_object('book_id', b.id, 'title', b.title, 'format', it->>'format', 'qty', q, 'price', p);
  END LOOP;
  NEW.items := out_items;
  NEW.total_afn := tot;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.price_order() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS orders_price_server_side ON public.orders;
CREATE TRIGGER orders_price_server_side BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.price_order();
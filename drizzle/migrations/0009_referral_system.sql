-- Referral code per customer
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

CREATE OR REPLACE FUNCTION public.gen_referral_code() RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c text;
BEGIN
  LOOP
    c := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 7));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = c);
  END LOOP;
  RETURN c;
END $$;

UPDATE public.profiles SET referral_code = public.gen_referral_code() WHERE referral_code IS NULL;

CREATE OR REPLACE FUNCTION public.protect_referral_code() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN NEW.referral_code := public.gen_referral_code();
  ELSIF NOT public.has_role(auth.uid(), 'admin') THEN NEW.referral_code := OLD.referral_code;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS profiles_protect_referral_code ON public.profiles;
CREATE TRIGGER profiles_protect_referral_code BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_referral_code();

-- Orders remember who referred the buyer
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_code text, ADD COLUMN IF NOT EXISTS referrer_id uuid;

CREATE OR REPLACE FUNCTION public.resolve_order_referrer() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r uuid; rphone text;
BEGIN
  NEW.referrer_id := NULL;
  NEW.referral_code := NULLIF(upper(trim(coalesce(NEW.referral_code, ''))), '');
  IF NEW.referral_code IS NULL THEN RETURN NEW; END IF;
  SELECT p.id, p.phone INTO r, rphone FROM public.profiles p WHERE p.referral_code = NEW.referral_code;
  IF r IS NULL THEN RETURN NEW; END IF;
  -- block self-referral (same account or same phone number)
  IF NEW.user_id IS NOT NULL AND NEW.user_id = r THEN RETURN NEW; END IF;
  IF length(regexp_replace(coalesce(rphone, ''), '\D', '', 'g')) >= 9
     AND right(regexp_replace(rphone, '\D', '', 'g'), 9) = right(regexp_replace(NEW.phone, '\D', '', 'g'), 9)
  THEN RETURN NEW; END IF;
  NEW.referrer_id := r;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS orders_resolve_referrer ON public.orders;
CREATE TRIGGER orders_resolve_referrer BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.resolve_order_referrer();

-- Tables (no direct access; everything goes through the functions below)
CREATE TABLE IF NOT EXISTS public.referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  amount_afn numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','rejected')),
  approve_after timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.referral_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount_afn numeric NOT NULL CHECK (amount_afn > 0),
  method text NOT NULL,
  account text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','paid','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.referral_commissions, public.referral_payouts TO service_role;

-- Create commission when you confirm an order (change 0.20 per format here)
CREATE OR REPLACE FUNCTION public.orders_referral_commission() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE amt numeric;
BEGIN
  IF NEW.referrer_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status IN ('paid','delivered') AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT coalesce(sum((it->>'price')::numeric * (it->>'qty')::int *
           CASE WHEN it->>'format' = 'hard' THEN 0.20 ELSE 0.20 END), 0)
      INTO amt FROM jsonb_array_elements(NEW.items) AS e(it);
    IF amt > 0 THEN
      INSERT INTO public.referral_commissions(referrer_id, order_id, amount_afn)
      VALUES (NEW.referrer_id, NEW.id, round(amt)) ON CONFLICT (order_id) DO NOTHING;
    END IF;
  ELSIF NEW.status = 'cancelled' THEN
    UPDATE public.referral_commissions SET status = 'rejected' WHERE order_id = NEW.id AND status = 'pending';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS orders_referral_commission ON public.orders;
CREATE TRIGGER orders_referral_commission AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.orders_referral_commission();

-- Customer functions
CREATE OR REPLACE FUNCTION public.my_referral_summary()
RETURNS TABLE(code text, pending_afn numeric, available_afn numeric, paid_afn numeric, referred_orders bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.referral_code,
    coalesce((SELECT sum(c.amount_afn) FROM public.referral_commissions c WHERE c.referrer_id = p.id AND c.status = 'pending' AND c.approve_after > now()), 0),
    coalesce((SELECT sum(c.amount_afn) FROM public.referral_commissions c WHERE c.referrer_id = p.id AND c.status = 'pending' AND c.approve_after <= now()), 0)
      - coalesce((SELECT sum(x.amount_afn) FROM public.referral_payouts x WHERE x.user_id = p.id AND x.status IN ('requested','paid')), 0),
    coalesce((SELECT sum(x.amount_afn) FROM public.referral_payouts x WHERE x.user_id = p.id AND x.status = 'paid'), 0),
    (SELECT count(*) FROM public.referral_commissions c WHERE c.referrer_id = p.id AND c.status = 'pending')
  FROM public.profiles p WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.my_referral_payouts()
RETURNS TABLE(id uuid, amount_afn numeric, method text, status text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT x.id, x.amount_afn, x.method, x.status, x.created_at
  FROM public.referral_payouts x WHERE x.user_id = auth.uid() ORDER BY x.created_at DESC LIMIT 20
$$;

CREATE OR REPLACE FUNCTION public.request_referral_payout(_amount numeric, _method text, _account text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE avail numeric;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF _method NOT IN ('store_credit','hesabpay','mobile_money','hawala') THEN RAISE EXCEPTION 'Invalid method'; END IF;
  IF _amount < 500 THEN RAISE EXCEPTION 'Minimum withdrawal is 500 AFN'; END IF;
  IF _method <> 'store_credit' AND length(trim(_account)) < 5 THEN RAISE EXCEPTION 'Enter your account or phone number'; END IF;
  PERFORM 1 FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  SELECT s.available_afn INTO avail FROM public.my_referral_summary() s;
  IF coalesce(avail, 0) < _amount THEN RAISE EXCEPTION 'Not enough available balance'; END IF;
  INSERT INTO public.referral_payouts(user_id, amount_afn, method, account)
  VALUES (auth.uid(), _amount, _method, left(trim(_account), 100));
END $$;

-- Admin functions
CREATE OR REPLACE FUNCTION public.admin_list_payouts()
RETURNS TABLE(id uuid, user_id uuid, full_name text, phone text, email text, amount_afn numeric, method text, account text, status text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY
    SELECT x.id, x.user_id, p.full_name, p.phone, u.email::text, x.amount_afn, x.method, x.account, x.status, x.created_at
    FROM public.referral_payouts x
    LEFT JOIN public.profiles p ON p.id = x.user_id
    LEFT JOIN auth.users u ON u.id = x.user_id
    ORDER BY (x.status = 'requested') DESC, x.created_at DESC LIMIT 200;
END $$;

CREATE OR REPLACE FUNCTION public.admin_list_commissions()
RETURNS TABLE(id uuid, order_id uuid, referrer_name text, referrer_phone text, amount_afn numeric, status text, matured boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  RETURN QUERY
    SELECT c.id, c.order_id, p.full_name, p.phone, c.amount_afn, c.status, (c.approve_after <= now()), c.created_at
    FROM public.referral_commissions c LEFT JOIN public.profiles p ON p.id = c.referrer_id
    ORDER BY c.created_at DESC LIMIT 200;
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_payout_status(_id uuid, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF _status NOT IN ('requested','paid','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE public.referral_payouts SET status = _status,
    paid_at = CASE WHEN _status = 'paid' THEN now() END WHERE id = _id;
END $$;

-- Permissions
REVOKE EXECUTE ON FUNCTION public.gen_referral_code(), public.protect_referral_code(),
  public.resolve_order_referrer(), public.orders_referral_commission() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.my_referral_summary(), public.my_referral_payouts(),
  public.request_referral_payout(numeric,text,text), public.admin_list_payouts(),
  public.admin_list_commissions(), public.admin_set_payout_status(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_referral_summary(), public.my_referral_payouts(),
  public.request_referral_payout(numeric,text,text), public.admin_list_payouts(),
  public.admin_list_commissions(), public.admin_set_payout_status(uuid,text) TO authenticated;

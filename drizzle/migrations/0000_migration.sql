create type public.app_role as enum ('admin');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- first account to sign up becomes the store admin
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create table public.books (
  id text primary key,
  title text not null,
  author text not null default '',
  category text not null default 'Literature',
  hard_price numeric,
  soft_price numeric,
  cover_url text not null default '',
  description text not null default '',
  in_stock boolean not null default true,
  pdf_link text not null default '',
  sample_pages text,
  created_at timestamptz not null default now()
);
grant select on public.books to anon, authenticated;
grant insert, update, delete on public.books to authenticated;
grant all on public.books to service_role;
alter table public.books enable row level security;
create policy "books public read" on public.books for select to anon, authenticated using (true);
create policy "admin insert books" on public.books for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admin update books" on public.books for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin delete books" on public.books for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  city text not null default '',
  address text not null default '',
  payment_method text not null default '',
  items jsonb not null default '[]'::jsonb,
  total_afn numeric not null default 0,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "anyone can place order" on public.orders for insert to anon, authenticated with check (true);
create policy "admin read orders" on public.orders for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin update orders" on public.orders for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin delete orders" on public.orders for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

insert into public.books (id,title,author,category,hard_price,soft_price,description,in_stock,sample_pages) values
('bitcoin-standard','The Bitcoin Standard','Saifedean Ammous','Crypto & Finance',1450,350,'A history of money from seashells to gold to Bitcoin, explaining why sound money matters and how a decentralised currency could reshape the global economy.',true,'Chapter 1 — Money. Money is the medium of exchange: a good acquired not to be consumed, but to be traded for other goods…'),
('ai-superpowers','AI Superpowers','Kai-Fu Lee','Tech & AI',1300,300,'How the race between China and Silicon Valley is redefining artificial intelligence — and what it means for jobs and society in every country.',true,'Introduction — Twenty years ago, few people imagined that a machine would beat the world''s best Go player…'),
('atomic-habits','Atomic Habits','James Clear','Self-Help',1100,250,'Tiny changes, remarkable results. A practical framework for building good habits, breaking bad ones and getting 1% better every day.',true,'Chapter 1 — The Surprising Power of Atomic Habits. Habits are the compound interest of self-improvement…'),
('kite-runner','The Kite Runner','Khaled Hosseini','Literature',950,null,'A story of friendship, betrayal and redemption set across Kabul''s changing decades — one of the most beloved novels about Afghanistan.',true,null),
('rumi-masnavi','Selections from the Masnavi','Mawlana Jalaluddin Balkhi (Rumi)','Literature',1200,200,'Timeless verses from the poet of Balkh, with English translation alongside the original Dari/Persian text.',true,'Listen to the reed as it tells its tale, complaining of separations…'),
('lost-islamic-history','Lost Islamic History','Firas Alkhateeb','Islamic & History',1150,280,'Reclaiming Muslim civilisation from the past — the scholars, empires and ideas from Andalusia to Khorasan that shaped the world.',true,'Chapter 1 — Arabia Before Islam…'),
('rich-dad','Rich Dad Poor Dad','Robert T. Kiyosaki','Crypto & Finance',900,200,'What the rich teach their kids about money that the poor and middle class do not — the classic primer on assets, liabilities and financial freedom.',false,'Lesson 1 — The Rich Don''t Work for Money…'),
('clean-code','Clean Code','Robert C. Martin','Tech & AI',null,400,'A handbook of agile software craftsmanship. Learn to write code that is readable, maintainable and built to last.',true,'Chapter 1 — Clean Code. You are reading this book for two reasons: you are a programmer, and you want to be a better one…');
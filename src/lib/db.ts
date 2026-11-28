import { supabase } from "@/integrations/supabase/client";
import { normalizeCategory, type Book } from "./books";
import { getStoredReferral } from "./referral";

type Row = {
  id: string; title: string; author: string; category: string;
  hard_price: number | null; soft_price: number | null; cover_url: string;
  description: string; in_stock: boolean; pdf_link: string; sample_pages: string | null;
};

const fromRow = (r: Row): Book => ({
  id: r.id, title: r.title, author: r.author, category: normalizeCategory(r.category),
  hardPrice: r.hard_price == null ? null : Number(r.hard_price),
  softPrice: r.soft_price == null ? null : Number(r.soft_price),
  coverUrl: r.cover_url, description: r.description, inStock: r.in_stock,
  pdfLink: r.pdf_link, ...(r.sample_pages ? { samplePages: r.sample_pages } : {}),
});

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase.from("books")
    .select("id,title,author,category,hard_price,soft_price,cover_url,description,in_stock,sample_pages")
    .order("created_at", { ascending: true });
  if (error) throw error;
  const { data: links } = await supabase.rpc("book_pdf_links");
  const map = new Map((links ?? []).map((l: { id: string; pdf_link: string }) => [l.id, l.pdf_link]));
  return (data as Omit<Row, "pdf_link">[]).map((r) => fromRow({ ...r, pdf_link: map.get(r.id) ?? "" }));
}

export async function upsertBook(b: Book) {
  const { error } = await supabase.from("books").upsert({
    id: b.id, title: b.title, author: b.author, category: b.category,
    hard_price: b.hardPrice, soft_price: b.softPrice, cover_url: b.coverUrl,
    description: b.description, in_stock: b.inStock, pdf_link: b.pdfLink,
    sample_pages: b.samplePages ?? null,
  });
  if (error) throw error;
}

export async function removeBook(id: string) {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

export interface OrderInput {
  customer_name: string; phone: string; city?: string; address?: string;
  payment_method?: string; items: { book_id: string; title: string; format: string; qty: number; price: number }[];
  total_afn: number;
}

export async function recordOrder(o: OrderInput) {
  const { data: { session } } = await supabase.auth.getSession();
  const ref = getStoredReferral();
  const payload = { ...o, user_id: session?.user.id ?? null, ...(ref ? { referral_code: ref } : {}) };
  const { error } = await supabase.from("orders").insert(payload);
  if (error) console.error("Order not saved", error);
}

export interface Profile { id: string; full_name: string; phone: string; city: string; address: string }

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("id,full_name,phone,city,address").eq("id", user.id).maybeSingle();
  return data ?? { id: user.id, full_name: "", phone: "", city: "Kabul", address: "" };
}

export async function saveMyProfile(p: Profile) {
  const { error } = await supabase.from("profiles").upsert(p);
  if (error) throw error;
}

export async function fetchMyOrders() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

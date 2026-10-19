import { supabase } from "@/integrations/supabase/client";
import type { Book, Category } from "./books";

type Row = {
  id: string; title: string; author: string; category: string;
  hard_price: number | null; soft_price: number | null; cover_url: string;
  description: string; in_stock: boolean; pdf_link: string; sample_pages: string | null;
};

const fromRow = (r: Row): Book => ({
  id: r.id, title: r.title, author: r.author, category: r.category as Category,
  hardPrice: r.hard_price == null ? null : Number(r.hard_price),
  softPrice: r.soft_price == null ? null : Number(r.soft_price),
  coverUrl: r.cover_url, description: r.description, inStock: r.in_stock,
  pdfLink: r.pdf_link, ...(r.sample_pages ? { samplePages: r.sample_pages } : {}),
});

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase.from("books").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data as Row[]).map(fromRow);
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
  payment_method?: string; items: { title: string; format: string; qty: number; price: number }[];
  total_afn: number;
}

export async function recordOrder(o: OrderInput) {
  const { error } = await supabase.from("orders").insert(o);
  if (error) console.error("Order not saved", error);
}

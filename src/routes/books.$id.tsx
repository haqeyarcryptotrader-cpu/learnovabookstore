import { createFileRoute, Link } from "@tanstack/react-router";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useState } from "react";
import { ArrowLeft, BookOpen, Download, FileDown, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { CITIES, PAYMENT_DETAILS, fmtAfn, fmtUsd, priceFor, waLink, type Format } from "@/lib/books";
import { recordOrder } from "@/lib/db";
import { useStore } from "@/lib/store";
import { BookCover } from "@/components/BookCover";
import { FormatBadges } from "@/components/FormatBadges";

export const Route = createFileRoute("/books/$id")({
  head: () => ({
    meta: [
      { title: "Book details — Learnova Books Store" },
      { name: "description", content: "Choose hard copy delivery or an instant PDF soft copy at Learnova Books Store." },
      { property: "og:title", content: "Book details — Learnova Books Store" },
      { property: "og:description", content: "Hard copy delivery across Afghanistan or instant PDF download." },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { id } = Route.useParams();
  const { books, addToCart, setCartOpen } = useStore();
  const book = books.find((b) => b.id === id);
  const [format, setFormat] = useState<Format | null>(null);
  const [preview, setPreview] = useState(false);

  if (!book) {
    return (
      <div className="py-24 text-center">
        <p className="text-muted-foreground">This book isn't available.</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">Back to the store</Link>
      </div>
    );
  }

  const hardOk = book.hardPrice != null && book.inStock;
  const softOk = book.softPrice != null;
  const isFree = book.softPrice === 0;
  const f: Format = format ?? (hardOk ? "hard" : "soft");
  const price = priceFor(book, f);

  const add = () => {
    addToCart(book.id, f);
    toast.success(`${book.title} (${f === "hard" ? "Hard Copy" : "PDF"}) added to cart`);
    setCartOpen(true);
  };

  const downloadSample = () => {
    const blob = new Blob([`${book.title}\nby ${book.author}\n\nSAMPLE\n\n${book.samplePages ?? book.description}\n\n— Learnova Books Store`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${book.id}-sample.txt`;
    a.click();
  };

  const receiptMsg = `Assalamu Alaikum! I paid for the Soft Copy (PDF) of "${book.title}" — ${price != null ? `${fmtAfn(price)} (${fmtUsd(price)})` : ""}. Attaching my payment receipt for verification.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All books</Link>
      <div className="grid gap-10 md:grid-cols-[minmax(0,340px)_1fr]">
        <div className="mx-auto w-full max-w-[300px] md:max-w-none"><BookCover book={book} /></div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{book.category}</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">{book.title}</h1>
          <p className="mt-1 text-muted-foreground">by {book.author}</p>
          <div className="mt-4"><FormatBadges book={book} /></div>
          <p className="mt-6 leading-relaxed">{book.description}</p>

          <h2 className="mt-8 text-sm font-semibold">Choose a format</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <FormatOption active={f === "hard"} disabled={!hardOk} onClick={() => setFormat("hard")} icon={<BookOpen className="h-5 w-5" />}
              title="Hard Copy" note={book.hardPrice == null ? "Not available" : !book.inStock ? "Out of stock" : "Physical delivery · Cash on delivery"} price={book.hardPrice} />
            <FormatOption active={f === "soft"} disabled={!softOk} onClick={() => setFormat("soft")} icon={<FileDown className="h-5 w-5" />}
              title="Soft Copy (PDF)" note={!softOk ? "Not available" : isFree ? "Free — download instantly" : "Digital delivery after payment"} price={isFree ? null : book.softPrice} />
          </div>

          {price != null && (hardOk || softOk) && !(f === "soft" && isFree) && (
            <button onClick={add} className="mt-6 w-full rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground sm:w-auto">
              Add to cart · {fmtAfn(price)} / {fmtUsd(price)}
            </button>
          )}

          {f === "hard" && hardOk && <QuickHardOrder title={book.title} price={book.hardPrice!} />}

          {f === "soft" && isFree && (
            <div className="mt-8 space-y-3 rounded-lg border bg-card p-5">
              <h3 className="font-semibold">Free PDF · وړیا پي ډي اف</h3>
              <p className="text-sm text-muted-foreground">This book is free. Download it now — no payment needed.</p>
              {book.pdfLink ? (
                <a href={book.pdfLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  <Download className="h-4 w-4" /> Download free PDF · ډاونلوډ
                </a>
              ) : (
                <p className="text-sm text-destructive">The PDF file isn't uploaded yet.</p>
              )}
            </div>
          )}

          {f === "soft" && softOk && !isFree && (
            <div className="mt-8 space-y-4 rounded-lg border bg-card p-5">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setPreview((p) => !p)} className="rounded-md border px-4 py-2 text-sm">{preview ? "Hide preview" : "Read sample"}</button>
                <button onClick={downloadSample} className="inline-flex items-center gap-1 rounded-md border px-4 py-2 text-sm"><Download className="h-4 w-4" /> Download sample</button>
              </div>
              {preview && <blockquote className="border-l-2 border-primary pl-4 font-display italic text-muted-foreground">{book.samplePages ?? book.description}</blockquote>}
              <div>
                <h3 className="font-semibold">How to pay for the PDF</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  <li>• {PAYMENT_DETAILS.hesabpay}</li>
                  <li>• {PAYMENT_DETAILS.hawala}</li>
                  <li>• {PAYMENT_DETAILS.usdt}</li>
                </ul>
                <p className="mt-2 text-sm">After paying, send your receipt — we deliver the PDF to your WhatsApp right away.</p>
              </div>
              <a href={waLink(receiptMsg)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-whatsapp px-4 py-2.5 text-sm font-medium text-whatsapp-foreground">
                <MessageCircle className="h-4 w-4" /> Verify receipt on WhatsApp
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormatOption(p: { active: boolean; disabled: boolean; onClick: () => void; icon: React.ReactNode; title: string; note: string; price: number | null }) {
  return (
    <button disabled={p.disabled} onClick={p.onClick}
      className={`rounded-lg border-2 p-4 text-left transition ${p.active && !p.disabled ? "border-primary bg-primary/5" : "border-border"} ${p.disabled ? "opacity-50" : "hover:border-primary/60"}`}>
      <div className="flex items-center gap-2 font-medium">{p.icon}{p.title}</div>
      {p.price != null && <p className="mt-2 text-lg font-semibold">{fmtAfn(p.price)} <span className="text-sm font-normal text-muted-foreground">{fmtUsd(p.price)}</span></p>}
      <p className="mt-1 text-xs text-muted-foreground">{p.note}</p>
    </button>
  );
}




const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().regex(/^\+?[0-9 ]{9,15}$/, "Enter a valid WhatsApp/phone number"),
  city: z.string().min(1),
  address: z.string().trim().min(5, "Enter a delivery address").max(300),
});

function QuickHardOrder({ title, price }: { title: string; price: number }) {
  const [v, setV] = usePersistentState("lnv-quick", { name: "", phone: "", city: "Kabul", address: "" });
  const [err, setErr] = useState("");
  const field = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  const send = () => {
    const r = schema.safeParse(v);
    if (!r.success) { setErr(r.error.issues[0]?.message ?? "Check the form"); return; }
    setErr("");
    const msg = `Assalamu Alaikum Learnova Books! I want to order:\n\nBook: ${title}\nFormat: Hard Copy\nPrice: ${fmtAfn(price)} (${fmtUsd(price)})\nPayment: Cash on Delivery\n\nName: ${v.name}\nWhatsApp/Phone: ${v.phone}\nCity/Province: ${v.city}\nDelivery Address: ${v.address}`;
    window.open(waLink(msg), "_blank");
    void recordOrder({ customer_name: v.name, phone: v.phone, city: v.city, address: v.address, payment_method: "Cash on Delivery", items: [{ title, format: "hard", qty: 1, price }], total_afn: price });
  };
  return (
    <div className="mt-8 space-y-3 rounded-lg border bg-card p-5">
      <h3 className="font-semibold">Quick order — Cash on Delivery</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={field} placeholder="Full name" value={v.name} maxLength={80} onChange={(e) => setV({ ...v, name: e.target.value })} />
        <input className={field} placeholder="WhatsApp / Phone" value={v.phone} maxLength={20} onChange={(e) => setV({ ...v, phone: e.target.value })} />
        <select className={field} value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })}>{CITIES.map((c) => <option key={c}>{c}</option>)}</select>
        <input className={field} placeholder="Delivery address" value={v.address} maxLength={300} onChange={(e) => setV({ ...v, address: e.target.value })} />
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <button onClick={send} className="inline-flex items-center gap-2 rounded-md bg-whatsapp px-4 py-2.5 text-sm font-medium text-whatsapp-foreground">
        <MessageCircle className="h-4 w-4" /> Order via WhatsApp
      </button>
    </div>
  );
}

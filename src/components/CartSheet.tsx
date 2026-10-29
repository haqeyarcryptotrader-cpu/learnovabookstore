import { useState } from "react";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { z } from "zod";
import { CITIES, PAYMENT_DETAILS, fmtAfn, fmtUsd, priceFor, waLink } from "@/lib/books";
import { useStore } from "@/lib/store";
import { recordOrder } from "@/lib/db";
import { BookCover } from "./BookCover";

const hardSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().regex(/^\+?[0-9 ]{9,15}$/, "Enter a valid WhatsApp/phone number"),
  city: z.string().min(1, "Choose a city"),
  address: z.string().trim().min(5, "Enter a delivery address").max(300),
});
const softSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().regex(/^\+?[0-9 ]{9,15}$/, "Enter a valid WhatsApp/phone number"),
});

export function CartSheet() {
  const { cart, books, cartOpen, setCartOpen, setQty, clearCart } = useStore();
  const [checkout, setCheckout] = useState(false);
  const [form, setForm] = usePersistentState("lnv-buyer", { name: "", phone: "", city: "Kabul", address: "", pay: "HesabPay" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const lines = cart
    .map((i) => {
      const book = books.find((b) => b.id === i.bookId);
      const price = book ? priceFor(book, i.format) : null;
      return book && price != null ? { ...i, book, price } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const hasHard = lines.some((l) => l.format === "hard");
  const hasSoft = lines.some((l) => l.format === "soft");

  if (!cartOpen) {
    return lines.length > 0 ? (
      <button onClick={() => setCartOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-book">
        <ShoppingBag className="h-4 w-4" /> {lines.length} · {fmtAfn(total)}
      </button>
    ) : null;
  }

  const submit = () => {
    const r = (hasHard ? hardSchema : softSchema).safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return;
    }
    setErrors({});
    const msg = [
      "Assalamu Alaikum Learnova Books! New order:",
      "",
      ...lines.map((l) => `• ${l.book.title} — ${l.format === "hard" ? "Hard Copy" : "Soft Copy (PDF)"} × ${l.qty} = ${fmtAfn(l.price * l.qty)} (${fmtUsd(l.price * l.qty)})`),
      "",
      `Total: ${fmtAfn(total)} (${fmtUsd(total)})`,
      "",
      `Name: ${form.name}`,
      `WhatsApp/Phone: ${form.phone}`,
      ...(hasHard ? [`City/Province: ${form.city}`, `Delivery Address: ${form.address}`, "Payment (hard copies): Cash on Delivery"] : []),
      ...(hasSoft ? [`Payment (soft copies): ${form.pay} — I will send the receipt here for verification.`] : []),
    ].join("\n");
    window.open(waLink(msg), "_blank");
    void recordOrder({
      customer_name: form.name, phone: form.phone,
      city: hasHard ? form.city : "", address: hasHard ? form.address : "",
      payment_method: [hasHard ? "Cash on Delivery" : "", hasSoft ? form.pay : ""].filter(Boolean).join(" + "),
      items: lines.map((l) => ({ title: l.book.title, format: l.format, qty: l.qty, price: l.price })),
      total_afn: total,
    });
    clearCart();
    setCheckout(false);
    setCartOpen(false);
  };

  const field = "w-full rounded-md border bg-background px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-foreground/40" onClick={() => setCartOpen(false)}>
      <aside className="flex h-full w-full max-w-md flex-col bg-background shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-display text-xl">{checkout ? "Checkout" : "Your cart"}</h2>
          <button onClick={() => setCartOpen(false)} aria-label="Close" className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {lines.length === 0 && <p className="py-16 text-center text-muted-foreground">Your cart is empty.</p>}

          {!checkout && lines.map((l) => (
            <div key={l.bookId + l.format} className="flex gap-3 border-b py-3">
              <BookCover book={l.book} className="w-14 shrink-0 p-1 [&_h3]:text-[8px] [&_span]:hidden" />
              <div className="flex-1">
                <p className="font-medium leading-tight">{l.book.title}</p>
                <p className="text-xs text-muted-foreground">{l.format === "hard" ? "Hard Copy · Cash on delivery" : "Soft Copy · PDF"}</p>
                <p className="mt-1 text-sm">{fmtAfn(l.price)} <span className="text-muted-foreground">({fmtUsd(l.price)})</span></p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => setQty(l.bookId, l.format, 0)} aria-label="Remove" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                {l.format === "hard" && (
                  <div className="flex items-center gap-2 rounded-md border">
                    <button className="p-1" onClick={() => setQty(l.bookId, l.format, l.qty - 1)} aria-label="Decrease"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm">{l.qty}</span>
                    <button className="p-1" onClick={() => setQty(l.bookId, l.format, l.qty + 1)} aria-label="Increase"><Plus className="h-3 w-3" /></button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {checkout && (
            <div className="space-y-3">
              <input className={field} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} />
              {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
              <input className={field} placeholder="WhatsApp / Phone (e.g. +93 7xx xxx xxx)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
              {errors["phone"] && <p className="text-xs text-destructive">{errors["phone"]}</p>}
              {hasHard && (
                <div className="space-y-3 rounded-lg border p-3">
                  <p className="text-sm font-medium">Hard copy delivery · Cash on Delivery</p>
                  <select className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <textarea className={field} rows={2} placeholder="Delivery address (district, street, landmark)" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={300} />
                  {errors["address"] && <p className="text-xs text-destructive">{errors["address"]}</p>}
                </div>
              )}
              {hasSoft && (
                <div className="space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">Soft copy payment · PDF sent after verification</p>
                  {(["HesabPay", "Hawala / Sarai Shahzada", "USDT crypto"] as const).map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={form.pay === p} onChange={() => setForm({ ...form, pay: p })} /> {p}
                    </label>
                  ))}
                  <p className="rounded bg-muted p-2 text-xs text-muted-foreground">
                    {form.pay === "HesabPay" ? PAYMENT_DETAILS.hesabpay : form.pay === "USDT crypto" ? PAYMENT_DETAILS.usdt : PAYMENT_DETAILS.hawala}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="space-y-3 border-t p-4">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>{fmtAfn(total)} <span className="text-sm text-muted-foreground">/ {fmtUsd(total)}</span></span>
            </div>
            {checkout ? (
              <div className="flex gap-2">
                <button onClick={() => setCheckout(false)} className="rounded-md border px-4 py-2.5 text-sm">Back</button>
                <button onClick={submit} className="flex-1 rounded-md bg-whatsapp px-4 py-2.5 text-sm font-medium text-whatsapp-foreground">Send order via WhatsApp</button>
              </div>
            ) : (
              <button onClick={() => setCheckout(true)} className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">Checkout</button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

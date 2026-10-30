import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Wallet, MapPin } from "lucide-react";
import { PAYMENT_DETAILS, waLink } from "@/lib/books";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact & FAQ — Learnova Books Store" },
      { name: "description", content: "Contact Learnova Books on WhatsApp 0765238918, see payment options and answers to common questions." },
      { property: "og:title", content: "Contact Learnova Books Store" },
      { property: "og:description", content: "WhatsApp, payment options and FAQ for Learnova Books." },
    ],
  }),
  component: Contact,
});

const faq = [
  { q: "How do I get a PDF book? · پي ډي اف څنګه ترلاسه کړم؟", a: "Pay with HesabPay or Binance, send the receipt on WhatsApp, and we send the PDF to you." },
  { q: "How is a hard copy delivered? · چاپي کتاب څنګه رسېږي؟", a: "Place the order, we confirm on WhatsApp, and you pay cash when the book arrives." },
  { q: "Which cities do you deliver to? · کومو ښارونو ته؟", a: "Kabul, Herat, Mazar-i-Sharif, Kandahar, Jalalabad, Kunduz, Ghazni, Bamyan, Khost and more — ask us." },
];

function Contact() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm text-primary">Contact · اړیکه</p>
      <h1 className="mt-2 font-display text-4xl">We're here to help</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <a href={waLink("Salam Learnova Books!")} target="_blank" rel="noreferrer" className="rounded-xl border bg-card p-5 hover:border-primary">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-semibold">WhatsApp</h2>
          <p className="text-sm text-muted-foreground">0765 238 918</p>
        </a>
        <div className="rounded-xl border bg-card p-5">
          <Wallet className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-semibold">Payments</h2>
          <p className="break-all text-xs text-muted-foreground">{PAYMENT_DETAILS.hesabpay}<br />{PAYMENT_DETAILS.usdt}</p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <MapPin className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-semibold">Location</h2>
          <p className="text-sm text-muted-foreground">Kabul, Afghanistan</p>
        </div>
      </div>
      <h2 className="mt-12 font-display text-2xl">Questions · پوښتنې</h2>
      <div className="mt-4 space-y-3">
        {faq.map((f) => (
          <details key={f.q} className="rounded-lg border bg-card p-4">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Truck, FileDown, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Learnova Books Store" },
      { name: "description", content: "Learnova Books brings tech, crypto, self-help, Islamic and literature books to Afghanistan as hard copies and PDFs." },
      { property: "og:title", content: "About Learnova Books Store" },
      { property: "og:description", content: "An Afghan online bookstore for hard copies and instant PDF soft copies." },
    ],
  }),
  component: About,
});

const points = [
  { icon: BookOpen, en: "Carefully chosen books", ps: "غوره ټاکل شوي کتابونه", text: "Tech & AI, Crypto & Finance, Self-Help, Islamic & History and Literature." },
  { icon: Truck, en: "Hard copies nationwide", ps: "چاپي کتابونه ټول هېواد ته", text: "Cash on delivery in Kabul, Herat, Mazar, Kandahar, Jalalabad and more." },
  { icon: FileDown, en: "Instant PDF copies", ps: "سمدستي پي ډي اف", text: "Pay with HesabPay or Binance and receive your PDF on WhatsApp." },
  { icon: ShieldCheck, en: "Trusted & personal", ps: "باوري او نږدې خدمت", text: "Every order is confirmed personally by our team on WhatsApp." },
];

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="text-sm text-primary">About us · زموږ په اړه</p>
      <h1 className="mt-2 font-display text-4xl">Books for every Afghan reader</h1>
      <p dir="rtl" className="mt-3 font-[Vazirmatn] text-lg text-muted-foreground">لیرنووا — د افغانستان د لوستونکو لپاره آنلاین کتاب پلورنځی</p>
      <p className="mt-6 leading-relaxed text-muted-foreground">
        Learnova Books Store was started in Kabul to make good books easy to get. Order a printed copy delivered to your door,
        or buy a digital PDF and start reading in minutes — wherever you are.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {points.map((p) => (
          <div key={p.en} className="rounded-xl border bg-card p-5">
            <p.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-semibold">{p.en}</h2>
            <p dir="rtl" className="text-sm text-muted-foreground">{p.ps}</p>
            <p className="mt-2 text-sm text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </div>
      <Link to="/" className="mt-10 inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Browse books</Link>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, fmtAfn, fmtUsd, type Book } from "@/lib/books";
import { useStore } from "@/lib/store";
import { BookCover } from "@/components/BookCover";
import { FormatBadges } from "@/components/FormatBadges";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Learnova Books Store — Afghan Online Bookstore" },
      { name: "description", content: "Buy hard copy books delivered across Afghanistan or instant PDF soft copies. Tech, crypto, self-help, Islamic history and literature." },
      { property: "og:title", content: "Learnova Books Store — Afghan Online Bookstore" },
      { property: "og:description", content: "Hard copies delivered to Kabul, Herat, Mazar and beyond — or instant PDF soft copies." },
    ],
  }),
  component: Index,
});

const WELCOME = {
  en: { title: "Welcome to Learnova Books", sub: "Hard copies delivered across Afghanistan · Instant PDF soft copies", dir: "ltr" },
  fa: { title: "به کتاب‌فروشی لرنووا خوش آمدید", sub: "ارسال کتاب چاپی به سراسر افغانستان · نسخه دیجیتال PDF فوری", dir: "rtl" },
  ps: { title: "لرنووا کتاب پلورنځي ته ښه راغلاست", sub: "چاپي کتابونه په ټول افغانستان کې · فوري PDF ډیجیټل نسخه", dir: "rtl" },
} as const;

function Index() {
  const { books, lang } = useStore();
  const [q, setQ] = usePersistentState("lnv-q", "");
  const [cat, setCat] = usePersistentState<string>("lnv-cat", "All");
  const [fmt, setFmt] = usePersistentState<"all" | "hard" | "soft">("lnv-fmt", "all");
  const w = WELCOME[lang];

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return books.filter(
      (b) =>
        (cat === "All" || b.category === cat) &&
        (fmt === "all" || (fmt === "hard" ? b.hardPrice != null : b.softPrice != null)) &&
        (!s || b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s)),
    );
  }, [books, q, cat, fmt]);

  return (
    <div>
      <section className="hero-surface border-b">
        <div dir={w.dir} className={`mx-auto max-w-6xl px-4 py-14 sm:py-20 ${w.dir === "rtl" ? "font-rtl" : ""}`}>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-primary">Learnova Books Store</p>
          <h1 className="max-w-2xl font-display text-4xl leading-tight sm:text-6xl">{w.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">{w.sub}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or author…"
              className="w-full rounded-md border bg-card py-2.5 pl-9 pr-3 text-sm" />
          </label>
          <div className="flex rounded-md border bg-card p-0.5 text-sm">
            {(["all", "hard", "soft"] as const).map((f) => (
              <button key={f} onClick={() => setFmt(f)} className={`flex-1 rounded px-3 py-2 ${fmt === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {f === "all" ? "All" : f === "hard" ? "Hard Copy" : "Soft Copy"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
        {list.length === 0 && <p className="py-16 text-center text-muted-foreground">No books match your search.</p>}
      </section>
    </div>
  );
}

function BookCard({ book }: { book: Book }) {
  const prices = [book.hardPrice, book.softPrice].filter((p): p is number => p != null);
  const from = prices.length ? Math.min(...prices) : 0;
  return (
    <Link to="/books/$id" params={{ id: book.id }} className="group block">
      <div className="transition-transform group-hover:-translate-y-1">
        <BookCover book={book} />
      </div>
      <div className="mt-3 space-y-1.5">
        <h3 className="font-display text-base leading-snug">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <p className="text-sm font-medium">from {fmtAfn(from)} <span className="font-normal text-muted-foreground">· {fmtUsd(from)}</span></p>
        <FormatBadges book={book} />
      </div>
    </Link>
  );
}

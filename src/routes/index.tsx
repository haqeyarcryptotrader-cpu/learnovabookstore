import { createFileRoute, Link } from "@tanstack/react-router";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Truck,
  Zap,
  ShieldCheck,
  Gift,
  ArrowLeft,
  ArrowRight,
  Headphones,
  Flame,
  BookOpen,
  ShoppingBag,
  MessageCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES, fmtAfn, fmtUsd, normalizeCategory, type Book } from "@/lib/books";
import { useStore } from "@/lib/store";
import { BookCover } from "@/components/BookCover";
import { FormatBadges } from "@/components/FormatBadges";
import { PostBar } from "@/components/PostComposer";
import { QuickLinks } from "@/components/QuickLinks";
import { Stars, useRatingSummaries } from "@/components/BookReviews";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Learnova Books Store — Afghan Online Bookstore" },
      { name: "description", content: "Buy hard copy books delivered across Afghanistan or instant PDF soft copies. Tech, crypto, self-help, Islamic history and literature." },
      { property: "og:title", content: "Learnova Books Store — Afghan Online Bookstore" },
      { property: "og:description", content: "Hard copies delivered to Kabul, Herat, Mazar and beyond — or instant PDF soft copies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

/* ───────────────────────── texts (English · Dari · Pashto) ───────────────────────── */

const T = {
  en: {
    dir: "ltr",
    badge: "Afghan Online Bookstore",
    title: "Welcome to Learnova Books",
    sub: "Hard copies delivered across Afghanistan · Instant PDF soft copies",
    cta1: "Browse books",
    cta2: "My library",
    stats: ["Books", "Instant PDF", "Friend discount"],
    features: [
      ["Delivery across Afghanistan", "Hard copies to Kabul, Herat, Mazar and more"],
      ["Instant PDF copy", "Read on the site right after payment"],
      ["Protected reading", "Your book opens only in your account"],
      ["5% discount", "Invite a friend and save on your next book"],
    ],
    featuredTitle: "Top & new books",
    catalogTitle: "All books",
    stepsTitle: "How to get a book",
    steps: [
      ["Choose a book", "Pick the hard copy or the PDF version."],
      ["Pay & confirm", "Pay the price and send your account email to the admin on WhatsApp."],
      ["Start reading", "The book opens in your library, ready to read."],
    ],
    readerTitle: "A reading experience better than paper",
    readerDesc: "A 3D book with real page turns, calming study sounds, notes and a daily reading goal.",
    readerPoints: ["3D book with realistic page turning", "Rain and calm music while you read", "Daily goal, streaks and notes"],
    readerCta: "Go to my library",
    refTitle: "Invite a friend, get 5% off",
    refDesc: "Every book in the reader has a share button for your friends.",
    refCta: "Browse books",
  },
  fa: {
    dir: "rtl",
    badge: "کتاب‌فروشی آنلاین افغانستان",
    title: "به کتاب‌فروشی لرنووا خوش آمدید",
    sub: "ارسال کتاب چاپی به سراسر افغانستان · نسخه دیجیتال PDF فوری",
    cta1: "مشاهده کتاب‌ها",
    cta2: "کتابخانه من",
    stats: ["کتاب", "PDF فوری", "تخفیف دوستان"],
    features: [
      ["ارسال به سراسر افغانستان", "کتاب چاپی به کابل، هرات، مزار و سایر ولایات"],
      ["نسخه PDF فوری", "بعد از پرداخت، همان لحظه در سایت بخوانید"],
      ["مطالعه امن", "کتاب فقط در حساب شما باز می‌شود"],
      ["۵٪ تخفیف", "دوستان را دعوت کنید و تخفیف بگیرید"],
    ],
    featuredTitle: "کتاب‌های برگزیده و تازه",
    catalogTitle: "همه کتاب‌ها",
    stepsTitle: "چگونه کتاب بگیریم؟",
    steps: [
      ["کتاب را انتخاب کنید", "نسخه چاپی یا PDF را برگزینید."],
      ["پرداخت و تأیید", "قیمت را بپردازید و ایمیل حساب خود را از طریق واتساپ برای ادمین بفرستید."],
      ["مطالعه را شروع کنید", "کتاب در کتابخانه شما باز می‌شود."],
    ],
    readerTitle: "تجربه‌ای از مطالعه که از کتاب کاغذی هم بهتر است",
    readerDesc: "کتاب سه‌بعدی با ورق زدن واقعی، صداهای آرامش‌بخش، یادداشت و هدف روزانه.",
    readerPoints: ["کتاب سه‌بعدی و ورق زدن واقعی", "صدای باران و موسیقی آرام هنگام مطالعه", "هدف روزانه، روزهای پیاپی و یادداشت"],
    readerCta: "رفتن به کتابخانه",
    refTitle: "دوستان را دعوت کنید، ۵٪ تخفیف بگیرید",
    refDesc: "در خواننده کتاب، برای هر کتاب دکمه اشتراک‌گذاری وجود دارد.",
    refCta: "مشاهده کتاب‌ها",
  },
  ps: {
    dir: "rtl",
    badge: "د افغانستان آنلاین کتاب پلورنځی",
    title: "لرنووا کتاب پلورنځي ته ښه راغلاست",
    sub: "چاپي کتابونه په ټول افغانستان کې · فوري PDF ډیجیټل نسخه",
    cta1: "کتابونه وګورئ",
    cta2: "زما کتابتون",
    stats: ["کتابونه", "فوري PDF", "د ملګري تخفیف"],
    features: [
      ["په ټول افغانستان کې رسول", "چاپي کتابونه کابل، هرات، مزار او نورو ولایتونو ته"],
      ["فوري PDF نسخه", "د تادیې وروسته سمدستي په سایټ کې ولولئ"],
      ["خوندي لوستل", "کتاب یوازې ستاسو په اکاونټ کې خلاصېږي"],
      ["۵٪ تخفیف", "ملګري ته بلنه ورکړئ او تخفیف ترلاسه کړئ"],
    ],
    featuredTitle: "غوره او نوي کتابونه",
    catalogTitle: "ټول کتابونه",
    stepsTitle: "څنګه کتاب ترلاسه کړو؟",
    steps: [
      ["کتاب وټاکئ", "چاپي یا PDF نسخه غوره کړئ."],
      ["تادیه او تایید", "بیه تادیه کړئ او خپل اکاونټ ایمیل د واټساپ له لارې اډمین ته ولېږئ."],
      ["لوستل پیل کړئ", "کتاب ستاسو په کتابتون کې خلاصېږي."],
    ],
    readerTitle: "د لوستلو داسې تجربه چې له کاغذي کتاب هم ښه ده",
    readerDesc: "درې اړخیز کتاب د پاڼو واقعي اړولو سره، د مطالعې آرامه آوازونه، یادښتونه او ورځنی هدف.",
    readerPoints: ["3D کتاب او د پاڼو واقعي اړول", "د لوستلو پر مهال د باران او ارامې موسیقۍ آوازونه", "ورځنی هدف، پرله پسې ورځې او یادښتونه"],
    readerCta: "کتابتون ته ورشئ",
    refTitle: "ملګري راوبلئ، ۵٪ تخفیف ترلاسه کړئ",
    refDesc: "د لوستونکي په وسیله کې د هر کتاب لپاره د شېرولو تڼۍ شته.",
    refCta: "کتابونه وګورئ",
  },
} as const;

const FEATURE_ICONS: LucideIcon[] = [Truck, Zap, ShieldCheck, Gift];
const STEP_ICONS: LucideIcon[] = [ShoppingBag, MessageCircle, BookOpen];

/* ───────────────────────── small helpers ───────────────────────── */

/** fades a block in when it scrolls into view */
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(24px)",
        transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* three covers floating in 3D */
const SLOTS = [
  { left: "0%", top: "16%", rot: -20, z: 1, dur: 7, delay: 0 },
  { left: "24%", top: "0%", rot: 0, z: 3, dur: 6, delay: 0.8 },
  { left: "48%", top: "18%", rot: 20, z: 2, dur: 8, delay: 1.6 },
];

function HeroBooks({ books }: { books: Book[] }) {
  const slots = books.length >= 3 ? SLOTS : books.length === 2 ? [SLOTS[0], SLOTS[2]] : [SLOTS[1]];
  return (
    <div dir="ltr" className="relative mx-auto h-[300px] w-[270px] sm:h-[380px] sm:w-[340px]" style={{ perspective: 1100 }}>
      <div
        className="absolute inset-x-6 bottom-0 h-10 rounded-[50%] blur-xl"
        style={{ background: "rgba(0,0,0,0.55)" }}
      />
      {books.slice(0, slots.length).map((b, i) => {
        const p = slots[i];
        return (
          <div
            key={b.id}
            className="lnv-float absolute w-[52%]"
            style={{
              left: p.left,
              top: p.top,
              zIndex: p.z,
              transform: `rotateY(${p.rot}deg) rotateZ(${p.rot / 4}deg)`,
              filter: "drop-shadow(0 26px 28px rgba(0,0,0,0.5))",
              animation: `lnv-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
            }}
          >
            <BookCover book={b} />
          </div>
        );
      })}
    </div>
  );
}

/* a small open book drawn with CSS, for the reader showcase */
function OpenBook() {
  const lines =
    "repeating-linear-gradient(180deg, transparent 0 14px, rgba(120,113,108,0.35) 14px 15px)";
  return (
    <div dir="ltr" className="relative mx-auto flex h-52 w-72 items-center justify-center" style={{ perspective: 900 }}>
      <div
        className="lnv-float h-44 w-32 rounded-l-md border border-amber-200/60 shadow-2xl"
        style={{
          background: `${lines}, #fffbeb`,
          backgroundOrigin: "content-box",
          padding: "18px 14px",
          transform: "rotateY(18deg)",
          transformOrigin: "right center",
          animation: "lnv-float 6s ease-in-out infinite",
        }}
      />
      <div
        className="lnv-float h-44 w-32 rounded-r-md border border-amber-200/60 shadow-2xl"
        style={{
          background: `${lines}, #fffbeb`,
          backgroundOrigin: "content-box",
          padding: "18px 14px",
          transform: "rotateY(-18deg)",
          transformOrigin: "left center",
          animation: "lnv-float 6s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-44 w-3 -translate-x-1/2 -translate-y-1/2"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.25), transparent, rgba(0,0,0,0.25))" }}
      />
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */

function Index() {
  const { books, lang } = useStore();
  const [q, setQ] = usePersistentState("lnv-q", "");
  const [savedCat, setCat] = usePersistentState<string>("lnv-cat", "All");
  const cat = savedCat === "All" ? "All" : normalizeCategory(savedCat);
  const [fmt, setFmt] = usePersistentState<"all" | "hard" | "soft">("lnv-fmt", "all");
  const w = T[lang];
  const Arrow = w.dir === "rtl" ? ArrowLeft : ArrowRight;
  const rtlFont = w.dir === "rtl" ? "font-rtl" : "";

  const ratings = useRatingSummaries();
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return books.filter(
      (b) =>
        (cat === "All" || b.category === cat) &&
        (fmt === "all" || (fmt === "hard" ? b.hardPrice != null : b.softPrice != null)) &&
        (!s || b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s)),
    );
  }, [books, q, cat, fmt]);

  const featured = useMemo(() => {
    const arr = [...books];
    arr.sort((a, b) => (ratings[b.id]?.avg ?? 0) - (ratings[a.id]?.avg ?? 0));
    return arr.slice(0, 8);
  }, [books, ratings]);

  return (
    <div>
      <style>{`
        @keyframes lnv-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -14px; } }
        @keyframes lnv-orb { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .85; transform: scale(1.12); } }
        @media (prefers-reduced-motion: reduce) { .lnv-float, .lnv-orb { animation: none !important; } }
      `}</style>

      {/* ── hero ── */}
      <section
        className="relative isolate overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #7c2d12 130%)" }}
      >
        <div
          className="lnv-orb absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "rgba(251,191,36,0.38)", animation: "lnv-orb 8s ease-in-out infinite" }}
        />
        <div
          className="lnv-orb absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "rgba(129,140,248,0.4)", animation: "lnv-orb 10s ease-in-out 1s infinite" }}
        />
        <div
          className="absolute inset-0 -z-10 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div
          dir={w.dir}
          className={`mx-auto grid max-w-6xl items-center gap-10 px-4 pb-24 pt-12 sm:pt-16 lg:grid-cols-2 ${rtlFont}`}
        >
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-amber-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {w.badge}
            </span>
            <h1
              className="mt-5 font-display text-4xl leading-[1.2] sm:text-6xl"
              style={{
                backgroundImage: "linear-gradient(90deg, #ffffff, #fde68a)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {w.title}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/75 sm:text-lg">{w.sub}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#books"
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-stone-900 shadow-lg shadow-amber-500/30 transition hover:scale-[1.03] hover:bg-amber-300"
              >
                {w.cta1}
                <Arrow className="h-4 w-4" />
              </a>
              <Link
                to="/library"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                {w.cta2}
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {[`${books.length}+`, "24/7", "5%"].map((v, i) => (
                <div key={i} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur">
                  <p className="text-lg font-bold text-amber-300">{v}</p>
                  <p className="text-[11px] text-white/70">{w.stats[i]}</p>
                </div>
              ))}
            </div>
          </div>

          {books.length > 0 && <HeroBooks books={books} />}
        </div>
      </section>

      {/* ── why Learnova ── */}
      <section dir={w.dir} className={`relative z-10 mx-auto -mt-12 max-w-6xl px-4 ${rtlFont}`}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {w.features.map(([title, desc], i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <Reveal key={i} delay={i * 80}>
                <div className="h-full rounded-2xl border bg-card p-4 shadow-lg">
                  <div
                    className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-white"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)" }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold leading-snug">{title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <PostBar className="mx-auto max-w-6xl px-4 pt-6" />
      <QuickLinks />

      {/* ── top & new books ── */}
      {featured.length > 0 && (
        <section dir={w.dir} className={`mx-auto max-w-6xl px-4 pt-10 ${rtlFont}`}>
          <Reveal>
            <h2 className="font-display text-2xl sm:text-3xl">{w.featuredTitle}</h2>
            <div className="mt-2 h-1 w-14 rounded-full bg-amber-400" />
          </Reveal>
          <div className="-mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-3" dir="ltr">
            {featured.map((b) => (
              <div key={b.id} className="w-36 shrink-0 snap-start sm:w-44">
                <BookCard book={b} rating={ratings[b.id]} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── all books: search, filters, grid ── */}
      <section id="books" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-10">
        <div dir={w.dir} className={`mb-5 ${rtlFont}`}>
          <h2 className="font-display text-2xl sm:text-3xl">{w.catalogTitle}</h2>
          <div className="mt-2 h-1 w-14 rounded-full bg-amber-400" />
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <label className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title or author…"
              className="w-full rounded-xl border bg-card py-2.5 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="flex rounded-xl border bg-card p-0.5 text-sm shadow-sm">
            {(["all", "hard", "soft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFmt(f)}
                className={`flex-1 rounded-lg px-3 py-2 transition ${fmt === f ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
              >
                {f === "all" ? "All" : f === "hard" ? "Hard Copy" : "Soft Copy"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${cat === c ? "border-primary bg-primary text-primary-foreground shadow" : "bg-card hover:bg-muted"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((b) => (
            <BookCard key={b.id} book={b} rating={ratings[b.id]} />
          ))}
        </div>
        {list.length === 0 && <p className="py-16 text-center text-muted-foreground">No books match your search.</p>}
      </section>

      {/* ── how it works ── */}
      <section dir={w.dir} className={`border-y bg-muted/40 ${rtlFont}`}>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Reveal>
            <h2 className="text-center font-display text-2xl sm:text-3xl">{w.stepsTitle}</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {w.steps.map(([title, desc], i) => {
              const Icon = STEP_ICONS[i];
              return (
                <Reveal key={i} delay={i * 120}>
                  <div className="relative h-full rounded-2xl border bg-card p-5 shadow-sm">
                    <span
                      className="absolute -top-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow"
                      style={{ background: "linear-gradient(135deg, #f59e0b, #ea580c)", insetInlineStart: "1rem" }}
                    >
                      {i + 1}
                    </span>
                    <Icon className="mb-3 h-7 w-7 text-primary" />
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── the reader showcase ── */}
      <section dir={w.dir} className={`mx-auto max-w-6xl px-4 py-12 ${rtlFont}`}>
        <Reveal>
          <div
            className="grid items-center gap-8 overflow-hidden rounded-3xl p-6 text-white shadow-xl sm:p-10 md:grid-cols-2"
            style={{ background: "linear-gradient(135deg, #1c1917 0%, #44403c 55%, #92400e 140%)" }}
          >
            <div>
              <h2 className="font-display text-2xl leading-snug sm:text-3xl">{w.readerTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{w.readerDesc}</p>
              <ul className="mt-5 space-y-2.5">
                {w.readerPoints.map((p, i) => {
                  const Icon = [BookOpen, Headphones, Flame][i];
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      {p}
                    </li>
                  );
                })}
              </ul>
              <Link
                to="/library"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-stone-900 transition hover:bg-amber-300"
              >
                {w.readerCta}
                <Arrow className="h-4 w-4" />
              </Link>
            </div>
            <OpenBook />
          </div>
        </Reveal>
      </section>

      {/* ── invite a friend ── */}
      <section dir={w.dir} className={`mx-auto max-w-6xl px-4 pb-14 ${rtlFont}`}>
        <Reveal>
          <div
            className="flex flex-col items-center justify-between gap-5 rounded-3xl p-6 text-white shadow-lg sm:flex-row sm:p-8"
            style={{ background: "linear-gradient(120deg, #f59e0b 0%, #ea580c 55%, #be123c 120%)" }}
          >
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                <Gift className="h-7 w-7" />
              </span>
              <div>
                <h2 className="font-display text-xl sm:text-2xl">{w.refTitle}</h2>
                <p className="mt-1 text-sm text-white/85">{w.refDesc}</p>
              </div>
            </div>
            <a
              href="#books"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-orange-700 shadow transition hover:scale-[1.03]"
            >
              {w.refCta}
              <Arrow className="h-4 w-4" />
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function BookCard({ book, rating }: { book: Book; rating?: { avg: number; count: number } | undefined }) {
  const prices = [book.hardPrice, book.softPrice].filter((p): p is number => p != null);
  const from = prices.length ? Math.min(...prices) : 0;
  return (
    <Link to="/books/$id" params={{ id: book.id }} className="group block">
      <div className="transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:drop-shadow-xl">
        <BookCover book={book} />
      </div>
      <div className="mt-3 space-y-1.5">
        <h3 className="font-display text-base leading-snug">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        {rating && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Stars value={rating.avg} size={12} /> {rating.avg.toFixed(1)} ({rating.count})
          </p>
        )}
        {from === 0 ? (
          <p className="text-sm font-medium text-primary">Free PDF · وړیا</p>
        ) : (
          <p className="text-sm font-medium">
            from {fmtAfn(from)} <span className="font-normal text-muted-foreground">· {fmtUsd(from)}</span>
          </p>
        )}
        <FormatBadges book={book} />
      </div>
    </Link>
  );
    }

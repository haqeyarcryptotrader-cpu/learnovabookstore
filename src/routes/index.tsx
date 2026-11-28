import { CategoryTiles } from "@/components/CategoryTiles";
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
  StickyNote,
  Star,
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
    announce: "Refer friends and earn 20% of every purchase",
    badge: "Afghan Online Bookstore",
    title: "Welcome to Learnova Books",
    sub: "Hard copies delivered across Afghanistan · Instant PDF soft copies",
    searchPh: "Search by title or author…",
    searchBtn: "Search",
    cta1: "Browse books",
    cta2: "My library",
    cta3: "Free books",
    trust: ["Delivery across Afghanistan", "Instant PDF copy", "Protected online reading"],
    statBooks: "books",
    statFree: "free",
    catTitle: "Pick a topic you love",
    catSub: "A book for every curiosity",
    freeTitle: "Free books",
    freeSub: "Read without paying and start your reading habit today",
    featTitle: "Top books",
    featSub: "Loved by our readers",
    pillars: [
      ["Delivery across Afghanistan", "Hard copies to Kabul, Herat, Mazar and more"],
      ["Instant PDF copy", "Read on the site right after payment"],
      ["Protected reading", "Your book opens only in your account"],
      ["5% discount", "Invite a friend and save on your next book"],
    ],
    readerTitle: "A reading experience better than paper",
    readerDesc: "A 3D book with real page turns, calming study sounds, notes and a daily reading goal.",
    readerPts: ["3D book with realistic page turning", "Rain and calm music while you read", "Daily goal, streaks and notes"],
    readerCta: "Go to my library",
    stepsTitle: "How to get a book",
    steps: [
      ["Choose a book", "Pick the hard copy or the PDF version."],
      ["Pay & confirm", "Pay the price and send your account email to the admin on WhatsApp."],
      ["Start reading", "The book opens in your library, ready to read."],
    ],
    catalogTitle: "All books",
    countSuffix: "books",
    empty: "No books match your search.",
    clear: "Clear filters",
    fmt: ["All", "Hard Copy", "Soft Copy"],
    from: "from",
    finalTitle: "Start your reading journey today",
    finalDesc: "Choose a book, or message us on WhatsApp if you need help.",
    finalCta1: "Browse books",
    finalCta2: "Contact us",
    chipPdf: "Instant PDF",
    chipOff: "5% off",
  },
  fa: {
    dir: "rtl",
    announce: "دوستان را دعوت کنید و ۲۰٪ از هر خرید را کمایی کنید",
    badge: "کتاب‌فروشی آنلاین افغانستان",
    title: "به کتاب‌فروشی لرنووا خوش آمدید",
    sub: "ارسال کتاب چاپی به سراسر افغانستان · نسخه دیجیتال PDF فوری",
    searchPh: "جستجوی عنوان یا نویسنده…",
    searchBtn: "جستجو",
    cta1: "مشاهده کتاب‌ها",
    cta2: "کتابخانه من",
    cta3: "کتاب‌های رایگان",
    trust: ["ارسال به سراسر افغانستان", "نسخه PDF فوری", "مطالعه آنلاین امن"],
    statBooks: "کتاب",
    statFree: "رایگان",
    catTitle: "موضوع مورد علاقه‌تان را انتخاب کنید",
    catSub: "برای هر ذوق یک کتاب",
    freeTitle: "کتاب‌های رایگان",
    freeSub: "بدون پرداخت بخوانید و عادت مطالعه را از امروز شروع کنید",
    featTitle: "کتاب‌های برتر",
    featSub: "محبوب خوانندگان ما",
    pillars: [
      ["ارسال به سراسر افغانستان", "کتاب چاپی به کابل، هرات، مزار و سایر ولایات"],
      ["نسخه PDF فوری", "بعد از پرداخت، همان لحظه در سایت بخوانید"],
      ["مطالعه امن", "کتاب فقط در حساب شما باز می‌شود"],
      ["۵٪ تخفیف", "دوستان را دعوت کنید و تخفیف بگیرید"],
    ],
    readerTitle: "تجربه‌ای از مطالعه که از کتاب کاغذی هم بهتر است",
    readerDesc: "کتاب سه‌بعدی با ورق زدن واقعی، صداهای آرامش‌بخش، یادداشت و هدف روزانه.",
    readerPts: ["کتاب سه‌بعدی و ورق زدن واقعی", "صدای باران و موسیقی آرام هنگام مطالعه", "هدف روزانه، روزهای پیاپی و یادداشت"],
    readerCta: "رفتن به کتابخانه",
    stepsTitle: "چگونه کتاب بگیریم؟",
    steps: [
      ["کتاب را انتخاب کنید", "نسخه چاپی یا PDF را برگزینید."],
      ["پرداخت و تأیید", "قیمت را بپردازید و ایمیل حساب خود را از طریق واتساپ برای ادمین بفرستید."],
      ["مطالعه را شروع کنید", "کتاب در کتابخانه شما باز می‌شود."],
    ],
    catalogTitle: "همه کتاب‌ها",
    countSuffix: "کتاب",
    empty: "کتابی یافت نشد.",
    clear: "پاک کردن فیلترها",
    fmt: ["همه", "چاپی", "دیجیتال"],
    from: "از",
    finalTitle: "سفر مطالعه را از امروز شروع کنید",
    finalDesc: "یک کتاب انتخاب کنید یا برای راهنمایی در واتساپ با ما در تماس باشید.",
    finalCta1: "مشاهده کتاب‌ها",
    finalCta2: "تماس با ما",
    chipPdf: "PDF فوری",
    chipOff: "۵٪ تخفیف",
  },
  ps: {
    dir: "rtl",
    announce: "ملګري راوبولئ او د هر پېر ۲۰٪ ګټه وکړئ",
    badge: "د افغانستان آنلاین کتاب پلورنځی",
    title: "لرنووا کتاب پلورنځي ته ښه راغلاست",
    sub: "چاپي کتابونه په ټول افغانستان کې · فوري PDF ډیجیټل نسخه",
    searchPh: "د کتاب یا لیکوال نوم ولټوئ…",
    searchBtn: "لټون",
    cta1: "کتابونه وګورئ",
    cta2: "زما کتابتون",
    cta3: "وړیا کتابونه",
    trust: ["په ټول افغانستان کې رسول", "فوري PDF نسخه", "خوندي آنلاین لوستل"],
    statBooks: "کتابونه",
    statFree: "وړیا",
    catTitle: "خپله خوښه موضوع وټاکئ",
    catSub: "د هر ذوق لپاره کتاب",
    freeTitle: "وړیا کتابونه",
    freeSub: "پرته له تادیې یې ولولئ او نن د مطالعې عادت پیل کړئ",
    featTitle: "غوره کتابونه",
    featSub: "د لوستونکو خوښ شوي",
    pillars: [
      ["په ټول افغانستان کې رسول", "چاپي کتابونه کابل، هرات، مزار او نورو ولایتونو ته"],
      ["فوري PDF نسخه", "د تادیې وروسته سمدستي په سایټ کې ولولئ"],
      ["خوندي لوستل", "کتاب یوازې ستاسو په اکاونټ کې خلاصېږي"],
      ["۵٪ تخفیف", "ملګري ته بلنه ورکړئ او تخفیف ترلاسه کړئ"],
    ],
    readerTitle: "د لوستلو داسې تجربه چې له کاغذي کتاب هم ښه ده",
    readerDesc: "درې اړخیز کتاب د پاڼو واقعي اړولو سره، د مطالعې آرامه آوازونه، یادښتونه او ورځنی هدف.",
    readerPts: ["3D کتاب او د پاڼو واقعي اړول", "د لوستلو پر مهال د باران او ارامې موسیقۍ آوازونه", "ورځنی هدف، پرله پسې ورځې او یادښتونه"],
    readerCta: "کتابتون ته ورشئ",
    stepsTitle: "څنګه کتاب ترلاسه کړو؟",
    steps: [
      ["کتاب وټاکئ", "چاپي یا PDF نسخه غوره کړئ."],
      ["تادیه او تایید", "بیه تادیه کړئ او خپل اکاونټ ایمیل د واټساپ له لارې اډمین ته ولېږئ."],
      ["لوستل پیل کړئ", "کتاب ستاسو په کتابتون کې خلاصېږي."],
    ],
    catalogTitle: "ټول کتابونه",
    countSuffix: "کتابونه",
    empty: "هیڅ کتاب ونه موندل شو.",
    clear: "فلټرونه پاک کړئ",
    fmt: ["ټول", "چاپي", "ډیجیټل"],
    from: "له",
    finalTitle: "نن د لوستلو سفر پیل کړئ",
    finalDesc: "یو کتاب وټاکئ، یا که مرسته غواړئ په واټساپ کې موږ سره اړیکه ونیسئ.",
    finalCta1: "کتابونه وګورئ",
    finalCta2: "اړیکه",
    chipPdf: "فوري PDF",
    chipOff: "۵٪ تخفیف",
  },
} as const;

const PILLAR_ICONS: LucideIcon[] = [Truck, Zap, ShieldCheck, Gift];
const STEP_ICONS: LucideIcon[] = [ShoppingBag, MessageCircle, BookOpen];
const COVERS = ["cover-tech", "cover-crypto", "cover-self", "cover-history", "cover-lit"];

const minPrice = (b: Book) => {
  const p = [b.hardPrice, b.softPrice].filter((x): x is number => x != null);
  return p.length ? Math.min(...p) : 0;
};

/* ───────────────────────── small building blocks ───────────────────────── */

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

function SectionTitle({ title, sub, hf }: { title: string; sub?: string; hf: string }) {
  return (
    <div>
      <h2 className={`text-2xl sm:text-3xl ${hf}`}>{title}</h2>
      <div className="mt-2 h-1 w-12 rounded-full bg-primary" />
      {sub && <p className="mt-2 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

/* three real covers floating over a soft glow, with small floating badges */
const SLOTS = [
  { left: "0%", top: "18%", rot: -18, z: 1, dur: 7, delay: 0 },
  { left: "25%", top: "0%", rot: 0, z: 3, dur: 6, delay: 0.7 },
  { left: "50%", top: "20%", rot: 18, z: 2, dur: 8, delay: 1.4 },
];

function HeroVisual(props: {
  books: Book[];
  top?: { avg: number; count: number };
  chipPdf: string;
  chipOff: string;
}) {
  const { books, top, chipPdf, chipOff } = props;
  const slots = books.length >= 3 ? SLOTS : books.length === 2 ? [SLOTS[0], SLOTS[2]] : [SLOTS[1]];
  return (
    <div dir="ltr" className="relative mx-auto h-[300px] w-[290px] sm:h-[380px] sm:w-[360px]" style={{ perspective: 1100 }}>
      <div
        aria-hidden
        className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: "color-mix(in oklab, var(--primary) 30%, transparent)" }}
      />
      {books.slice(0, slots.length).map((b, i) => {
        const p = slots[i];
        return (
          <div
            key={b.id}
            className="absolute w-[50%] drop-shadow-2xl"
            style={{
              left: p.left,
              top: p.top,
              zIndex: p.z,
              transform: `rotateY(${p.rot}deg) rotateZ(${p.rot / 4}deg)`,
              animation: `lnv-float ${p.dur}s ease-in-out ${p.delay}s infinite`,
            }}
          >
            <BookCover book={b} />
          </div>
        );
      })}

      {top && (
        <div
          className="absolute right-0 top-1 z-10 flex items-center gap-1 rounded-full border bg-card/90 px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur"
          style={{ animation: "lnv-float 7s ease-in-out .4s infinite" }}
        >
          <Star className="h-3.5 w-3.5 fill-chart-5 text-chart-5" />
          {top.avg.toFixed(1)}
          <span className="font-normal text-muted-foreground">({top.count})</span>
        </div>
      )}
      <div
        className="absolute bottom-3 left-0 z-10 flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg"
        style={{ animation: "lnv-float 8s ease-in-out 1s infinite" }}
      >
        <Zap className="h-3.5 w-3.5" />
        {chipPdf}
      </div>
      <div
        className="absolute bottom-0 right-4 z-10 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground shadow-lg"
        style={{ animation: "lnv-float 9s ease-in-out .2s infinite" }}
      >
        <Gift className="h-3.5 w-3.5" />
        {chipOff}
      </div>
    </div>
  );
}

/* an open book drawn with CSS, for the reader showcase */
function OpenBook() {
  const lines =
    "repeating-linear-gradient(180deg, transparent 0 14px, color-mix(in oklab, var(--foreground) 16%, transparent) 14px 15px)";
  const page = {
    backgroundImage: lines,
    backgroundColor: "var(--card)",
    backgroundOrigin: "content-box",
    padding: "18px 14px",
  } as const;
  return (
    <div dir="ltr" className="relative mx-auto flex h-52 w-72 items-center justify-center" style={{ perspective: 900 }}>
      <div
        className="h-44 w-32 rounded-l-md border shadow-2xl"
        style={{ ...page, transform: "rotateY(18deg)", transformOrigin: "right center", animation: "lnv-float 6s ease-in-out infinite" }}
      />
      <div
        className="h-44 w-32 rounded-r-md border shadow-2xl"
        style={{ ...page, transform: "rotateY(-18deg)", transformOrigin: "left center", animation: "lnv-float 6s ease-in-out infinite" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-44 w-3 -translate-x-1/2 -translate-y-1/2"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.22), transparent, rgba(0,0,0,0.22))" }}
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
  const rtl = w.dir === "rtl";
  const Arrow = rtl ? ArrowLeft : ArrowRight;
  const rtlFont = rtl ? "font-rtl" : "";
  const hf = rtl ? "font-rtl font-bold" : "font-display";

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
  const freeBooks = useMemo(() => books.filter((b) => minPrice(b) === 0), [books]);
  const heroBooks = featured.slice(0, 3);

  const goBooks = () => document.getElementById("books")?.scrollIntoView({ behavior: "smooth", block: "start" });
  const fmtLabels = { all: w.fmt[0], hard: w.fmt[1], soft: w.fmt[2] } as const;

  return (
    <div>
      <style>{`
        @keyframes lnv-float { 0%,100% { translate: 0 0; } 50% { translate: 0 -12px; } }
        @keyframes lnv-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .lnv-row { scrollbar-width: none; }
        .lnv-row::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>

      {/* announcement */}
      <div dir={w.dir} className={`bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground ${rtlFont}`}>
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          {w.announce}
        </span>
      </div>

      {/* ── hero ── */}
      <section className="hero-surface relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--foreground) 14%, transparent) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />
        <div
          dir={w.dir}
          className={`relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] ${rtlFont}`}
        >
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-primary backdrop-blur"
              style={{ animation: "lnv-rise .7s cubic-bezier(.2,.7,.2,1) both" }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {w.badge}
            </span>

            <h1
              className={`mt-5 text-4xl leading-[1.3] sm:text-6xl ${hf}`}
              style={{
                animation: "lnv-rise .8s cubic-bezier(.2,.7,.2,1) .1s both",
                backgroundImage: "linear-gradient(90deg, var(--foreground), var(--primary))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {w.title}
            </h1>
            <p
              className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              style={{ animation: "lnv-rise .8s cubic-bezier(.2,.7,.2,1) .2s both" }}
            >
              {w.sub}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                goBooks();
              }}
              className="mt-7 flex max-w-xl items-center gap-2 rounded-full border bg-card p-1.5 shadow-book"
              style={{ animation: "lnv-rise .8s cubic-bezier(.2,.7,.2,1) .3s both" }}
            >
              <Search className="ms-3 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                dir="auto"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={w.searchPh}
                aria-label={w.searchPh}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95"
              >
                {w.searchBtn}
              </button>
            </form>

            <div
              className="mt-5 flex flex-wrap gap-3"
              style={{ animation: "lnv-rise .8s cubic-bezier(.2,.7,.2,1) .4s both" }}
            >
              <a
                href="#books"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-book transition hover:opacity-90 active:scale-95"
              >
                {w.cta1}
                <Arrow className="h-4 w-4" />
              </a>
              <Link
                to="/library"
                className="inline-flex items-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-semibold transition hover:bg-muted active:scale-95"
              >
                {w.cta2}
              </Link>
              {freeBooks.length > 0 && (
                <a
                  href="#free"
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 active:scale-95"
                >
                  {w.cta3}
                </a>
              )}
            </div>

            <div
              className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"
              style={{ animation: "lnv-rise .8s cubic-bezier(.2,.7,.2,1) .5s both" }}
            >
              {[Truck, Zap, ShieldCheck].map((Icon, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-primary" />
                  {w.trust[i]}
                </span>
              ))}
            </div>
            {books.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{books.length}</span> {w.statBooks}
                {freeBooks.length > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-foreground">{freeBooks.length}</span> {w.statFree}
                  </>
                )}
              </p>
            )}
          </div>

          {heroBooks.length > 0 && (
            <HeroVisual
              books={heroBooks}
              top={heroBooks[0] ? ratings[heroBooks[0].id] : undefined}
              chipPdf={w.chipPdf}
              chipOff={w.chipOff}
            />
          )}
        </div>
      </section>
      <ReferralBanner lang={lang} />
      <PostBar className="mx-auto max-w-6xl px-4 pt-6" />
      <QuickLinks />

      {/* ── topics ── */}
      {CATEGORIES.length > 0 && (
        <section dir={w.dir} className={`mx-auto max-w-6xl px-4 pt-10 ${rtlFont}`}>
          <Reveal>
            <SectionTitle title={w.catTitle} sub={w.catSub} hf={hf} />
          </Reveal>
          <CategoryTiles
  categories={CATEGORIES}
  lang={lang}
  active={cat}
  countLabel={w.countSuffix}
  onPick={(c) => {
    setCat(c);
    goBooks();
  }}
/>
        </section>
      )}

      {/* ── free books ── */}
      {freeBooks.length > 0 && (
        <section id="free" dir={w.dir} className={`mx-auto max-w-6xl scroll-mt-4 px-4 pt-10 ${rtlFont}`}>
          <Reveal>
            <div className="tile-free relative flex items-center justify-between gap-4 overflow-hidden rounded-3xl p-5 shadow-book sm:p-7">
              <div>
                <h2 className={`text-2xl sm:text-3xl ${hf}`}>{w.freeTitle}</h2>
                <p className="mt-1.5 max-w-md text-sm opacity-90">{w.freeSub}</p>
              </div>
              <Gift aria-hidden className="h-14 w-14 shrink-0 opacity-30 sm:h-20 sm:w-20" />
            </div>
          </Reveal>
          <div dir={w.dir} className="lnv-row -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-3">
            {freeBooks.slice(0, 10).map((b) => (
              <div key={b.id} className="w-36 shrink-0 snap-start sm:w-44">
                <BookCard book={b} rating={ratings[b.id]} fromLabel={w.from} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── top books ── */}
      {featured.length > 0 && (
        <section dir={w.dir} className={`mx-auto max-w-6xl px-4 pt-10 ${rtlFont}`}>
          <Reveal>
            <SectionTitle title={w.featTitle} sub={w.featSub} hf={hf} />
          </Reveal>
          <div dir={w.dir} className="lnv-row -mx-4 mt-5 flex snap-x gap-4 overflow-x-auto px-4 pb-3">
            {featured.map((b) => (
              <div key={b.id} className="w-36 shrink-0 snap-start sm:w-44">
                <BookCard book={b} rating={ratings[b.id]} fromLabel={w.from} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── why Learnova ── */}
      <section dir={w.dir} className={`mx-auto max-w-6xl px-4 pt-12 ${rtlFont}`}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {w.pillars.map(([title, desc], i) => {
            const Icon = PILLAR_ICONS[i];
            return (
              <Reveal key={i} delay={i * 80}>
                <div className="h-full rounded-2xl border bg-card p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-book">
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

      {/* ── all books ── */}
      <section id="books" className="mx-auto max-w-6xl scroll-mt-4 px-4 py-12">
        <div dir={w.dir} className={`flex items-end justify-between gap-3 ${rtlFont}`}>
          <SectionTitle title={w.catalogTitle} hf={hf} />
          <p className="shrink-0 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{list.length}</span> {w.countSuffix}
          </p>
        </div>

        <div dir={w.dir} className={`mt-5 flex flex-col gap-3 md:flex-row ${rtlFont}`}>
          <label className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              dir="auto"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={w.searchPh}
              className="w-full rounded-xl border bg-card py-2.5 pe-3 ps-9 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="flex rounded-xl border bg-card p-0.5 text-sm shadow-sm">
            {(["all", "hard", "soft"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFmt(f)}
                className={`flex-1 rounded-lg px-3 py-2 transition ${fmt === f ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground"}`}
              >
                {fmtLabels[f]}
              </button>
            ))}
          </div>
        </div>
        <div dir={w.dir} className={`lnv-row mt-4 flex gap-2 overflow-x-auto pb-1 ${rtlFont}`}>
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
            <BookCard key={b.id} book={b} rating={ratings[b.id]} fromLabel={w.from} />
          ))}
        </div>
        {list.length === 0 && (
          <div dir={w.dir} className={`py-16 text-center ${rtlFont}`}>
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-muted-foreground">{w.empty}</p>
            <button
              onClick={() => {
                setQ("");
                setCat("All");
                setFmt("all");
              }}
              className="mt-4 rounded-full border bg-card px-5 py-2 text-sm font-medium transition hover:bg-muted"
            >
              {w.clear}
            </button>
          </div>
        )}
      </section>

      {/* ── the reader ── */}
      <section dir={w.dir} className={`mx-auto max-w-6xl px-4 pb-12 ${rtlFont}`}>
        <Reveal>
          <div className="tile-ai grid items-center gap-8 overflow-hidden rounded-3xl p-6 shadow-book sm:p-10 md:grid-cols-2">
            <div>
              <h2 className={`text-2xl leading-snug sm:text-3xl ${hf}`}>{w.readerTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed opacity-90">{w.readerDesc}</p>
              <ul className="mt-5 space-y-2.5">
                {w.readerPts.map((p, i) => {
                  const Icon = [BookOpen, Headphones, Flame][i];
                  return (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                        <Icon className="h-4 w-4" />
                      </span>
                      {p}
                    </li>
                  );
                })}
              </ul>
              <Link
                to="/library"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-stone-900 transition hover:opacity-90 active:scale-95"
              >
                {w.readerCta}
                <Arrow className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative">
              <OpenBook />
              <span className="absolute -top-1 end-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur" style={{ animation: "lnv-float 7s ease-in-out infinite" }}>
                <Headphones className="h-5 w-5" />
              </span>
              <span className="absolute bottom-2 start-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur" style={{ animation: "lnv-float 8s ease-in-out .6s infinite" }}>
                <StickyNote className="h-5 w-5" />
              </span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── how it works ── */}
      <section dir={w.dir} className={`border-y bg-muted/40 ${rtlFont}`}>
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Reveal>
            <h2 className={`text-center text-2xl sm:text-3xl ${hf}`}>{w.stepsTitle}</h2>
          </Reveal>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {w.steps.map(([title, desc], i) => {
              const Icon = STEP_ICONS[i];
              return (
                <Reveal key={i} delay={i * 120}>
                  <div className="relative h-full rounded-2xl border bg-card p-5 pt-7 shadow-sm">
                    <span className="absolute -top-4 start-5 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-book">
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

      {/* ── final call to action ── */}
      <section dir={w.dir} className={`mx-auto max-w-6xl px-4 py-14 ${rtlFont}`}>
        <Reveal>
          <div className="hero-surface relative overflow-hidden rounded-3xl border p-8 text-center shadow-book sm:p-12">
            <h2 className={`text-2xl leading-snug sm:text-4xl ${hf}`}>{w.finalTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">{w.finalDesc}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#books"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-book transition hover:opacity-90 active:scale-95"
              >
                {w.finalCta1}
                <Arrow className="h-4 w-4" />
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full bg-whatsapp px-7 py-3 text-sm font-semibold text-whatsapp-foreground transition hover:opacity-90 active:scale-95"
              >
                <MessageCircle className="h-4 w-4" />
                {w.finalCta2}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

function BookCard({
  book,
  rating,
  fromLabel,
}: {
  book: Book;
  rating?: { avg: number; count: number } | undefined;
  fromLabel: string;
}) {
  const from = minPrice(book);
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
            {fromLabel} {fmtAfn(from)} <span className="font-normal text-muted-foreground">· {fmtUsd(from)}</span>
          </p>
        )}
        <FormatBadges book={book} />
      </div>
    </Link>
  );
    }

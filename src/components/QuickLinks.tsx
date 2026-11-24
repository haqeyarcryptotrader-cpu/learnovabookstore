import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, BookOpen, ChevronLeft, Compass, Sparkles } from "lucide-react";
import { WHATSAPP_CHANNEL_URL, waLink } from "@/lib/books";

type IconType = typeof Sparkles;

/* ───────── friendly messages (you can edit these lines) ───────── */

const AI_LINES = [
  "ښه راغلاست!",
  "آیا کوم ځانګړی کتاب لټوې؟",
  "د کتاب په موندلو کې دې ملګری یم.",
  "ایا داسې کتاب درته ووایم چې ژوند مو بدل کړي؟",
  "د ذهني ودې لپاره مطالعه اړینه ده. زه درسره څه مرسته کولی شم؟",
  "نن کوم کتاب لوستل غواړې؟",
  "که پوښتنه لرې، ما ته ووایه، زه دلته یم.",
  "هر کتاب، یوه نوې نړۍ ده.",
] as const;

const EXPLORE_LINES = [
  "دلته خپل نظر شریک کړه",
  "د خپل خوښ کتاب لنډیز خپور کړه",
  "یو پوسټ ولیکه، نور لوستونکي به ستا خبره واوري",
  "ستا یوه کوچنۍ لیکنه د بل چا لپاره د لوستلو انګېزه کېدای شي",
  "ته څه لوستل؟ ملګرو ته ووایه!",
  "پوښتنه لرې؟ د لوستونکو ټولنه درسره مرسته کوي",
] as const;

/* ───────── small hooks ───────── */

/** types a message letter by letter, holds it, then moves to the next one */
function useTypewriter(lines: readonly string[]) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const full = lines[i];

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setN(full.length);
      const t = setTimeout(() => setI((x) => (x + 1) % lines.length), 5000);
      return () => clearTimeout(t);
    }
    if (n < full.length) {
      const t = setTimeout(() => setN((x) => x + 1), 42);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setI((x) => (x + 1) % lines.length);
      setN(0);
    }, 2800);
    return () => clearTimeout(t);
  }, [n, i, full, lines.length]);

  return { text: full.slice(0, n), typing: n < full.length, k: i };
}

function useRotate(count: number, ms: number) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % count), ms);
    return () => clearInterval(t);
  }, [count, ms]);
  return i;
}

/* ───────── 1. My Library: a cosy bookshelf ───────── */

const SHELF_TOP = [
  [12, 16, 46, "#fde68a"],
  [30, 12, 38, "#fda4af"],
  [44, 18, 52, "#a5b4fc"],
  [64, 14, 42, "#99f6e4"],
  [80, 20, 48, "#fff7ed"],
  [132, 16, 50, "#fde68a"],
  [150, 12, 36, "#c4b5fd"],
] as const;

const SHELF_BOTTOM = [
  [12, 18, 48, "#fda4af"],
  [32, 14, 40, "#fde68a"],
  [50, 16, 44, "#99f6e4"],
  [68, 12, 36, "#c4b5fd"],
  [82, 20, 50, "#fde68a"],
  [104, 14, 42, "#fda4af"],
  [120, 16, 46, "#fff7ed"],
  [138, 14, 34, "#fb923c"],
  [154, 18, 48, "#a5b4fc"],
] as const;

const STACK = [
  [190, 118, 60, "#a5b4fc"],
  [196, 108, 54, "#fff7ed"],
  [186, 98, 62, "#fb923c"],
] as const;

function ShelfBook(p: { x: number; bottom: number; w: number; h: number; c: string; pop?: boolean; delay?: number }) {
  const y = p.bottom - p.h;
  return (
    <g className={p.pop ? "ql-pop" : undefined} style={p.pop ? { animationDelay: `${p.delay ?? 0}s` } : undefined}>
      <rect x={p.x} y={y} width={p.w} height={p.h} rx={2} fill={p.c} />
      <rect x={p.x} y={y + 6} width={p.w} height={3} fill="#000" opacity={0.12} />
      <rect x={p.x + 2} y={y} width={2} height={p.h} fill="#fff" opacity={0.35} />
    </g>
  );
}

function LibraryStage() {
  return (
    <svg viewBox="0 0 300 140" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" aria-hidden>
      {/* top shelf */}
      {SHELF_TOP.map(([x, w, h, c], i) => (
        <ShelfBook key={`t${i}`} x={x} bottom={64} w={w} h={h} c={c} pop={i % 3 === 1} delay={i * 0.9} />
      ))}
      <g transform="rotate(14 104 64)">
        <rect x={104} y={20} width={14} height={44} rx={2} fill="#fb923c" />
        <rect x={104} y={26} width={14} height={3} fill="#000" opacity={0.12} />
      </g>
      {/* picture frame */}
      <rect x={178} y={18} width={36} height={28} rx={3} fill="#fff" fillOpacity={0.1} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} />
      <path d="M182 42 l9 -11 7 8 5 -5 8 8z" fill="#fff" opacity={0.5} />
      {/* plant */}
      <rect x={238} y={46} width={22} height={18} rx={3} fill="#fcd5a5" />
      <ellipse cx={249} cy={34} rx={5} ry={12} fill="#86efac" />
      <ellipse cx={240} cy={40} rx={4} ry={10} fill="#4ade80" transform="rotate(-25 240 40)" />
      <ellipse cx={258} cy={40} rx={4} ry={10} fill="#4ade80" transform="rotate(25 258 40)" />
      <rect x={4} y={64} width={292} height={6} rx={3} fill="#fff" opacity={0.4} />

      {/* bottom shelf */}
      {SHELF_BOTTOM.map(([x, w, h, c], i) => (
        <ShelfBook key={`b${i}`} x={x} bottom={128} w={w} h={h} c={c} pop={i % 4 === 2} delay={i * 0.7 + 2} />
      ))}
      {STACK.map(([x, y, w, c], i) => (
        <g key={`s${i}`}>
          <rect x={x} y={y} width={w} height={10} rx={2} fill={c} />
          <rect x={x + 3} y={y + 3} width={w - 14} height={2} rx={1} fill="#000" opacity={0.12} />
        </g>
      ))}
      <rect x={4} y={128} width={292} height={6} rx={3} fill="#fff" opacity={0.4} />
    </svg>
  );
}

/* ───────── 2. AI Guide: a friendly robot who chats ───────── */

function Robot() {
  return (
    <svg viewBox="0 0 120 150" className="ql-bob h-[92%] w-auto" aria-hidden>
      {/* antenna */}
      <line x1={60} y1={20} x2={60} y2={9} stroke="#fff3e0" strokeWidth={3} strokeLinecap="round" />
      <circle cx={60} cy={6} r={5} fill="#ffd27a" className="ql-pulse" />
      {/* head */}
      <rect x={14} y={36} width={9} height={18} rx={4.5} fill="#ffcf8a" />
      <rect x={97} y={36} width={9} height={18} rx={4.5} fill="#ffcf8a" />
      <rect x={22} y={18} width={76} height={54} rx={22} fill="#fff8ee" />
      <rect x={31} y={27} width={58} height={37} rx={16} fill="#3b1a12" />
      <g className="ql-blink">
        <ellipse cx={47} cy={44} rx={5.5} ry={7.5} fill="#ffd27a" />
        <circle cx={49} cy={41} r={1.8} fill="#fff" />
      </g>
      <g className="ql-blink">
        <ellipse cx={73} cy={44} rx={5.5} ry={7.5} fill="#ffd27a" />
        <circle cx={75} cy={41} r={1.8} fill="#fff" />
      </g>
      <path d="M51 55 Q60 62 69 55" stroke="#ffd27a" strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <circle cx={39} cy={53} r={3} fill="#ff9a76" opacity={0.7} />
      <circle cx={81} cy={53} r={3} fill="#ff9a76" opacity={0.7} />
      {/* body */}
      <rect x={32} y={76} width={56} height={46} rx={18} fill="#fff8ee" />
      <rect x={43} y={86} width={34} height={24} rx={9} fill="#ffcf8a" />
      <path d="M51 93 h8 q1 0 1 1 q0 -1 1 -1 h8 v12 h-8 q-1 0 -1 1 q0 -1 -1 -1 h-8z" fill="#3b1a12" opacity={0.85} />
      {/* arm holding a book */}
      <rect x={19} y={82} width={13} height={32} rx={6.5} fill="#fff8ee" />
      <rect x={5} y={97} width={24} height={27} rx={3} fill="#fde68a" />
      <rect x={5} y={97} width={5} height={27} rx={2} fill="#f59e0b" />
      <rect x={14} y={104} width={12} height={2.5} rx={1.2} fill="#b45309" opacity={0.6} />
      <rect x={14} y={110} width={9} height={2.5} rx={1.2} fill="#b45309" opacity={0.6} />
      {/* waving arm */}
      <g className="ql-wave">
        <rect x={88} y={82} width={13} height={32} rx={6.5} fill="#fff8ee" />
        <circle cx={94.5} cy={115} r={7} fill="#ffcf8a" />
      </g>
      {/* feet */}
      <rect x={40} y={122} width={16} height={11} rx={5.5} fill="#ffcf8a" />
      <rect x={64} y={122} width={16} height={11} rx={5.5} fill="#ffcf8a" />
    </svg>
  );
}

function AiStage() {
  const { text, typing, k } = useTypewriter(AI_LINES);
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-y-0 right-0 flex w-[36%] items-end justify-end">
        <Robot />
      </div>
      <div
        key={k}
        dir="rtl"
        className="font-rtl absolute left-0 top-0 w-[66%] rounded-2xl bg-white/95 px-3 py-2 text-[12.5px] leading-[1.75] text-stone-800 shadow-lg"
        style={{ minHeight: "4.5rem", animation: "ql-bubble .35s ease both" }}
      >
        {text}
        {typing && <span className="ql-caret ms-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-stone-500" />}
        <span aria-hidden className="absolute -right-1.5 top-5 h-3.5 w-3.5 rotate-45 bg-white/95" />
      </div>
    </div>
  );
}

/* ───────── 3. Explore: share your opinion, post, summarise ───────── */

const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

function ExploreStage() {
  const i = useRotate(EXPLORE_LINES.length, 3400);
  return (
    <div className="absolute inset-0">
      <svg viewBox="0 0 300 100" preserveAspectRatio="xMidYMid meet" className="absolute inset-x-0 top-0 h-[62%] w-full" aria-hidden>
        {/* stacked post cards */}
        <rect x={150} y={12} width={112} height={70} rx={12} fill="#fff" opacity={0.12} transform="rotate(7 206 47)" />
        <rect x={104} y={10} width={112} height={72} rx={12} fill="#fff" opacity={0.2} transform="rotate(-5 160 46)" />
        <rect x={36} y={14} width={124} height={80} rx={12} fill="#fff" opacity={0.96} />
        <circle cx={56} cy={34} r={9} fill="#fdba74" />
        <rect x={72} y={27} width={46} height={5} rx={2.5} fill="#cbd5e1" />
        <rect x={72} y={36} width={28} height={4} rx={2} fill="#e2e8f0" />
        <text x={50} y={57} fontSize={10} fill="#f59e0b">
          ★★★★★
        </text>
        <rect x={50} y={62} width={96} height={5} rx={2.5} fill="#e2e8f0" />
        <rect x={50} y={71} width={78} height={5} rx={2.5} fill="#e2e8f0" />
        <path transform="translate(50 79) scale(.5)" fill="#fb7185" d={HEART} />
        <rect x={68} y={80} width={12} height={9} rx={3} fill="#94a3b8" />

        {/* pencil writing a line */}
        <g transform="translate(210 40) rotate(35)">
          <rect x={0} y={0} width={10} height={42} rx={2} fill="#fbbf24" />
          <polygon points="0,42 10,42 5,52" fill="#fde68a" />
          <rect x={0} y={0} width={10} height={7} rx={2} fill="#fb7185" />
        </g>
        <path className="ql-draw" d="M184 88 q7 -10 14 0 t14 0 t14 0" stroke="#fff" strokeWidth={2.2} fill="none" strokeLinecap="round" />

        {/* chat bubble with three dots */}
        <rect x={232} y={8} width={44} height={26} rx={10} fill="#fff" opacity={0.9} />
        <polygon points="244,34 252,34 246,42" fill="#fff" opacity={0.9} />
        <circle cx={244} cy={21} r={2.6} fill="#13294b" className="ql-pulse" />
        <circle cx={254} cy={21} r={2.6} fill="#13294b" className="ql-pulse" style={{ animationDelay: ".3s" }} />
        <circle cx={264} cy={21} r={2.6} fill="#13294b" className="ql-pulse" style={{ animationDelay: ".6s" }} />

        {/* floating hearts */}
        <g className="ql-rise" style={{ animationDelay: "0s" }}>
          <path transform="translate(172 30) scale(.6)" fill="#fb7185" d={HEART} />
        </g>
        <g className="ql-rise" style={{ animationDelay: "1.6s" }}>
          <path transform="translate(150 40) scale(.5)" fill="#fda4af" d={HEART} />
        </g>
      </svg>

      <div
        key={i}
        dir="rtl"
        className="font-rtl absolute inset-x-0 bottom-0 rounded-xl bg-white/15 px-3 py-2 text-center text-[12px] leading-snug backdrop-blur"
        style={{ minHeight: "2.6rem", animation: "ql-bubble .45s ease both" }}
      >
        {EXPLORE_LINES[i]}
      </div>
    </div>
  );
}

/* ───────── 4. Free books (kept simple) ───────── */

function FreeStage() {
  return (
    <div className="absolute inset-0">
      <BellRing aria-hidden className="ql-bob absolute right-2 top-1 h-24 w-24 opacity-25" />
      <Sparkles aria-hidden className="ql-twinkle absolute right-24 top-3 h-5 w-5" />
      <Sparkles aria-hidden className="ql-twinkle absolute right-4 top-24 h-4 w-4" style={{ animationDelay: "1.1s" }} />
      <Sparkles aria-hidden className="ql-twinkle absolute left-2 top-10 h-4 w-4" style={{ animationDelay: "0.5s" }} />
    </div>
  );
}

/* ───────── tile + section ───────── */

const tile =
  "group relative flex h-64 flex-col gap-2 overflow-hidden rounded-2xl p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:h-[17.5rem] sm:p-5";

function Tile({
  to,
  href,
  cls,
  icon: Icon,
  title,
  sub,
  children,
}: {
  to?: string;
  href?: string;
  cls: string;
  icon: IconType;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  const inner = (
    <>
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-background/15 blur-2xl" />
      <div className="relative min-h-0 flex-1">{children}</div>
      <div className="relative flex items-end gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-background/20 backdrop-blur">
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight sm:text-xl">{title}</p>
          <span dir="rtl" className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-background/15 px-3 py-1 text-xs font-medium">
            {sub}
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          </span>
        </div>
      </div>
    </>
  );
  if (to) return <Link to={to} className={`${tile} ${cls}`}>{inner}</Link>;
  return <a href={href} target="_blank" rel="noreferrer" className={`${tile} ${cls}`}>{inner}</a>;
}

export function QuickLinks() {
  const wa = WHATSAPP_CHANNEL_URL || waLink("Assalamu Alaikum! Please add me to the Learnova Books free-books list. · مهرباني وکړئ د وړیا کتابونو لېست ته مې ور اضافه کړئ.");
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <style>{`
        .ql-pop { transform-box: fill-box; transform-origin: 50% 100%; animation: ql-pop 6s ease-in-out infinite; }
        .ql-blink { transform-box: fill-box; transform-origin: 50% 50%; animation: ql-blink 4.5s infinite; }
        .ql-wave { transform-box: fill-box; transform-origin: 50% 6%; animation: ql-wave 2.4s ease-in-out infinite; }
        .ql-bob { animation: ql-bob 4s ease-in-out infinite; }
        .ql-pulse { animation: ql-pulse 1.8s ease-in-out infinite; }
        .ql-caret { animation: ql-caret .9s steps(1) infinite; }
        .ql-draw { stroke-dasharray: 90; stroke-dashoffset: 90; animation: ql-draw 3.2s ease-in-out infinite; }
        .ql-rise { animation: ql-rise 3.4s ease-in infinite; }
        .ql-twinkle { animation: ql-twinkle 2.6s ease-in-out infinite; }
        @keyframes ql-pop { 0%,72%,100% { transform: translateY(0); } 82% { transform: translateY(-9px); } 92% { transform: translateY(0); } }
        @keyframes ql-blink { 0%,92%,100% { transform: scaleY(1); } 96% { transform: scaleY(.12); } }
        @keyframes ql-wave { 0%,100% { transform: rotate(-10deg); } 25% { transform: rotate(-60deg); } 50% { transform: rotate(-30deg); } 75% { transform: rotate(-62deg); } }
        @keyframes ql-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes ql-pulse { 0%,100% { opacity: .55; } 50% { opacity: 1; } }
        @keyframes ql-bubble { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes ql-caret { 50% { opacity: 0; } }
        @keyframes ql-draw { 0% { stroke-dashoffset: 90; } 60%,100% { stroke-dashoffset: 0; } }
        @keyframes ql-rise { 0% { opacity: 0; translate: 0 6px; } 20% { opacity: 1; } 100% { opacity: 0; translate: 0 -26px; } }
        @keyframes ql-twinkle { 0%,100% { opacity: .25; scale: .8; } 50% { opacity: .9; scale: 1.15; } }
        @media (prefers-reduced-motion: reduce) {
          .ql-pop, .ql-blink, .ql-wave, .ql-bob, .ql-pulse, .ql-caret, .ql-draw, .ql-rise, .ql-twinkle { animation: none !important; }
          .ql-draw { stroke-dashoffset: 0; }
        }
      `}</style>

      <div className="relative overflow-hidden rounded-3xl border bg-card/50 p-5 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-16 right-8 h-52 w-52 rounded-full bg-accent/25 blur-3xl" />

        <div dir="rtl" className="relative mb-6 text-center font-rtl sm:mb-8">
          <p dir="ltr" className="mb-3 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
            <span className="h-px w-6 bg-primary/40" /> Learnova Books <span className="h-px w-6 bg-primary/40" />
          </p>
          <h2 className="text-3xl font-bold leading-snug text-balance sm:text-4xl">هر کتاب، یوه نوې نړۍ</h2>
          <p dir="ltr" className="mt-1 font-display text-base italic text-muted-foreground sm:text-lg">Every book, a new world</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-foreground/75">خپل پېرل شوي کتابونه ولوله، نوي کتابونه ومومه، او وړیا PDFونه ترلاسه کړه.</p>
        </div>

        <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
          <Tile to="/library" cls="tile-library" icon={BookOpen} title="My Library" sub="زما کتابتون">
            <LibraryStage />
          </Tile>
          <Tile to="/assistant" cls="tile-ai" icon={Sparkles} title="AI Guide" sub="کتاب راته ومومه">
            <AiStage />
          </Tile>
          <Tile to="/community" cls="tile-explore" icon={Compass} title="Explore" sub="د لوستونکو لیکنې">
            <ExploreStage />
          </Tile>
          <Tile href={wa} cls="tile-free" icon={BellRing} title="Free books" sub="WhatsApp چینل">
            <FreeStage />
          </Tile>
        </div>
      </div>
    </section>
  );
      }

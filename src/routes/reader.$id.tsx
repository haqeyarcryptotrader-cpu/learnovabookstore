import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Bookmark,
  BookmarkCheck,
  Clock,
  Sparkles,
  Palette,
  Volume2,
  VolumeX,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/reader/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Learnova Reader — Learnova Books Store" },
      { name: "description", content: "Read your purchased book online in the protected Learnova Reader." },
      { property: "og:title", content: "Learnova Reader" },
      { property: "og:description", content: "Protected offline-ready online reader for Learnova Books." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReaderPage,
});

type Doc = { numPages: number; getPage: (n: number) => Promise<any> };
type Theme = "light" | "sepia" | "dark";

// Realistic Paper Page-Turn Sound Synthesizer via Web Audio API (zero external files required)
function playPageTurnSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const bufferSize = ctx.sampleRate * 0.18; // 180ms paper rustle
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.18);
  } catch {
    // Ignore audio failures if browser blocks autoplay
  }
}

// Offline IndexedDB Storage Helper for Books
const IDB_NAME = "learnova-reader-cache";
const STORE_NAME = "cached-pdfs";

function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getCachedPdf(id: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result?.data ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function savePdfToCache(id: string, data: ArrayBuffer) {
  try {
    const db = await openCacheDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, data, cachedAt: Date.now() });
  } catch {
    // quota exceeded or private mode
  }
}

function ReaderPage() {
  const { id } = Route.useParams();
  const { books } = useStore();
  const book = books.find((b) => b.id === id);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [err, setErr] = useState("");
  const [who, setWho] = useState("");
  const [page, setPage] = useState(() => Number(localStorage.getItem(`lnv-page-${id}`)) || 1);
  const [zoom, setZoom] = useState(1.15);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("lnv-reader-theme") as Theme) || "sepia");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`lnv-bookmarks-${id}`) || "[]");
    } catch {
      return [];
    }
  });

  // Reading analytics
  const [secondsRead, setSecondsRead] = useState(0);
  const [pagesTurned, setPagesTurned] = useState(0);

  const canvas = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Load and cache PDF (Works 100% Offline once loaded!)
  useEffect(() => {
    let active = true;
    (async () => {
      // 1. Try reading from offline local cache first
      const cached = await getCachedPdf(id);
      if (cached && active) {
        try {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
          const d = await pdfjs.getDocument({ data: new Uint8Array(cached) }).promise;
          if (active) {
            setDoc(d as unknown as Doc);
            const { data: s } = await supabase.auth.getSession();
            if (s.session) setWho(s.session.user.email ?? "");
            return;
          }
        } catch {
          // If cached buffer fails, fallback to network
        }
      }

      // 2. Fetch via network & save into offline cache
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        if (active) setErr("signin");
        return;
      }
      if (active) setWho(s.session.user.email ?? "");

      const { data: link, error } = await supabase.rpc("reader_pdf_link", { _book_id: id });
      if (error || !link) {
        if (active) setErr("locked");
        return;
      }

      try {
        const res = await fetch(link as string);
        const arrayBuffer = await res.arrayBuffer();
        await savePdfToCache(id, arrayBuffer);

        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const d = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        if (active) setDoc(d as unknown as Doc);
      } catch {
        if (active) setErr("load");
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  // Reading time counter
  useEffect(() => {
    const timer = setInterval(() => setSecondsRead((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Page turn function with animation & paper sound
  const changePage = useCallback(
    (target: number, dir: "next" | "prev") => {
      if (!doc) return;
      const valid = Math.min(Math.max(1, target), doc.numPages);
      if (valid === page) return;

      if (soundEnabled) playPageTurnSound();
      setFlipDirection(dir);
      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 260);

      setPage(valid);
      setPagesTurned((c) => c + 1);
    },
    [doc, page, soundEnabled]
  );

  // Render Page on Canvas
  useEffect(() => {
    if (!doc || !canvas.current) return;
    const p = Math.min(Math.max(1, page), doc.numPages);
    localStorage.setItem(`lnv-page-${id}`, String(p));

    let task: { cancel: () => void } | null = null;
    doc.getPage(p).then((pg) => {
      const dpr = window.devicePixelRatio || 1;
      const vp = pg.getViewport({ scale: zoom * dpr });
      const c = canvas.current!;
      c.width = vp.width;
      c.height = vp.height;
      c.style.width = `${vp.width / dpr}px`;
      task = pg.render({ canvasContext: c.getContext("2d")!, viewport: vp });
    });

    return () => task?.cancel();
  }, [doc, page, zoom, id]);

  // Toggle Theme
  const cycleTheme = () => {
    const next: Theme = theme === "light" ? "sepia" : theme === "sepia" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("lnv-reader-theme", next);
  };

  // Toggle Bookmark
  const toggleBookmark = () => {
    let next: number[];
    if (bookmarks.includes(page)) {
      next = bookmarks.filter((b) => b !== page);
    } else {
      next = [...bookmarks, page].sort((a, b) => a - b);
    }
    setBookmarks(next);
    localStorage.setItem(`lnv-bookmarks-${id}`, JSON.stringify(next));
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setFullscreen(false);
    }
  };

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 45) {
      if (deltaX < 0) {
        changePage(page + 1, "next");
      } else {
        changePage(page - 1, "prev");
      }
    }
    touchStartX.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown") changePage(page + 1, "next");
      if (e.key === "ArrowLeft" || e.key === "PageUp") changePage(page - 1, "prev");
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [changePage, page]);

  const block = (e: React.SyntheticEvent) => e.preventDefault();

  if (err) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-muted-foreground">
          {err === "signin"
            ? "مهرباني وکړئ لومړی خپل اکاونټ ته ننوځئ."
            : err === "locked"
              ? "دا کتاب لا ستاسو لپاره ندی خلاص شوی. کله چې پیسې واستوئ، موږ به یې په څو شیبو کې خلاص کړو."
              : "کتاب خلاص نشو. انټرنیټ وګورئ او بیا هڅه وکړئ."}
        </p>
        <Link to={err === "signin" ? "/account" : "/library"} className="mt-4 inline-block text-primary underline">
          {err === "signin" ? "ننوتل / Sign in" : "زما کتابتون / My Library"}
        </Link>
      </div>
    );
  }

  // Theme Styles
  const themeBg =
    theme === "dark"
      ? "bg-slate-950 text-slate-100"
      : theme === "sepia"
        ? "bg-[#f4ecd8] text-[#2c241b]"
        : "bg-slate-100 text-slate-900";

  const deskBg =
    theme === "dark"
      ? "bg-slate-900/90 border-slate-800"
      : theme === "sepia"
        ? "bg-[#e8dec0] border-[#d8cba7]"
        : "bg-white border-slate-200";

  const canvasFilter =
    theme === "dark"
      ? { filter: "invert(0.92) hue-rotate(180deg) contrast(1.05)" }
      : theme === "sepia"
        ? { filter: "sepia(0.38) contrast(0.96) brightness(0.98)" }
        : undefined;

  const minutesRead = Math.floor(secondsRead / 60);
  const progressPercent = doc ? Math.round((page / doc.numPages) * 100) : 0;
  const estRemainingMinutes = doc ? Math.round((doc.numPages - page) * 1.2) : 0;

  return (
    <div
      ref={containerRef}
      className={`min-h-screen px-2 py-3 select-none transition-colors duration-300 ${themeBg}`}
      onContextMenu={block}
      onCopy={block}
      onDragStart={block}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        @media print {
          body { display: none !important; }
        }
        .page-flip-anim-next {
          animation: flipNext 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .page-flip-anim-prev {
          animation: flipPrev 0.26s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes flipNext {
          0% { transform: scale(0.98) translateX(12px) rotateY(-3deg); opacity: 0.7; }
          100% { transform: scale(1) translateX(0) rotateY(0deg); opacity: 1; }
        }
        @keyframes flipPrev {
          0% { transform: scale(0.98) translateX(-12px) rotateY(3deg); opacity: 0.7; }
          100% { transform: scale(1) translateX(0) rotateY(0deg); opacity: 1; }
        }
      `}</style>

      {/* Top Controls Bar */}
      <div className={`sticky top-2 z-20 mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 shadow-md backdrop-blur-md transition-colors ${deskBg}`}>
        <div className="flex items-center gap-2">
          <Link to="/library" className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">کتابتون</span>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <p className="line-clamp-1 max-w-[180px] sm:max-w-[280px] text-xs sm:text-sm font-semibold">
            {book?.title ?? "Learnova Reader"}
          </p>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-xs">
          {/* Zoom */}
          <button aria-label="کوچنول" onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))} className="rounded-lg border p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button aria-label="لویول" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} className="rounded-lg border p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            <ZoomIn className="h-4 w-4" />
          </button>

          {/* Theme switcher */}
          <button aria-label="رنګ بدلول" onClick={cycleTheme} className="flex items-center gap-1 rounded-lg border px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : theme === "sepia" ? <Palette className="h-4 w-4 text-amber-700" /> : <Moon className="h-4 w-4" />}
            <span className="hidden md:inline capitalize">{theme}</span>
          </button>

          {/* Sound toggle */}
          <button aria-label="د پاڼې غږ" onClick={() => setSoundEnabled((s) => !s)} className={`rounded-lg border p-1.5 hover:bg-black/5 dark:hover:bg-white/5 ${soundEnabled ? "text-primary" : "opacity-40"}`}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Bookmark */}
          <button aria-label="بوک مارک" onClick={toggleBookmark} className={`rounded-lg border p-1.5 hover:bg-black/5 dark:hover:bg-white/5 ${bookmarks.includes(page) ? "text-amber-500 fill-amber-500" : ""}`}>
            {bookmarks.includes(page) ? <BookmarkCheck className="h-4 w-4 text-amber-500" /> : <Bookmark className="h-4 w-4" />}
          </button>

          {/* Fullscreen */}
          <button aria-label="فول سکرین" onClick={toggleFullscreen} className="rounded-lg border p-1.5 hover:bg-black/5 dark:hover:bg-white/5">
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Reading Progress & Analytics Strip */}
      {doc && (
        <div className="mx-auto mt-2 max-w-4xl flex items-center justify-between text-[11px] opacity-75 px-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {minutesRead} دقیقه لوستل
            </span>
            <span>•</span>
            <span>{progressPercent}٪ بشپړ</span>
          </div>
          <div>
            <span>پاتې وخت: تقریباً {estRemainingMinutes} دقيقې</span>
          </div>
        </div>
      )}

      {/* Saved Bookmarks Bar (if any) */}
      {bookmarks.length > 0 && (
        <div className="mx-auto mt-2 max-w-4xl flex items-center gap-1.5 overflow-x-auto py-1 px-3 text-xs">
          <span className="opacity-70 text-[11px]">نښه شوې پاڼې:</span>
          {bookmarks.map((b) => (
            <button
              key={b}
              onClick={() => changePage(b, b > page ? "next" : "prev")}
              className={`rounded px-2 py-0.5 border text-[11px] font-medium transition ${b === page ? "bg-amber-500 text-white border-amber-600" : "bg-card/70 hover:bg-card"}`}
            >
              مخ {b}
            </button>
          ))}
        </div>
      )}

      {/* Main Book Desk & Page */}
      {!doc ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm opacity-70">کتاب د پرانیستلو په حال کې دی...</p>
        </div>
      ) : (
        <div className="mx-auto mt-3 max-w-4xl">
          <div className={`relative mx-auto overflow-hidden rounded-2xl border p-2 sm:p-4 shadow-2xl transition-all ${deskBg}`}>
            <div
              className={`relative mx-auto w-fit transition-transform duration-200 ${
                isFlipping ? (flipDirection === "next" ? "page-flip-anim-next" : "page-flip-anim-prev") : ""
              }`}
            >
              <canvas ref={canvas} className="block rounded-lg shadow-lg" style={canvasFilter} />

              {/* Protective Watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <p className="-rotate-30 whitespace-nowrap text-xl sm:text-2xl font-bold tracking-wider text-primary/10 select-none">
                  {who || "Learnova"} • Learnova Protected
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => changePage(page - 1, "prev")}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              مخکینی
            </button>

            <div className="rounded-xl border px-4 py-1.5 text-center text-xs sm:text-sm font-semibold shadow-sm">
              پاڼه {page} / {doc.numPages}
            </div>

            <button
              onClick={() => changePage(page + 1, "next")}
              disabled={page >= doc.numPages}
              className="flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
            >
              راتلونکی
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
  Palette,
  Volume2,
  VolumeX,
  Highlighter,
  Share2,
  Check,
  X,
  Sparkles,
  Eraser,
  RotateCcw,
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
type Highlight = {
  id: string;
  page: number;
  x: number; // Left percentage (0-100)
  y: number; // Top percentage (0-100)
  w: number; // Width percentage (0-100)
  h: number; // Height percentage (0-100)
  color: string;
};

// Realistic Dual-Layer Paper Page-Turn Sound Synthesizer via Web Audio API
function playPageTurnSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const dur1 = 0.22;
    const bufSize1 = ctx.sampleRate * dur1;
    const buf1 = ctx.createBuffer(1, bufSize1, ctx.sampleRate);
    const d1 = buf1.getChannelData(0);
    for (let i = 0; i < bufSize1; i++) {
      d1[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize1 * 0.42));
    }
    const src1 = ctx.createBufferSource();
    src1.buffer = buf1;
    const filter1 = ctx.createBiquadFilter();
    filter1.type = "bandpass";
    filter1.frequency.setValueAtTime(850, ctx.currentTime);
    filter1.Q.setValueAtTime(1.2, ctx.currentTime);
    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.22, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur1);
    src1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);
    src1.start();
    src1.stop(ctx.currentTime + dur1);

    const dur2 = 0.16;
    const bufSize2 = ctx.sampleRate * dur2;
    const buf2 = ctx.createBuffer(1, bufSize2, ctx.sampleRate);
    const d2 = buf2.getChannelData(0);
    for (let i = 0; i < bufSize2; i++) {
      d2[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize2 * 0.25));
    }
    const src2 = ctx.createBufferSource();
    src2.buffer = buf2;
    const filter2 = ctx.createBiquadFilter();
    filter2.type = "highpass";
    filter2.frequency.setValueAtTime(1800, ctx.currentTime);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.09, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur2);
    src2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);
    src2.start();
    src2.stop(ctx.currentTime + dur2);
  } catch {
    // audio fallback
  }
}

// IndexedDB Offline Cache
const DB_NAME = "learnova-offline-reader";
const DB_VERSION = 1;
const STORE_NAME = "cached-books";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
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

async function getCachedPdf(bookId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(bookId);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function savePdfToCache(bookId: string, data: ArrayBuffer): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: bookId, data, cachedAt: Date.now() });
  } catch {
    // ignore
  }
}

function ReaderPage() {
  const { id } = Route.useParams();
  const { books } = useStore();
  const book = books.find((b) => b.id === id);

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [page, setPage] = useState<number>(() => {
    const saved = localStorage.getItem(`lnv-page-${id}`);
    return saved ? parseInt(saved, 10) || 1 : 1;
  });
  const [zoom, setZoom] = useState(1.0);
  const [err, setErr] = useState<string | null>(null);
  const [who, setWho] = useState<string>("");

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("lnv-reader-theme") as Theme) || "light";
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`lnv-bookmarks-${id}`) || "[]");
    } catch {
      return [];
    }
  });
  const [secondsRead, setSecondsRead] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Flip Animation state
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next");

  // Highlighter & Eraser state
  const [highlightMode, setHighlightMode] = useState(false);
  const [activeColor, setActiveColor] = useState<"yellow" | "green" | "pink">("yellow");
  const [isEraser, setIsEraser] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`lnv-highlights-${id}`) || "[]");
    } catch {
      return [];
    }
  });

  const touchStartX = useRef<number | null>(null);

  // Anti-screenshot & copy protection
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    window.addEventListener("contextmenu", block);
    window.addEventListener("copy", block);
    return () => {
      window.removeEventListener("contextmenu", block);
      window.removeEventListener("copy", block);
    };
  }, []);

  // Fetch or retrieve cached PDF
  useEffect(() => {
    let active = true;

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (sess?.session?.user?.email) {
        setWho(sess.session.user.email);
      }

      const cachedData = await getCachedPdf(id);
      if (cachedData && active) {
        try {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
          const d = await pdfjs.getDocument({ data: new Uint8Array(cachedData) }).promise;
          if (active) {
            setDoc(d as unknown as Doc);
            return;
          }
        } catch {
          // fallback to network
        }
      }

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

  // Reading timer
  useEffect(() => {
    const timer = setInterval(() => setSecondsRead((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Page turn function
  const changePage = useCallback(
    (target: number, dir: "next" | "prev") => {
      if (!doc) return;
      const valid = Math.min(Math.max(1, target), doc.numPages);
      if (valid === page) return;

      if (soundEnabled) playPageTurnSound();
      setFlipDirection(dir);
      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 340);

      setPage(valid);
    },
    [doc, page, soundEnabled]
  );

  // Render Page on Canvas with Auto-fit to Mobile Screen
  useEffect(() => {
    if (!doc || !canvas.current) return;
    const p = Math.min(Math.max(1, page), doc.numPages);
    localStorage.setItem(`lnv-page-${id}`, String(p));

    let task: { cancel: () => void } | null = null;
    doc.getPage(p).then((pg) => {
      const dpr = window.devicePixelRatio || 1;
      const unscaled = pg.getViewport({ scale: 1 });

      // Calculate perfect scale so it fits the mobile / desktop width automatically
      const availWidth = Math.min(window.innerWidth - 12, 820);
      const baseScale = availWidth > 0 ? availWidth / unscaled.width : 1;
      const finalScale = baseScale * zoom;

      const vp = pg.getViewport({ scale: finalScale * dpr });
      const c = canvas.current!;
      c.width = vp.width;
      c.height = vp.height;
      c.style.width = `${vp.width / dpr}px`;
      c.style.height = `${vp.height / dpr}px`;

      task = pg.render({ canvasContext: c.getContext("2d")!, viewport: vp });
    });

    return () => task?.cancel();
  }, [doc, page, zoom, id, fullscreen]);

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

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    const elem = containerRef.current as any;
    if (!document.fullscreenElement) {
      if (elem?.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem?.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
      setFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Calculate coordinates relative to canvas
  const getCanvasRelativePoint = (clientX: number, clientY: number) => {
    if (!canvasWrapperRef.current) return null;
    const rect = canvasWrapperRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  // Drag-to-Highlight handlers
  const handleStartHighlight = (clientX: number, clientY: number) => {
    if (!highlightMode || isEraser) return;
    const pt = getCanvasRelativePoint(clientX, clientY);
    if (pt) {
      setDragStart(pt);
      setDragCurrent(pt);
    }
  };

  const handleMoveHighlight = (clientX: number, clientY: number) => {
    if (!highlightMode || !dragStart || isEraser) return;
    const pt = getCanvasRelativePoint(clientX, clientY);
    if (pt) {
      setDragCurrent(pt);
    }
  };

  const handleEndHighlight = () => {
    if (!highlightMode || !dragStart || !dragCurrent || isEraser) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const x = Math.min(dragStart.x, dragCurrent.x);
    const y = Math.min(dragStart.y, dragCurrent.y);
    const w = Math.max(Math.abs(dragCurrent.x - dragStart.x), 4);
    const h = Math.max(Math.abs(dragCurrent.y - dragStart.y), 2.2);

    if (w > 2 || h > 2) {
      const colorHex = activeColor === "yellow" ? "#fef08a" : activeColor === "green" ? "#bbf7d0" : "#fbcfe8";
      const newHl: Highlight = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        page,
        x,
        y,
        w,
        h,
        color: colorHex,
      };

      const next = [...highlights, newHl];
      setHighlights(next);
      localStorage.setItem(`lnv-highlights-${id}`, JSON.stringify(next));
    }

    setDragStart(null);
    setDragCurrent(null);
  };

  // Remove Single Highlight
  const removeHighlight = (hlId: string) => {
    const next = highlights.filter((h) => h.id !== hlId);
    setHighlights(next);
    localStorage.setItem(`lnv-highlights-${id}`, JSON.stringify(next));
  };

  // Clear all highlights on this page
  const clearPageHighlights = () => {
    const next = highlights.filter((h) => h.page !== page);
    setHighlights(next);
    localStorage.setItem(`lnv-highlights-${id}`, JSON.stringify(next));
  };

  // Share with 5% discount invite
  const handleShareInvite = async () => {
    const shareUrl = `${window.location.origin}/books/${id}`;
    const shareText = `سلام! دغه کتاب «${book?.title ?? "کتاب"}» په Learnova Books کې وګورئ. د ملګري په بلنه ۵٪ تخفیف ترلاسه کړئ:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: book?.title ?? "Learnova Books",
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // fallback
      }
    }

    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2800);
  };

  // Touch Swipe Handlers for mobile page turn
  const handleTouchStart = (e: React.TouchEvent) => {
    if (highlightMode) {
      handleStartHighlight(e.touches[0].clientX, e.touches[0].clientY);
    } else {
      touchStartX.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (highlightMode) {
      handleMoveHighlight(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (highlightMode) {
      handleEndHighlight();
      return;
    }

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

  if (err === "locked") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <BookCheckIcon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">دا کتاب بند دی</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          د دې کتاب د لوستلو لپاره، لومړی یې بیه تادیه کړئ او د خپل اکاونټ ایمیل اډمین ته د واټساف له لارې ولېږئ.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to={`/books/${id}`} className="rounded-xl border px-4 py-2 text-sm hover:bg-muted">
            د کتاب جزیات
          </Link>
          <Link to="/library" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            زما کتابتون
          </Link>
        </div>
      </div>
    );
  }

  const themeBg =
    theme === "dark"
      ? "bg-stone-950 text-stone-100"
      : theme === "sepia"
        ? "bg-[#f4ecd8] text-[#433422]"
        : "bg-stone-100 text-stone-900";

  const deskBg =
    theme === "dark"
      ? "bg-stone-900/90 border-stone-800"
      : theme === "sepia"
        ? "bg-[#ede2c8] border-[#dfd2b2]"
        : "bg-white border-stone-200";

  const canvasFilter =
    theme === "dark"
      ? { filter: "invert(0.92) hue-rotate(180deg) contrast(0.95)" }
      : theme === "sepia"
        ? { filter: "sepia(0.38) contrast(0.96) brightness(0.98)" }
        : undefined;

  const minutesRead = Math.floor(secondsRead / 60);
  const progressPercent = doc ? Math.round((page / doc.numPages) * 100) : 0;
  const pageHighlights = highlights.filter((h) => h.page === page);

  // Active drag preview box
  const dragBox =
    dragStart && dragCurrent
      ? {
          x: Math.min(dragStart.x, dragCurrent.x),
          y: Math.min(dragStart.y, dragCurrent.y),
          w: Math.max(Math.abs(dragCurrent.x - dragStart.x), 2),
          h: Math.max(Math.abs(dragCurrent.y - dragStart.y), 2),
        }
      : null;

  return (
    <div
      ref={containerRef}
      className={`min-h-screen select-none transition-colors duration-300 ${fullscreen ? "p-0" : "px-2 py-3"} ${themeBg}`}
    >
      <style>{`
        .page-flip-anim-next {
          animation: realisticFlipNext 0.34s cubic-bezier(0.25, 1, 0.5, 1);
          transform-origin: left center;
        }
        .page-flip-anim-prev {
          animation: realisticFlipPrev 0.34s cubic-bezier(0.25, 1, 0.5, 1);
          transform-origin: right center;
        }
        @keyframes realisticFlipNext {
          0% {
            transform: rotateY(-8deg) scale(0.97) translateX(10px);
            box-shadow: -15px 15px 30px rgba(0,0,0,0.22);
            opacity: 0.8;
          }
          100% {
            transform: rotateY(0deg) scale(1) translateX(0);
            box-shadow: 0 10px 25px rgba(0,0,0,0.12);
            opacity: 1;
          }
        }
        @keyframes realisticFlipPrev {
          0% {
            transform: rotateY(8deg) scale(0.97) translateX(-10px);
            box-shadow: 15px 15px 30px rgba(0,0,0,0.22);
            opacity: 0.8;
          }
          100% {
            transform: rotateY(0deg) scale(1) translateX(0);
            box-shadow: 0 10px 25px rgba(0,0,0,0.12);
            opacity: 1;
          }
        }
      `}</style>

      {/* Top Controls Bar */}
      <div
        className={`sticky top-1 z-20 mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-1.5 rounded-xl border p-2 shadow-md backdrop-blur-md transition-colors ${deskBg}`}
      >
        <div className="flex items-center gap-2">
          <Link to="/library" className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium hover:opacity-80">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">کتابتون</span>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <p className="line-clamp-1 max-w-[130px] sm:max-w-[240px] text-xs sm:text-sm font-semibold">
            {book?.title ?? "Learnova Reader"}
          </p>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1 text-xs flex-wrap">
          {/* Zoom */}
          <button
            aria-label="کوچنول"
            onClick={() => setZoom((z) => Math.max(0.7, z - 0.15))}
            className="rounded-lg border p-1.5 hover:bg-black/5 dark:hover:bg-white/5"
            title="کوچنول"
          >
            <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
          <button
            aria-label="لویول"
            onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
            className="rounded-lg border p-1.5 hover:bg-black/5 dark:hover:bg-white/5"
            title="لویول"
          >
            <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>

          {/* Theme switcher */}
          <button
            aria-label="رنګ بدلول"
            onClick={cycleTheme}
            className="flex items-center gap-1 rounded-lg border px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
            title="شالید بدلول"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
            ) : theme === "sepia" ? (
              <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700" />
            ) : (
              <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
            <span className="hidden md:inline capitalize">{theme}</span>
          </button>

          {/* Sound toggle */}
          <button
            aria-label="د پاڼې غږ"
            onClick={() => setSoundEnabled((s) => !s)}
            className={`rounded-lg border p-1.5 hover:bg-black/5 dark:hover:bg-white/5 ${soundEnabled ? "text-primary font-bold" : "opacity-40"}`}
            title="د کاغذ غږ"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>

          {/* Highlighter toggle */}
          <button
            aria-label="هایلایټ"
            onClick={() => {
              setHighlightMode((h) => !h);
              setIsEraser(false);
            }}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1.5 transition ${
              highlightMode
                ? "bg-amber-400/25 border-amber-500 text-amber-700 dark:text-amber-300 font-semibold"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            }`}
            title="د قلم هایلایټ"
          >
            <Highlighter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">هایلایټ</span>
          </button>

          {/* Bookmark */}
          <button
            aria-label="بوک مارک"
            onClick={toggleBookmark}
            className={`rounded-lg border p-1.5 hover:bg-black/5 dark:hover:bg-white/5 ${bookmarks.includes(page) ? "text-amber-500 fill-amber-500" : ""}`}
            title="نښه کول"
          >
            {bookmarks.includes(page) ? <BookmarkCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" /> : <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>

          {/* Fullscreen */}
          <button
            aria-label="فول سکرین"
            onClick={toggleFullscreen}
            className={`rounded-lg border p-1.5 transition ${fullscreen ? "bg-primary text-primary-foreground" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
            title="بشپړ سکرین (F)"
          >
            {fullscreen ? <Minimize className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
          </button>
        </div>
      </div>

      {/* Highlighter Toolbar (Drag & Erase Palette) */}
      {highlightMode && (
        <div
          className={`mx-auto mt-2 max-w-4xl flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2 text-xs shadow-sm backdrop-blur ${deskBg}`}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-amber-600 dark:text-amber-400">حالت:</span>

            {/* Colors */}
            <button
              onClick={() => {
                setIsEraser(false);
                setActiveColor("yellow");
              }}
              className={`h-5 w-5 rounded-full bg-yellow-200 border-2 transition ${!isEraser && activeColor === "yellow" ? "border-amber-600 scale-110 shadow" : "border-transparent"}`}
              title="ژېړ هایلایټ"
            />
            <button
              onClick={() => {
                setIsEraser(false);
                setActiveColor("green");
              }}
              className={`h-5 w-5 rounded-full bg-emerald-200 border-2 transition ${!isEraser && activeColor === "green" ? "border-emerald-600 scale-110 shadow" : "border-transparent"}`}
              title="شین هایلایټ"
            />
            <button
              onClick={() => {
                setIsEraser(false);
                setActiveColor("pink");
              }}
              className={`h-5 w-5 rounded-full bg-pink-200 border-2 transition ${!isEraser && activeColor === "pink" ? "border-pink-600 scale-110 shadow" : "border-transparent"}`}
              title="ګلابي هایلایټ"
            />

            <div className="h-4 w-px bg-border/60 mx-1" />

            {/* Eraser Tool */}
            <button
              onClick={() => setIsEraser((e) => !e)}
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition ${
                isEraser
                  ? "bg-red-500/20 border-red-500 text-red-600 font-semibold"
                  : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              title="پاکوونکی"
            >
              <Eraser className="h-3.5 w-3.5" />
              <span>پاکوونکی</span>
            </button>

            {/* Clear all page highlights */}
            {pageHighlights.length > 0 && (
              <button
                onClick={clearPageHighlights}
                className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] opacity-75 hover:opacity-100 hover:text-red-500"
                title="د پاڼې ټول هایلایټونه پاک کړه"
              >
                <RotateCcw className="h-3 w-3" />
                <span>ټول پاک کړه</span>
              </button>
            )}

            <span className="text-[11px] opacity-75">
              {isEraser ? "(په هایلایټ کلیک وکړئ ترڅو پاک شي)" : "(ګوته پر پاڼه راکاږئ)"}
            </span>
          </div>

          <button
            onClick={() => setHighlightMode(false)}
            className="text-xs opacity-60 hover:opacity-100 flex items-center gap-0.5"
          >
            <X className="h-3.5 w-3.5" />
            بندول
          </button>
        </div>
      )}

      {/* 5% Discount Invite & Share Banner */}
      {!fullscreen && (
        <div className="mx-auto mt-2 max-w-4xl flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-primary/10 to-emerald-500/15 border border-primary/25 px-3 py-1.5 shadow-sm text-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="line-clamp-1">د یو ملګري په دعوت کولو ۵ فیصده تخفیف!</span>
          </div>
          <button
            onClick={handleShareInvite}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow transition hover:opacity-90 active:scale-95 shrink-0"
          >
            {shareCopied ? (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>کاپي شو!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                <span>بلنه ولېږئ</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Reading Progress & Analytics Strip */}
      {doc && !fullscreen && (
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
            <span>ټول مخونه: {doc.numPages}</span>
          </div>
        </div>
      )}

      {/* Saved Bookmarks Bar (if any) */}
      {bookmarks.length > 0 && !fullscreen && (
        <div className="mx-auto mt-2 max-w-4xl flex items-center gap-1.5 overflow-x-auto py-1 px-3 text-xs">
          <span className="opacity-70 text-[11px] shrink-0">نښه شوې پاڼې:</span>
          {bookmarks.map((b) => (
            <button
              key={b}
              onClick={() => changePage(b, b > page ? "next" : "prev")}
              className={`rounded px-2 py-0.5 border text-[11px] font-medium shrink-0 transition ${
                b === page ? "bg-amber-500 text-white border-amber-600 shadow-sm" : "bg-card/70 hover:bg-card"
              }`}
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
        <div className={`perspective-desk mx-auto ${fullscreen ? "mt-1 w-full" : "mt-2 max-w-4xl"}`}>
          <div
            className={`relative mx-auto overflow-hidden transition-all ${
              fullscreen ? "p-0 border-0 rounded-none shadow-none" : "rounded-2xl border p-1 sm:p-3 shadow-2xl"
            } ${deskBg}`}
          >
            <div
              ref={canvasWrapperRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={(e) => handleStartHighlight(e.clientX, e.clientY)}
              onMouseMove={(e) => handleMoveHighlight(e.clientX, e.clientY)}
              onMouseUp={handleEndHighlight}
              className={`relative mx-auto w-fit transition-transform duration-300 ${
                highlightMode ? (isEraser ? "cursor-pointer touch-none" : "cursor-crosshair touch-none") : ""
              } ${isFlipping ? (flipDirection === "next" ? "page-flip-anim-next" : "page-flip-anim-prev") : ""}`}
            >
              <canvas ref={canvas} className="block rounded shadow-md max-w-full" style={canvasFilter} />

              {/* Dynamic Highlighter Overlays for Current Page */}
              {pageHighlights.map((hl) => (
                <div
                  key={hl.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHighlight(hl.id);
                  }}
                  style={{
                    left: `${hl.x}%`,
                    top: `${hl.y}%`,
                    width: `${hl.w}%`,
                    height: `${hl.h}%`,
                    backgroundColor: hl.color,
                  }}
                  className="group absolute rounded opacity-45 mix-blend-multiply transition hover:opacity-80 cursor-pointer"
                  title="د پاکولو لپاره کلیک وکړئ"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHighlight(hl.id);
                    }}
                    className="absolute -right-2 -top-2 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white shadow text-[10px] group-hover:flex"
                    title="پاکول"
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Active Drag Highlight Preview Rectangle */}
              {dragBox && !isEraser && (
                <div
                  style={{
                    left: `${dragBox.x}%`,
                    top: `${dragBox.y}%`,
                    width: `${dragBox.w}%`,
                    height: `${dragBox.h}%`,
                    backgroundColor:
                      activeColor === "yellow" ? "#fef08a" : activeColor === "green" ? "#bbf7d0" : "#fbcfe8",
                  }}
                  className="pointer-events-none absolute border border-dashed border-amber-600/70 opacity-55 mix-blend-multiply"
                />
              )}

              {/* Protective Watermark */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                <p className="-rotate-30 whitespace-nowrap text-lg sm:text-2xl font-bold tracking-wider text-primary/10 select-none">
                  {who || "Learnova"} • Learnova Protected
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-3 pb-4 flex items-center justify-center gap-3">
            <button
              onClick={() => changePage(page - 1, "prev")}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
              مخکینی
            </button>

            <div className="rounded-xl border px-3 sm:px-4 py-1 text-center text-xs sm:text-sm font-semibold shadow-sm">
              پاڼه {page} / {doc.numPages}
            </div>

            <button
              onClick={() => changePage(page + 1, "next")}
              disabled={page >= doc.numPages}
              className="flex items-center gap-1 rounded-xl border px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm transition hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30"
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

function BookCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

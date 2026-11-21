import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Headphones,
  Flame,
  StickyNote,
  Timer,
  CloudRain,
  Wind,
  Waves,
  Music,
  Copy,
  Download,
  Play,
  Pause,
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
      { property: "og:description", content: "Protected online reader for Learnova Books." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReaderPage,
});

/* ───────────────────────── types & constants ───────────────────────── */

type PdfDoc = { numPages: number; getPage: (n: number) => Promise<any> };
type Theme = "light" | "sepia" | "dark";
type Highlight = { id: string; page: number; x: number; y: number; w: number; h: number; color: string };
type Flip = { from: number; to: number; dir: "next" | "prev" };
type View = { left: number | null; right: number | null };
type Renderer = {
  peek: (n: number, w: number) => HTMLCanvasElement | null;
  render: (n: number, w: number) => Promise<HTMLCanvasElement>;
};
type Ambient = "rain" | "wind" | "waves" | "fire" | "calm";
type Panel = null | "sound" | "habit" | "share" | "notes" | "focus";
type Habit = { goal: number; days: Record<string, number> };

const FLIP_MS = 760;
const FLIP_EASE = "cubic-bezier(0.45, 0.05, 0.25, 1)";
const HL_COLORS = { yellow: "#fef08a", green: "#bbf7d0", pink: "#fbcfe8" } as const;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

const AMBIENTS: { id: Ambient; label: string }[] = [
  { id: "rain", label: "د باران څاڅکي" },
  { id: "wind", label: "باد" },
  { id: "waves", label: "د سمندر څپې" },
  { id: "fire", label: "اور" },
  { id: "calm", label: "ارامه موسیقي" },
];
const GOALS = [10, 20, 30, 45, 60];
const WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

/* A "spread" is what is visible at once.
   Two-page mode: spread 0 = cover on the right; spread s = pages (2s, 2s+1).
   One-page mode: spread = page number. */
const viewOf = (s: number, dbl: boolean, total: number): View =>
  dbl
    ? {
        left: s >= 1 && 2 * s <= total ? 2 * s : null,
        right: 2 * s + 1 <= total ? 2 * s + 1 : null,
      }
    : { left: null, right: s >= 1 && s <= total ? s : null };
const spreadOf = (p: number, dbl: boolean) => (dbl ? Math.floor(p / 2) : p);
const anchorOf = (v: View) => v.right ?? v.left ?? 1;

/* ───────────────────────── reading habit helpers ───────────────────────── */

const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const loadHabit = (): Habit => {
  try {
    const h = JSON.parse(localStorage.getItem("lnv-habit") || "");
    return { goal: h.goal || 20, days: h.days || {} };
  } catch {
    return { goal: 20, days: {} };
  }
};

const fmtClock = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

/* ───────────────────────── audio: page turn, chime, ambient sounds ─────────
   Everything is generated inside the browser (no audio files, no data use).
   For a real paper sound, put a recording at  public/sounds/page-turn.mp3  */

let pageAudio: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return null;
    audioCtx = audioCtx || new AC();
    audioCtx!.resume?.();
    return audioCtx;
  } catch {
    return null;
  }
}

function synthPageTurn() {
  const ctx = getCtx();
  if (!ctx) return;
  const burst = (dur: number, type: BiquadFilterType, freq: number, vol: number, decay: number, delay = 0) => {
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n * decay));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(f);
    f.connect(g);
    g.connect(ctx.destination);
    src.start(ctx.currentTime + delay);
  };
  burst(0.28, "bandpass", 900, 0.22, 0.4);
  burst(0.16, "highpass", 1800, 0.09, 0.25, 0.12);
}

function playPageTurnSound() {
  try {
    pageAudio = pageAudio || Object.assign(new Audio("/sounds/page-turn.mp3"), { preload: "auto" });
    const a = pageAudio.cloneNode(true) as HTMLAudioElement;
    a.volume = 0.85;
    a.play().catch(synthPageTurn);
  } catch {
    synthPageTurn();
  }
}

function chime() {
  const ctx = getCtx();
  if (!ctx) return;
  [660, 880].forEach((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    const t = ctx.currentTime + i * 0.18;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 1);
  });
}

function noiseBuffer(ctx: AudioContext, kind: "white" | "brown", secs = 3) {
  const n = Math.floor(ctx.sampleRate * secs);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === "white") d[i] = w;
    else {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    }
  }
  return buf;
}

function loopNoise(ctx: AudioContext, kind: "white" | "brown") {
  const s = ctx.createBufferSource();
  s.buffer = noiseBuffer(ctx, kind);
  s.loop = true;
  s.start();
  return s;
}

function blip(ctx: AudioContext, dest: AudioNode, freq: number, vol: number, dur: number) {
  const o = ctx.createOscillator();
  o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g);
  g.connect(dest);
  o.start();
  o.stop(ctx.currentTime + dur + 0.02);
}

function crackle(ctx: AudioContext, dest: AudioNode) {
  const len = Math.floor(ctx.sampleRate * (0.015 + Math.random() * 0.03));
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.3));
  const s = ctx.createBufferSource();
  s.buffer = b;
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 1200 + Math.random() * 2000;
  const g = ctx.createGain();
  g.gain.value = 0.15 + Math.random() * 0.35;
  s.connect(f);
  f.connect(g);
  g.connect(dest);
  s.start();
}

/* soft generative music: slow chords (Am – F – C – G) with a gentle reverb */
function startCalm(ctx: AudioContext, out: GainNode, timers: number[]) {
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1500;
  const conv = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 2.6);
  const imp = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = imp.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  }
  conv.buffer = imp;
  const dry = ctx.createGain();
  dry.gain.value = 0.5;
  const wet = ctx.createGain();
  wet.gain.value = 0.9;
  lp.connect(dry);
  dry.connect(out);
  lp.connect(conv);
  conv.connect(wet);
  wet.connect(out);

  const chords = [
    [110, 220, 261.63, 329.63],
    [87.31, 174.61, 220, 261.63],
    [130.81, 261.63, 329.63, 392],
    [98, 196, 246.94, 293.66],
  ];
  let idx = 0;
  const pad = () => {
    const t = ctx.currentTime;
    chords[idx % chords.length].forEach((f) => {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.07, t + 2.2);
      g.gain.linearRampToValueAtTime(0.0001, t + 7);
      o.connect(g);
      g.connect(lp);
      o.start(t);
      o.stop(t + 7.2);
    });
    idx++;
  };
  const pluck = () => {
    const notes = [440, 493.88, 523.25, 587.33, 659.25, 783.99];
    const f = notes[Math.floor(Math.random() * notes.length)];
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g);
    g.connect(lp);
    o.start(t);
    o.stop(t + 2.5);
  };
  pad();
  timers.push(window.setInterval(pad, 6000));
  timers.push(
    window.setInterval(() => {
      if (Math.random() < 0.7) pluck();
    }, 2300)
  );
}

let amb: { gain: GainNode; stops: (() => void)[]; timers: number[] } | null = null;

function stopAmbient(immediate = false) {
  const a = amb;
  if (!a) return;
  amb = null;
  a.timers.forEach((t) => window.clearInterval(t));
  const ctx = audioCtx;
  if (ctx) {
    try {
      a.gain.gain.cancelScheduledValues(ctx.currentTime);
      a.gain.gain.setValueAtTime(a.gain.gain.value, ctx.currentTime);
      a.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + (immediate ? 0.05 : 0.6));
    } catch {
      // ignore
    }
  }
  window.setTimeout(
    () => {
      a.stops.forEach((s) => {
        try {
          s();
        } catch {
          // ignore
        }
      });
      try {
        a.gain.disconnect();
      } catch {
        // ignore
      }
    },
    immediate ? 80 : 700
  );
}

function setAmbientVolume(vol: number) {
  if (amb && audioCtx) amb.gain.gain.linearRampToValueAtTime(vol * 0.8, audioCtx.currentTime + 0.1);
}

function startAmbient(kind: Ambient, vol: number) {
  stopAmbient(true);
  const ctx = getCtx();
  if (!ctx) return;
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(ctx.destination);
  out.gain.linearRampToValueAtTime(vol * 0.8, ctx.currentTime + 1.2);
  const stops: (() => void)[] = [];
  const timers: number[] = [];

  const filt = (type: BiquadFilterType, freq: number, q = 0.7) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  };
  const gainNode = (v: number) => {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  };
  const lfo = (hz: number, depth: number, target: AudioParam) => {
    const o = ctx.createOscillator();
    o.frequency.value = hz;
    const g = gainNode(depth);
    o.connect(g);
    g.connect(target);
    o.start();
    stops.push(() => o.stop());
  };
  const noise = (type: "white" | "brown") => {
    const s = loopNoise(ctx, type);
    stops.push(() => s.stop());
    return s;
  };

  if (kind === "rain") {
    const hp = filt("highpass", 700);
    const lp = filt("lowpass", 7500);
    const g = gainNode(0.35);
    noise("white").connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(out);
    timers.push(
      window.setInterval(() => {
        if (Math.random() < 0.65) blip(ctx, out, 1800 + Math.random() * 2600, 0.04 + Math.random() * 0.05, 0.04);
      }, 100)
    );
  } else if (kind === "wind") {
    const bp = filt("bandpass", 500, 0.8);
    const g = gainNode(1.4);
    lfo(0.12, 250, bp.frequency);
    noise("brown").connect(bp);
    bp.connect(g);
    g.connect(out);
  } else if (kind === "waves") {
    const lp = filt("lowpass", 900);
    const g = gainNode(0.55);
    lfo(0.09, 0.5, g.gain);
    noise("brown").connect(lp);
    lp.connect(g);
    g.connect(out);
  } else if (kind === "fire") {
    const lp = filt("lowpass", 600);
    const g = gainNode(0.5);
    noise("brown").connect(lp);
    lp.connect(g);
    g.connect(out);
    timers.push(
      window.setInterval(() => {
        if (Math.random() < 0.55) crackle(ctx, out);
      }, 130)
    );
  } else {
    startCalm(ctx, out, timers);
  }
  amb = { gain: out, stops, timers };
}

/* ───────────────────────── share card (an image made of YOUR words,
   the book title and progress — never the book's own pages) ───────────── */

async function makeShareCard(o: {
  title: string;
  quote: string;
  percent: number;
  streak: number;
  url: string;
}): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return null;
  const FONT = "Tahoma, 'Noto Naskh Arabic', Arial, sans-serif";

  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1c1917");
  bg.addColorStop(1, "#92400e");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.direction = "rtl";
  g.textAlign = "center";
  g.textBaseline = "alphabetic";

  const wrap = (text: string, max: number, font: string) => {
    g.font = font;
    const lines: string[] = [];
    let line = "";
    for (const w of text.split(/\s+/).filter(Boolean)) {
      const t = line ? `${line} ${w}` : w;
      if (g.measureText(t).width > max && line) {
        lines.push(line);
        line = w;
      } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  };

  g.fillStyle = "#fde68a";
  g.font = `bold 56px ${FONT}`;
  g.fillText("Learnova Books", W / 2, 150);

  g.fillStyle = "#ffffff";
  let y = 330;
  wrap(o.title, W - 200, `bold 70px ${FONT}`)
    .slice(0, 3)
    .forEach((l) => {
      g.fillText(l, W / 2, y);
      y += 96;
    });

  if (o.quote) {
    y += 50;
    g.fillStyle = "#fef3c7";
    wrap(`«${o.quote}»`, W - 220, `46px ${FONT}`)
      .slice(0, 9)
      .forEach((l) => {
        g.fillText(l, W / 2, y);
        y += 70;
      });
  }

  g.fillStyle = "rgba(255,255,255,0.18)";
  g.fillRect(140, 1060, 800, 26);
  g.fillStyle = "#fbbf24";
  g.fillRect(140, 1060, (800 * clamp(o.percent, 0, 100)) / 100, 26);

  g.fillStyle = "#ffffff";
  g.font = `bold 44px ${FONT}`;
  g.fillText(`${o.percent}٪ بشپړ شو`, W / 2, 1150);
  if (o.streak > 0) {
    g.fillStyle = "#fdba74";
    g.fillText(`🔥 ${o.streak} ورځې پرله پسې لوستل`, W / 2, 1215);
  }

  g.direction = "ltr";
  g.fillStyle = "#d6d3d1";
  g.font = `30px ${FONT}`;
  g.fillText(o.url.replace(/^https?:\/\//, ""), W / 2, 1295);

  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
}

/* ───────────────────────── page renderer + cache ─────────────────────────
   Pages are drawn to canvases and kept in a small in-memory cache so that
   turning a page is instant. Nothing is written to disk. */

const MAX_CACHE = 16;

function usePageRenderer(doc: PdfDoc | null): Renderer {
  const cache = useRef(new Map<string, HTMLCanvasElement>());
  const pending = useRef(new Map<string, Promise<HTMLCanvasElement>>());

  useEffect(() => {
    cache.current.clear();
    pending.current.clear();
  }, [doc]);

  const keyOf = (n: number, w: number) => `${n}|${Math.round(w)}`;

  const peek = useCallback((n: number, w: number) => cache.current.get(keyOf(n, w)) ?? null, []);

  const render = useCallback(
    (n: number, w: number) => {
      if (!doc) return Promise.reject(new Error("no document"));
      const key = keyOf(n, w);
      const hit = cache.current.get(key);
      if (hit) return Promise.resolve(hit);
      const inflight = pending.current.get(key);
      if (inflight) return inflight;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const p = doc.getPage(n).then(async (pg) => {
        const base = pg.getViewport({ scale: 1 });
        const vp = pg.getViewport({ scale: (w * dpr) / base.width });
        const c = document.createElement("canvas");
        c.width = Math.floor(vp.width);
        c.height = Math.floor(vp.height);
        await pg.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
        cache.current.set(key, c);
        if (cache.current.size > MAX_CACHE) {
          const first = cache.current.keys().next().value;
          if (first) cache.current.delete(first);
        }
        pending.current.delete(key);
        return c;
      });
      pending.current.set(key, p);
      return p;
    },
    [doc]
  );

  return useMemo(() => ({ peek, render }), [peek, render]);
}

/* ───────────────────────── one page of the book ───────────────────────── */

function PageFace(props: {
  n: number | null;
  w: number;
  h: number;
  side: "left" | "right";
  r: Renderer;
  filter?: string;
  who: string;
  hls: Highlight[];
  hlMode: boolean;
  eraser: boolean;
  color: string;
  onAdd: (h: Omit<Highlight, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const { n, w, h, side, r, filter, who, hls, hlMode, eraser, color, onAdd, onRemove } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  useEffect(() => {
    if (n == null) return;
    let alive = true;
    const draw = (src: HTMLCanvasElement) => {
      const el = ref.current;
      if (!alive || !el) return;
      el.width = src.width;
      el.height = src.height;
      el.getContext("2d")!.drawImage(src, 0, 0);
    };
    const hit = r.peek(n, w);
    if (hit) draw(hit);
    else r.render(n, w).then(draw).catch(() => {});
    return () => {
      alive = false;
    };
  }, [n, w, r]);

  const pt = (e: React.PointerEvent) => {
    const b = e.currentTarget.getBoundingClientRect();
    return {
      x: clamp(((e.clientX - b.left) / b.width) * 100, 0, 100),
      y: clamp(((e.clientY - b.top) / b.height) * 100, 0, 100),
    };
  };

  const down = (e: React.PointerEvent) => {
    if (!hlMode || eraser || n == null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = pt(e);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = pt(e);
    setDrag({ ...drag, x1: p.x, y1: p.y });
  };
  const up = () => {
    if (!drag || n == null) return;
    const x = Math.min(drag.x0, drag.x1);
    const y = Math.min(drag.y0, drag.y1);
    const bw = Math.abs(drag.x1 - drag.x0);
    const bh = Math.abs(drag.y1 - drag.y0);
    if (bw > 1.5 || bh > 1.2) onAdd({ page: n, x, y, w: Math.max(bw, 4), h: Math.max(bh, 2.2), color });
    setDrag(null);
  };

  const spine = side === "left" ? "to left" : "to right";
  const dragBox = drag
    ? {
        x: Math.min(drag.x0, drag.x1),
        y: Math.min(drag.y0, drag.y1),
        w: Math.abs(drag.x1 - drag.x0),
        h: Math.abs(drag.y1 - drag.y0),
      }
    : null;

  return (
    <div
      className="relative select-none overflow-hidden bg-white"
      style={{
        width: w,
        height: h,
        touchAction: hlMode ? "none" : undefined,
        cursor: hlMode ? (eraser ? "pointer" : "crosshair") : undefined,
      }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => setDrag(null)}
    >
      <div className="absolute inset-0 bg-white" style={{ filter }}>
        {n != null && <canvas ref={ref} style={{ width: w, height: h }} className="block" draggable={false} />}
      </div>

      {hls.map((hl) => (
        <div
          key={hl.id}
          onClick={() => eraser && onRemove(hl.id)}
          style={{
            left: `${hl.x}%`,
            top: `${hl.y}%`,
            width: `${hl.w}%`,
            height: `${hl.h}%`,
            backgroundColor: hl.color,
          }}
          className={`absolute rounded opacity-50 mix-blend-multiply ${
            hlMode && eraser ? "cursor-pointer hover:opacity-80" : "pointer-events-none"
          }`}
        />
      ))}

      {dragBox && (
        <div
          className="pointer-events-none absolute border border-dashed border-amber-600/70 opacity-60 mix-blend-multiply"
          style={{
            left: `${dragBox.x}%`,
            top: `${dragBox.y}%`,
            width: `${dragBox.w}%`,
            height: `${dragBox.h}%`,
            backgroundColor: color,
          }}
        />
      )}

      {/* watermark with the reader's email, repeated down the page */}
      {n != null && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-around overflow-hidden">
          {[0, 1, 2].map((i) => (
            <p
              key={i}
              className="-rotate-30 select-none whitespace-nowrap font-bold tracking-wider text-stone-500/20"
              style={{ fontSize: Math.max(11, w / 26) }}
            >
              {who || "Learnova"} • Learnova Protected
            </p>
          ))}
        </div>
      )}

      {/* paper curve toward the spine */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(${spine}, rgba(0,0,0,0.30) 0%, rgba(0,0,0,0.08) 7%, transparent 16%)`,
        }}
      />
    </div>
  );
}

/* ───────────────────────── small UI helper ───────────────────────── */

function Btn(props: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={props.label}
      title={props.label}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`flex items-center justify-center gap-1 rounded-lg border p-1.5 text-xs transition hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/5 ${
        props.active ? "border-amber-500 bg-amber-400/25 text-amber-700 dark:text-amber-300" : ""
      }`}
    >
      {props.children}
    </button>
  );
}

const isField = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === "TEXTAREA" || (t.tagName === "INPUT" && (t as HTMLInputElement).type !== "range"));

/* ───────────────────────── the reader ───────────────────────── */

function ReaderPage() {
  const { id } = Route.useParams();
  const { books } = useStore();
  const book = books.find((b) => b.id === id);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const leafRef = useRef<HTMLDivElement | null>(null);
  const frontShade = useRef<HTMLDivElement | null>(null);
  const backShade = useRef<HTMLDivElement | null>(null);
  const castR = useRef<HTMLDivElement | null>(null);
  const castL = useRef<HTMLDivElement | null>(null);
  const touchX = useRef<number | null>(null);
  const habitRef = useRef<Habit>({ goal: 20, days: {} });
  const metBefore = useRef<boolean | null>(null);

  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [ratio, setRatio] = useState(0.707); // page width / height
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [err, setErr] = useState<string | null>(null);
  const [who, setWho] = useState("");

  const [page, setPage] = useState<number>(() => {
    const saved = localStorage.getItem(`lnv-page-${id}`);
    return saved ? parseInt(saved, 10) || 1 : 1;
  });
  const [flip, setFlip] = useState<Flip | null>(null);
  const [zoom, setZoom] = useState(1);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("lnv-reader-theme") as Theme) || "light");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`lnv-bookmarks-${id}`) || "[]");
    } catch {
      return [];
    }
  });
  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`lnv-highlights-${id}`) || "[]");
    } catch {
      return [];
    }
  });
  const [highlightMode, setHighlightMode] = useState(false);
  const [activeColor, setActiveColor] = useState<keyof typeof HL_COLORS>("yellow");
  const [isEraser, setIsEraser] = useState(false);

  /* new: tools drawer, habit, sounds, notes, focus timer, toast */
  const [panel, setPanel] = useState<Panel>(null);
  const [habit, setHabit] = useState<Habit>(loadHabit);
  const [ambient, setAmbient] = useState<Ambient | null>(null);
  const [ambientVol, setAmbientVol] = useState<number>(() => {
    const v = parseFloat(localStorage.getItem("lnv-ambient-vol") || "");
    return Number.isFinite(v) ? clamp(v, 0, 1) : 0.5;
  });
  const [notes, setNotes] = useState<Record<number, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`lnv-notes-${id}`) || "{}");
    } catch {
      return {};
    }
  });
  const [quote, setQuote] = useState("");
  const [pomo, setPomo] = useState<{ running: boolean; mode: "focus" | "break"; left: number }>({
    running: false,
    mode: "focus",
    left: 25 * 60,
  });
  const prevMode = useRef<"focus" | "break">("focus");
  const [toast, setToast] = useState<string | null>(null);

  const renderer = usePageRenderer(doc);

  /* protection: no right-click, copy, drag, save, print (typing fields stay usable) */
  useEffect(() => {
    const block = (e: Event) => {
      if (isField(e.target)) return;
      e.preventDefault();
    };
    const keys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ["s", "p", "u"].includes(k)) e.preventDefault();
      if (e.key === "PrintScreen") navigator.clipboard?.writeText("").catch(() => {});
    };
    const evts = ["contextmenu", "copy", "cut", "dragstart", "selectstart"];
    evts.forEach((t) => window.addEventListener(t, block));
    window.addEventListener("keydown", keys);
    return () => {
      evts.forEach((t) => window.removeEventListener(t, block));
      window.removeEventListener("keydown", keys);
    };
  }, []);

  /* load the PDF into memory only (no offline cache, no download) */
  useEffect(() => {
    let active = true;
    // remove the full-PDF cache written by the previous version of the reader
    try {
      indexedDB.deleteDatabase("learnova-offline-reader");
    } catch {
      // ignore
    }

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (sess?.session?.user?.email) setWho(sess.session.user.email);

      const { data: link, error } = await supabase.rpc("reader_pdf_link", { _book_id: id });
      if (error || !link) {
        if (active) setErr("locked");
        return;
      }
      try {
        const res = await fetch(link as string);
        if (!res.ok) throw new Error("fetch failed");
        const buf = await res.arrayBuffer();
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        const d = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
        const first = await d.getPage(1);
        const v = first.getViewport({ scale: 1 });
        if (active) {
          setRatio(v.width / v.height);
          setDoc(d as unknown as PdfDoc);
        }
      } catch {
        if (active) setErr("load");
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  /* reading time per day (counts only while the page is visible) */
  useEffect(() => {
    habitRef.current = habit;
  }, [habit]);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setHabit((h) => {
        const k = dayKey();
        return { ...h, days: { ...h.days, [k]: (h.days[k] || 0) + 1 } };
      });
    }, 1000);
    const save = () => localStorage.setItem("lnv-habit", JSON.stringify(habitRef.current));
    const saver = setInterval(save, 10000);
    window.addEventListener("pagehide", save);
    return () => {
      save();
      clearInterval(t);
      clearInterval(saver);
      window.removeEventListener("pagehide", save);
    };
  }, []);

  /* stop ambient sound when leaving the reader */
  useEffect(() => () => stopAmbient(true), []);

  /* toast auto-hide */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  /* celebrate when today's goal is reached */
  useEffect(() => {
    const met = (habit.days[dayKey()] || 0) >= habit.goal * 60;
    if (metBefore.current === null) {
      metBefore.current = met;
      return;
    }
    if (met && !metBefore.current) {
      metBefore.current = true;
      setToast("🎉 د نن ورځې د مطالعې هدف بشپړ شو!");
      chime();
    }
    if (!met) metBefore.current = false;
  }, [habit]);

  /* focus timer (25 min reading, 5 min break) */
  useEffect(() => {
    if (!pomo.running) return;
    const t = setInterval(
      () =>
        setPomo((p) => {
          if (p.left > 1) return { ...p, left: p.left - 1 };
          const nm = p.mode === "focus" ? "break" : "focus";
          return { running: true, mode: nm, left: nm === "focus" ? 25 * 60 : 5 * 60 };
        }),
      1000
    );
    return () => clearInterval(t);
  }, [pomo.running]);

  useEffect(() => {
    if (prevMode.current !== pomo.mode) {
      prevMode.current = pomo.mode;
      chime();
      setToast(pomo.mode === "break" ? "☕ د استراحت وخت دی — ۵ دقیقې" : "📖 بیا د لوستلو وخت دی");
    }
  }, [pomo.mode]);

  /* measure the free space so the book always fits the screen */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [doc]);

  /* ── layout maths ── */
  const total = doc?.numPages ?? 0;
  const dbl = box.w >= 720 && box.w > box.h * 1.1; // two pages only when there is room
  const minS = dbl ? 0 : 1;
  const maxS = dbl ? Math.floor(total / 2) : Math.max(total, 1);
  const s = clamp(spreadOf(page, dbl), minS, maxS);
  const cur = viewOf(s, dbl, total);
  const curPage = anchorOf(cur);
  const progress = total ? Math.round((curPage / total) * 100) : 0;

  const availW = Math.max(box.w - 24, 0);
  const availH = Math.max(box.h - 24, 0);
  const fit = dbl ? Math.min(availW / 2, availH * ratio) : Math.min(availW, availH * ratio);
  const pageW = Math.max(Math.floor(fit * zoom), 0);
  const pageH = Math.floor(pageW / ratio);
  const bookW = dbl ? pageW * 2 : pageW;

  /* ── habit numbers ── */
  const goalSec = habit.goal * 60;
  const todaySec = habit.days[dayKey()] || 0;
  const todayMin = Math.floor(todaySec / 60);
  const goalMet = todaySec >= goalSec;
  const streak = (() => {
    let n = 0;
    const d = new Date();
    if ((habit.days[dayKey(d)] || 0) < goalSec) d.setDate(d.getDate() - 1);
    while ((habit.days[dayKey(d)] || 0) >= goalSec && n < 3650) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  })();
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const sec = habit.days[dayKey(d)] || 0;
    return { label: WEEKDAYS[d.getDay()], met: sec >= goalSec, sec, today: i === 6 };
  });
  const readDays = Object.values(habit.days).filter((v) => v >= 60).length;

  useEffect(() => {
    if (doc) localStorage.setItem(`lnv-page-${id}`, String(curPage));
  }, [doc, curPage, id]);

  /* pre-render neighbouring spreads so turning is instant */
  useEffect(() => {
    if (!doc || !pageW) return;
    [s - 1, s, s + 1, s + 2].forEach((x) => {
      if (x < minS || x > maxS) return;
      const v = viewOf(x, dbl, total);
      [v.left, v.right].forEach((n) => n && renderer.render(n, pageW).catch(() => {}));
    });
  }, [doc, s, dbl, pageW, minS, maxS, total, renderer]);

  /* ── page turning ── */
  const flipTo = useCallback(
    (target: number) => {
      if (!doc || flip) return;
      const t = clamp(target, minS, maxS);
      if (t === s) return;
      if (soundEnabled) playPageTurnSound();
      setFlip({ from: s, to: t, dir: t > s ? "next" : "prev" });
    },
    [doc, flip, minS, maxS, s, soundEnabled]
  );

  useEffect(() => {
    if (!flip || !leafRef.current) return;
    const next = flip.dir === "next";
    const fade = (el: HTMLElement | null, a: number, b: number) =>
      el?.animate([{ opacity: a }, { opacity: b }], { duration: FLIP_MS, easing: FLIP_EASE, fill: "forwards" });

    const leaf = leafRef.current.animate(
      next
        ? [{ transform: "rotateY(0deg)" }, { transform: "rotateY(-180deg)" }]
        : [{ transform: "rotateY(-180deg)" }, { transform: "rotateY(0deg)" }],
      { duration: FLIP_MS, easing: FLIP_EASE, fill: "forwards" }
    );
    const anims = [
      leaf,
      fade(frontShade.current, next ? 0 : 0.6, next ? 0.6 : 0),
      fade(backShade.current, next ? 0.6 : 0, next ? 0 : 0.6),
      fade(castR.current, next ? 0.5 : 0, next ? 0 : 0.5),
      fade(castL.current, next ? 0 : 0.45, next ? 0.45 : 0),
    ];
    const done = anchorOf(viewOf(flip.to, dbl, total));
    leaf.onfinish = () => {
      setPage(done);
      setFlip(null);
      if (total > 1 && done >= total) setToast("🎉 مبارک! کتاب مو بشپړ کړ. ملګرو ته یې معرفي کړئ.");
    };
    return () => anims.forEach((a) => a?.cancel());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flip]);

  /* ── tools ── */
  const cycleTheme = () => {
    const next: Theme = theme === "light" ? "sepia" : theme === "sepia" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("lnv-reader-theme", next);
  };

  const toggleBookmark = () => {
    const next = bookmarks.includes(curPage)
      ? bookmarks.filter((b) => b !== curPage)
      : [...bookmarks, curPage].sort((a, b) => a - b);
    setBookmarks(next);
    localStorage.setItem(`lnv-bookmarks-${id}`, JSON.stringify(next));
  };

  const saveHls = (next: Highlight[]) => {
    setHighlights(next);
    localStorage.setItem(`lnv-highlights-${id}`, JSON.stringify(next));
  };
  const addHl = (h: Omit<Highlight, "id">) =>
    saveHls([...highlights, { ...h, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}` }]);
  const removeHl = (hid: string) => saveHls(highlights.filter((h) => h.id !== hid));
  const clearPageHls = () => saveHls(highlights.filter((h) => h.page !== cur.left && h.page !== cur.right));

  const setNote = (p: number, text: string) => {
    const next = { ...notes };
    if (text.trim()) next[p] = text;
    else delete next[p];
    setNotes(next);
    localStorage.setItem(`lnv-notes-${id}`, JSON.stringify(next));
  };

  const updateGoal = (m: number) => {
    const next = { ...habit, goal: m };
    setHabit(next);
    localStorage.setItem("lnv-habit", JSON.stringify(next));
  };

  const chooseAmbient = (k: Ambient | null) => {
    setAmbient(k);
    if (k) startAmbient(k, ambientVol);
    else stopAmbient();
  };

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current as any;
    if (!document.fullscreenElement) (el?.requestFullscreen || el?.webkitRequestFullscreen)?.call(el);
    else (document.exitFullscreen || (document as any).webkitExitFullscreen)?.call(document);
  }, []);

  useEffect(() => {
    const on = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    document.addEventListener("webkitfullscreenchange", on);
    return () => {
      document.removeEventListener("fullscreenchange", on);
      document.removeEventListener("webkitfullscreenchange", on);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isField(e.target)) return; // don't turn pages while typing a note
      if (e.key === "ArrowRight" || e.key === "PageDown") flipTo(s + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") flipTo(s - 1);
      if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipTo, s, toggleFullscreen]);

  /* ── sharing (marketing) ── */
  const shareUrl = `${window.location.origin}/books/${id}`;
  const shareText = `${quote.trim() ? `«${quote.trim()}»\n\n` : ""}📖 ${book?.title ?? "کتاب"} — Learnova Books\nد ملګري په بلنه ۵٪ تخفیف ترلاسه کړئ:`;

  const handleShareInvite = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: book?.title ?? "Learnova Books", text: shareText, url: shareUrl });
        return;
      } catch {
        // fall back to copy
      }
    }
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setShareCopied(true);
    setToast("لینک کاپي شو ✔");
    setTimeout(() => setShareCopied(false), 2800);
  };

  const openShare = (kind: "wa" | "tg" | "fb" | "x") => {
    const t = encodeURIComponent(shareText);
    const u = encodeURIComponent(shareUrl);
    const link =
      kind === "wa"
        ? `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`
        : kind === "tg"
          ? `https://t.me/share/url?url=${u}&text=${t}`
          : kind === "fb"
            ? `https://www.facebook.com/sharer/sharer.php?u=${u}`
            : `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    window.open(link, "_blank", "noopener,noreferrer");
  };

  const shareCard = async (mode: "share" | "save") => {
    const blob = await makeShareCard({
      title: book?.title ?? "Learnova Books",
      quote: quote.trim(),
      percent: progress,
      streak,
      url: shareUrl,
    });
    if (!blob) return;
    const file = new File([blob], "learnova-reading.png", { type: "image/png" });
    if (mode === "share" && (navigator as any).canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: shareText, url: shareUrl });
      } catch {
        // cancelled
      }
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "learnova-reading.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  /* ── early screens (all hooks are above this line) ── */
  if (err === "locked") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <BookCheckIcon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">دا کتاب بند دی</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          د دې کتاب د لوستلو لپاره، لومړی یې بیه تادیه کړئ او د خپل اکاونټ ایمیل اډمین ته د واټساپ له لارې ولېږئ.
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

  /* ── theme ── */
  const themeBg =
    theme === "dark"
      ? "bg-stone-950 text-stone-100"
      : theme === "sepia"
        ? "bg-[#f4ecd8] text-[#433422]"
        : "bg-stone-100 text-stone-900";
  const barBg =
    theme === "dark"
      ? "bg-stone-900/95 border-stone-800"
      : theme === "sepia"
        ? "bg-[#ede2c8] border-[#dfd2b2]"
        : "bg-white border-stone-200";
  const deskBg =
    theme === "dark"
      ? "radial-gradient(ellipse at center, #292524 0%, #0c0a09 100%)"
      : theme === "sepia"
        ? "radial-gradient(ellipse at center, #e8dcc0 0%, #cdbd98 100%)"
        : "radial-gradient(ellipse at center, #e7e5e4 0%, #a8a29e 100%)";
  const pageFilter =
    theme === "dark"
      ? "invert(0.92) hue-rotate(180deg) contrast(0.95)"
      : theme === "sepia"
        ? "sepia(0.38) contrast(0.96) brightness(0.98)"
        : undefined;

  /* ── which page goes where, during a flip and at rest ── */
  const next = flip?.dir === "next";
  const fromV = viewOf(flip?.from ?? s, dbl, total);
  const toV = viewOf(flip?.to ?? s, dbl, total);
  const baseL = flip ? (next ? fromV.left : toV.left) : cur.left;
  const baseR = flip ? (next ? toV.right : fromV.right) : cur.right;
  const leafFront = next ? fromV.right : toV.right;
  const leafBack = next ? toV.left : fromV.left;

  const face = (n: number | null, side: "left" | "right") => (
    <PageFace
      key={`${side}-${n}`}
      n={n}
      w={pageW}
      h={pageH}
      side={side}
      r={renderer}
      filter={pageFilter}
      who={who}
      hls={n == null ? [] : highlights.filter((h) => h.page === n)}
      hlMode={highlightMode && !flip}
      eraser={isEraser}
      color={HL_COLORS[activeColor]}
      onAdd={addHl}
      onRemove={removeHl}
    />
  );

  const shown = [cur.left, cur.right].filter(Boolean).join("–");
  const pageHasHl = highlights.some((h) => h.page === cur.left || h.page === cur.right);
  const edgeL = dbl && baseL == null ? pageW - 5 : -5;
  const edgeR = dbl && baseR == null ? pageW - 5 : -5;
  const slotLeft = dbl ? pageW : 0;
  const goalPct = Math.min(100, Math.round((todaySec / goalSec) * 100));
  const noteList = Object.keys(notes)
    .map(Number)
    .sort((a, b) => a - b);

  const ambientIcon: Record<Ambient, React.ReactNode> = {
    rain: <CloudRain className="h-5 w-5" />,
    wind: <Wind className="h-5 w-5" />,
    waves: <Waves className="h-5 w-5" />,
    fire: <Flame className="h-5 w-5" />,
    calm: <Music className="h-5 w-5" />,
  };
  const tabs: { id: Exclude<Panel, null>; label: string; icon: React.ReactNode }[] = [
    { id: "sound", label: "آوازونه", icon: <Headphones className="h-4 w-4" /> },
    { id: "habit", label: "عادت", icon: <Flame className="h-4 w-4" /> },
    { id: "share", label: "شېرول", icon: <Share2 className="h-4 w-4" /> },
    { id: "notes", label: "یادښت", icon: <StickyNote className="h-4 w-4" /> },
    { id: "focus", label: "تمرکز", icon: <Timer className="h-4 w-4" /> },
  ];

  return (
    <div
      ref={containerRef}
      className={`reader-root flex h-[100dvh] select-none flex-col overflow-hidden transition-colors duration-300 ${themeBg}`}
    >
      <style>{`@media print { .reader-root { display: none !important; } }`}</style>

      {/* toast */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex justify-center px-4">
          <div className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-xl">
            {toast}
          </div>
        </div>
      )}

      {/* top bar */}
      <div className={`z-20 mx-2 mt-2 flex flex-wrap items-center justify-between gap-1.5 rounded-xl border p-2 shadow-md backdrop-blur-md ${barBg}`}>
        <div className="flex min-w-0 items-center gap-2">
          <Link to="/library" className="inline-flex items-center gap-1 text-xs font-medium hover:opacity-80 sm:text-sm">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">کتابتون</span>
          </Link>
          <div className="h-4 w-px bg-border/60" />
          <p className="line-clamp-1 max-w-[110px] text-xs font-semibold sm:max-w-[260px] sm:text-sm">
            {book?.title ?? "Learnova Reader"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Btn label="کوچنول" onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))} disabled={zoom <= 1}>
            <ZoomOut className="h-4 w-4" />
          </Btn>
          <Btn label="لویول" onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))} disabled={zoom >= 2.5}>
            <ZoomIn className="h-4 w-4" />
          </Btn>
          <Btn label="شالید بدلول" onClick={cycleTheme}>
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : theme === "sepia" ? (
              <Palette className="h-4 w-4 text-amber-700" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Btn>
          <Btn label="د کاغذ غږ" onClick={() => setSoundEnabled((v) => !v)} active={soundEnabled}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Btn>
          <Btn
            label="هایلایټ"
            active={highlightMode}
            onClick={() => {
              setHighlightMode((v) => !v);
              setIsEraser(false);
            }}
          >
            <Highlighter className="h-4 w-4" />
          </Btn>
          <Btn label="بوک مارک" onClick={toggleBookmark} active={bookmarks.includes(curPage)}>
            {bookmarks.includes(curPage) ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Btn>
          <Btn label="بشپړ سکرین (F)" onClick={toggleFullscreen} active={fullscreen}>
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Btn>
          <Btn label="ابزارونه: آوازونه، عادت، شېرول" onClick={() => setPanel((p) => (p ? null : "sound"))} active={!!panel || !!ambient}>
            <Headphones className="h-4 w-4" />
          </Btn>
          <button
            aria-label="د مطالعې عادت"
            title="د مطالعې عادت"
            onClick={() => setPanel("habit")}
            className={`flex items-center gap-0.5 rounded-lg border px-1.5 py-1.5 text-xs font-semibold transition hover:bg-black/5 dark:hover:bg-white/5 ${
              goalMet ? "border-orange-400 bg-orange-400/15" : ""
            }`}
          >
            <Flame className={`h-4 w-4 ${streak > 0 || goalMet ? "text-orange-500" : ""}`} />
            {streak}
          </button>
        </div>
      </div>

      {/* highlighter palette */}
      {highlightMode && (
        <div className={`mx-2 mt-1.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2 text-xs ${barBg}`}>
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(HL_COLORS) as (keyof typeof HL_COLORS)[]).map((c) => (
              <button
                key={c}
                aria-label={c}
                onClick={() => {
                  setIsEraser(false);
                  setActiveColor(c);
                }}
                style={{ backgroundColor: HL_COLORS[c] }}
                className={`h-6 w-6 rounded-full border-2 transition ${
                  !isEraser && activeColor === c ? "scale-110 border-amber-600 shadow" : "border-transparent"
                }`}
              />
            ))}
            <Btn label="پاکوونکی" onClick={() => setIsEraser((v) => !v)} active={isEraser}>
              <Eraser className="h-3.5 w-3.5" />
              <span>پاکوونکی</span>
            </Btn>
            {pageHasHl && (
              <Btn label="ټول پاک کړه" onClick={clearPageHls}>
                <RotateCcw className="h-3.5 w-3.5" />
                <span>ټول پاک کړه</span>
              </Btn>
            )}
          </div>
          <button onClick={() => setHighlightMode(false)} className="flex items-center gap-0.5 opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
            بندول
          </button>
        </div>
      )}

      {/* invite banner (wide screens only, so phones keep their space) */}
      {!fullscreen && (
        <div className="mx-2 mt-1.5 hidden items-center justify-between gap-2 rounded-xl border border-primary/25 bg-gradient-to-r from-amber-500/15 via-primary/10 to-emerald-500/15 px-3 py-1.5 text-xs sm:flex">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="line-clamp-1">د یو ملګري په دعوت کولو ۵ فیصده تخفیف!</span>
          </div>
          <button
            onClick={() => setPanel("share")}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground shadow transition hover:opacity-90 active:scale-95"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>بلنه ولېږئ</span>
          </button>
        </div>
      )}

      {/* bookmarks */}
      {bookmarks.length > 0 && (
        <div className="mx-2 mt-1 flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          <span className="shrink-0 text-[11px] opacity-70">نښه شوې پاڼې:</span>
          {bookmarks.map((b) => (
            <button
              key={b}
              onClick={() => flipTo(spreadOf(b, dbl))}
              className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-medium transition ${
                b === curPage ? "border-amber-600 bg-amber-500 text-white shadow-sm" : "bg-card/70 hover:bg-card"
              }`}
            >
              مخ {b}
            </button>
          ))}
        </div>
      )}

      {/* the desk and the book */}
      {err === "load" ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm">کتاب نه شو پرانیستل. مهرباني وکړئ انټرنیټ وګورئ او بیا هڅه وکړئ.</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-xl border px-4 py-2 text-sm hover:bg-black/5">
            بیا هڅه
          </button>
        </div>
      ) : !doc ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="mt-4 text-sm opacity-70">کتاب د پرانیستلو په حال کې دی...</p>
        </div>
      ) : (
        <>
          <div
            ref={stageRef}
            className={`relative mt-1.5 flex min-h-0 flex-1 ${zoom > 1 ? "overflow-auto" : "overflow-hidden"}`}
            style={{ background: deskBg }}
            onTouchStart={(e) => {
              if (!highlightMode && zoom === 1) touchX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchX.current == null) return;
              const dx = e.changedTouches[0].clientX - touchX.current;
              touchX.current = null;
              if (Math.abs(dx) > 45) flipTo(dx < 0 ? s + 1 : s - 1);
            }}
          >
            {pageW > 0 && (
              <div className="flex min-h-full min-w-full p-3">
                <div className="relative m-auto" style={{ width: bookW, height: pageH, perspective: 2400 }}>
                  {/* stacked page edges + shadow */}
                  <div
                    className="absolute rounded-sm"
                    style={{
                      left: edgeL,
                      right: edgeR,
                      top: 4,
                      bottom: -4,
                      background: "repeating-linear-gradient(90deg, #e7e5e4 0 1px, #c7c2bd 1px 2px)",
                      boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
                    }}
                  />

                  {/* resting pages */}
                  {dbl && baseL != null && (
                    <div className="absolute left-0 top-0" style={{ width: pageW, height: pageH }}>
                      {face(baseL, "left")}
                    </div>
                  )}
                  {baseR != null && (
                    <div className="absolute top-0" style={{ left: slotLeft, width: pageW, height: pageH }}>
                      {face(baseR, "right")}
                    </div>
                  )}

                  {/* shadows the turning page casts on the pages below */}
                  {flip && (
                    <div
                      ref={castR}
                      className="pointer-events-none absolute top-0"
                      style={{
                        left: slotLeft,
                        width: pageW,
                        height: pageH,
                        zIndex: 2,
                        opacity: next ? 0.5 : 0,
                        background: "linear-gradient(to right, rgba(0,0,0,0.5), transparent 70%)",
                      }}
                    />
                  )}
                  {flip && dbl && (
                    <div
                      ref={castL}
                      className="pointer-events-none absolute left-0 top-0"
                      style={{
                        width: pageW,
                        height: pageH,
                        zIndex: 2,
                        opacity: next ? 0 : 0.45,
                        background: "linear-gradient(to left, rgba(0,0,0,0.5), transparent 70%)",
                      }}
                    />
                  )}

                  {/* the turning leaf: front = right page, back = left page */}
                  {flip && (
                    <div
                      ref={leafRef}
                      className="absolute top-0"
                      style={{
                        left: slotLeft,
                        width: pageW,
                        height: pageH,
                        zIndex: 5,
                        transformOrigin: "left center",
                        transformStyle: "preserve-3d",
                        transform: next ? "rotateY(0deg)" : "rotateY(-180deg)",
                      }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                      >
                        {face(leafFront, "right")}
                        <div
                          ref={frontShade}
                          className="pointer-events-none absolute inset-0"
                          style={{
                            opacity: next ? 0 : 0.6,
                            background: "linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0.05))",
                          }}
                        />
                      </div>
                      <div
                        className="absolute inset-0"
                        style={{
                          backfaceVisibility: "hidden",
                          WebkitBackfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        {dbl ? (
                          face(leafBack, "left")
                        ) : (
                          <div className="h-full w-full bg-stone-100" style={{ filter: pageFilter }} />
                        )}
                        <div
                          ref={backShade}
                          className="pointer-events-none absolute inset-0"
                          style={{
                            opacity: next ? 0.6 : 0,
                            background: "linear-gradient(to left, rgba(0,0,0,0.55), rgba(0,0,0,0.05))",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* tap the page edges to turn (only when not zoomed or highlighting) */}
            {zoom === 1 && !highlightMode && (
              <>
                <button
                  aria-label="مخکینی پاڼه"
                  onClick={() => flipTo(s - 1)}
                  className="absolute inset-y-0 left-0 z-10 w-[14%] cursor-w-resize"
                />
                <button
                  aria-label="راتلونکې پاڼه"
                  onClick={() => flipTo(s + 1)}
                  className="absolute inset-y-0 right-0 z-10 w-[14%] cursor-e-resize"
                />
              </>
            )}
          </div>

          {/* bottom bar */}
          <div className={`mx-2 mb-2 mt-1.5 overflow-hidden rounded-xl border text-xs shadow-sm ${barBg}`}>
            <div className="h-1 w-full bg-black/10">
              <div className="h-full bg-orange-500 transition-all" style={{ width: `${goalPct}%` }} />
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <button
                onClick={() => flipTo(s - 1)}
                disabled={s <= minS || !!flip}
                className="flex items-center gap-1 rounded-lg border px-2 py-1 font-medium transition hover:bg-black/5 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">مخکینی</span>
              </button>

              <input
                type="range"
                aria-label="پاڼه"
                min={minS}
                max={maxS}
                value={s}
                onChange={(e) => flipTo(parseInt(e.target.value, 10))}
                className="h-1 min-w-0 flex-1 accent-amber-600"
              />

              <div className="shrink-0 text-center font-semibold">
                <div>
                  پاڼه {shown} / {total}
                </div>
                <div className="hidden items-center justify-center gap-1 text-[10px] font-normal opacity-70 sm:flex">
                  <Clock className="h-3 w-3" />
                  نن {todayMin}/{habit.goal} دقیقې • {progress}٪
                </div>
              </div>

              <button
                onClick={() => flipTo(s + 1)}
                disabled={s >= maxS || !!flip}
                className="flex items-center gap-1 rounded-lg border px-2 py-1 font-medium transition hover:bg-black/5 disabled:opacity-30"
              >
                <span className="hidden sm:inline">راتلونکی</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* tools drawer: sounds, habit, share, notes, focus */}
      {panel && (
        <>
          <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setPanel(null)} />
          <div
            className={`fixed inset-x-0 bottom-0 z-40 mx-auto max-h-[78dvh] max-w-2xl overflow-y-auto rounded-t-2xl border p-3 shadow-2xl ${barBg}`}
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex gap-1 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPanel(t.id)}
                    className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                      panel === t.id
                        ? "border-amber-500 bg-amber-400/25 text-amber-700 dark:text-amber-300"
                        : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
              <button aria-label="بندول" onClick={() => setPanel(null)} className="rounded-lg border p-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* sounds */}
            {panel === "sound" && (
              <div>
                <p className="mb-2 text-xs opacity-70">
                  د ښه تمرکز لپاره یو آواز وټاکئ. آوازونه په همدې وسیله کې جوړېږي او اضافي ډاټا نه مصرفوي.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {AMBIENTS.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => chooseAmbient(ambient === a.id ? null : a.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs transition ${
                        ambient === a.id
                          ? "border-amber-500 bg-amber-400/25 font-semibold"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {ambientIcon[a.id]}
                      <span>{a.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => chooseAmbient(null)}
                    className="flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs transition hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <VolumeX className="h-5 w-5" />
                    <span>بندول</span>
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <VolumeX className="h-4 w-4 opacity-60" />
                  <input
                    type="range"
                    aria-label="د آواز کچه"
                    min={0}
                    max={1}
                    step={0.05}
                    value={ambientVol}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setAmbientVol(v);
                      localStorage.setItem("lnv-ambient-vol", String(v));
                      setAmbientVolume(v);
                    }}
                    className="h-1 flex-1 accent-amber-600"
                  />
                  <Volume2 className="h-4 w-4 opacity-60" />
                </div>
              </div>
            )}

            {/* habit */}
            {panel === "habit" && (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    🔥 {streak} ورځې پرله پسې
                  </p>
                  <p className="text-xs opacity-70">ټولې لوستل شوې ورځې: {readDays}</p>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>د نن ورځې هدف</span>
                    <span>
                      {todayMin} / {habit.goal} دقیقې
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-black/10">
                    <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${goalPct}%` }} />
                  </div>
                  <p className="mt-1.5 text-xs opacity-80">
                    {goalMet
                      ? "ډېر ښه! نن ورځ مو هدف بشپړ کړ. سبا هم دوام ورکړئ."
                      : `نور ${Math.max(1, Math.ceil((goalSec - todaySec) / 60))} دقیقې پاتې دي.`}
                  </p>
                </div>

                <div className="mt-3 flex items-end justify-between gap-1">
                  {week.map((d, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                          d.met
                            ? "border-orange-500 bg-orange-500 text-white"
                            : d.sec > 0
                              ? "border-orange-300 bg-orange-200/40"
                              : "opacity-50"
                        } ${d.today ? "ring-2 ring-amber-500" : ""}`}
                      >
                        {d.met ? <Check className="h-4 w-4" /> : ""}
                      </div>
                      <span className="text-[10px] opacity-70">{d.label}</span>
                    </div>
                  ))}
                </div>

                <p className="mb-1.5 mt-4 text-xs font-medium">ورځنی هدف وټاکئ</p>
                <div className="flex flex-wrap gap-1.5">
                  {GOALS.map((m) => (
                    <button
                      key={m}
                      onClick={() => updateGoal(m)}
                      className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                        habit.goal === m
                          ? "border-amber-500 bg-amber-400/25 font-semibold"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      {m} دقیقې
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px] opacity-60">
                  وخت یوازې هغه مهال شمېرل کېږي چې کتاب مو پرانیستی وي. هره ورځ لږ لږ لوستل غوره دي.
                </p>
              </div>
            )}

            {/* share */}
            {panel === "share" && (
              <div>
                <p className="mb-1.5 text-xs opacity-70">
                  د خپل خوښ شوي سطر یا فکر په اړه لنډ متن ولیکئ، بیا یې د ملګرو سره شېر کړئ. د کتاب پاڼې شېر نه کېږي.
                </p>
                <textarea
                  dir="auto"
                  value={quote}
                  maxLength={200}
                  onChange={(e) => setQuote(e.target.value)}
                  placeholder="خپله خوښه شوې وینا یا نظر دلته ولیکئ (اختیاري)"
                  className="h-20 w-full resize-none rounded-lg border bg-transparent p-2 text-sm"
                />
                <p className="mb-2 text-left text-[10px] opacity-60">{quote.length}/200</p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => shareCard("share")}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    <Share2 className="h-4 w-4" />
                    د کارت شېرول
                  </button>
                  <button
                    onClick={() => shareCard("save")}
                    className="flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <Download className="h-4 w-4" />
                    کارت ښکته کړئ
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-4 gap-2 text-xs font-semibold text-white">
                  <button onClick={() => openShare("wa")} className="rounded-xl bg-emerald-600 py-2">
                    WhatsApp
                  </button>
                  <button onClick={() => openShare("tg")} className="rounded-xl bg-sky-600 py-2">
                    Telegram
                  </button>
                  <button onClick={() => openShare("fb")} className="rounded-xl bg-blue-700 py-2">
                    Facebook
                  </button>
                  <button onClick={() => openShare("x")} className="rounded-xl bg-stone-800 py-2">
                    X
                  </button>
                </div>

                <button
                  onClick={handleShareInvite}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {shareCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {shareCopied ? "کاپي شو!" : "لینک او ۵٪ تخفیف بلنه"}
                </button>
              </div>
            )}

            {/* notes */}
            {panel === "notes" && (
              <div>
                <p className="mb-1.5 text-xs font-medium">د مخ {curPage} یادښت</p>
                <textarea
                  dir="auto"
                  value={notes[curPage] || ""}
                  onChange={(e) => setNote(curPage, e.target.value)}
                  placeholder="دلته خپل فکر، پوښتنه یا لنډیز ولیکئ..."
                  className="h-28 w-full resize-none rounded-lg border bg-transparent p-2 text-sm"
                />
                {noteList.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-xs font-medium opacity-70">ټول یادښتونه</p>
                    {noteList.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          flipTo(spreadOf(p, dbl));
                          setPanel(null);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-start text-xs hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <span className="shrink-0 rounded bg-amber-500 px-1.5 py-0.5 font-semibold text-white">مخ {p}</span>
                        <span className="line-clamp-1">{notes[p]}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-[11px] opacity-60">یادښتونه یوازې په همدې وسیله کې ساتل کېږي.</p>
              </div>
            )}

            {/* focus timer */}
            {panel === "focus" && (
              <div className="text-center">
                <p className="text-xs opacity-70">
                  {pomo.mode === "focus" ? "د تمرکز وخت — ۲۵ دقیقې" : "د استراحت وخت — ۵ دقیقې"}
                </p>
                <p className="my-2 font-mono text-5xl font-bold tabular-nums">{fmtClock(pomo.left)}</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setPomo((p) => ({ ...p, running: !p.running }))}
                    className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                  >
                    {pomo.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {pomo.running ? "ځنډول" : "پیلول"}
                  </button>
                  <button
                    onClick={() => {
                      prevMode.current = "focus";
                      setPomo({ running: false, mode: "focus", left: 25 * 60 });
                    }}
                    className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <RotateCcw className="h-4 w-4" />
                    بیا پیلول
                  </button>
                </div>
                <p className="mt-3 text-[11px] opacity-60">
                  ۲۵ دقیقې پرته له موبایل څخه ولولئ، بیا ۵ دقیقې استراحت وکړئ. دا طریقه ذهن تازه ساتي.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BookCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
      />
    </svg>
  );
                               }

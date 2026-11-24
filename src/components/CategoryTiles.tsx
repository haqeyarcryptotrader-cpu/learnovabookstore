import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";

/* names shown in Dari / Pashto (the English name stays the real category key) */
const NAMES_PS: Record<string, string> = {
  "Computer Science": "کمپیوټر ساینس",
  Psychology: "ارواپوهنه",
  Philosophy: "فلسفه",
  "Self- development": "شخصي وده",
  "Languages and literature": "ژبې او ادبیات",
  Engineering: "انجنیري",
  Medical: "طب",
  "Teacher guide": "د ښوونکي لارښود",
  Science: "ساینس",
  Comic: "کامیک",
  Children: "ماشومان",
  "Arts and Music": "هنر او موسیقي",
  Religion: "دین",
  Mathematics: "ریاضي",
  Law: "قانون",
  Economics: "اقتصاد",
};
const NAMES_FA: Record<string, string> = {
  "Computer Science": "علوم کامپیوتر",
  Psychology: "روان‌شناسی",
  Philosophy: "فلسفه",
  "Self- development": "رشد فردی",
  "Languages and literature": "زبان و ادبیات",
  Engineering: "مهندسی",
  Medical: "طب",
  "Teacher guide": "راهنمای معلم",
  Science: "علوم",
  Comic: "کمیک",
  Children: "کودکان",
  "Arts and Music": "هنر و موسیقی",
  Religion: "دین",
  Mathematics: "ریاضی",
  Law: "حقوق",
  Economics: "اقتصاد",
};

const HEART =
  "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

const starPts = (cx: number, cy: number, ro: number, ri: number, n: number) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const r = i % 2 ? ri : ro;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

const ngon = (cx: number, cy: number, r: number, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

const Svg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 100 70" preserveAspectRatio="xMidYMid meet" className="h-full w-full" aria-hidden>
    {children}
  </svg>
);

const d = (s: number) => ({ animationDelay: `${s}s` });

/* ───────────────────────── the 16 little animated scenes ───────────────────────── */

/* Computer Science: a screen that types code, a green "compiled" check, and binary rain */
function CSScene() {
  const rain: [number, string, number][] = [[8, "1", 0], [19, "0", 1.3], [31, "1", 0.6], [68, "0", 0.9], [80, "1", 0.2], [91, "0", 1.7]];
  return (
    <Svg>
      {rain.map(([x, t, s], i) => (
        <text key={i} className="ct-fall" x={x} y={4} fontSize={7} fill="#22d3ee" fontFamily="monospace" style={d(s)}>
          {t}
        </text>
      ))}
      <text className="ct-float" x={4} y={34} fontSize={11} fill="#67e8f9" fontFamily="monospace">
        {"</>"}
      </text>
      <rect x={22} y={10} width={58} height={38} rx={4} fill="#0a1226" stroke="#67e8f9" strokeWidth={1.4} />
      <circle cx={28} cy={15} r={1.3} fill="#fb7185" />
      <circle cx={32.5} cy={15} r={1.3} fill="#fbbf24" />
      <circle cx={37} cy={15} r={1.3} fill="#4ade80" />
      <rect className="ct-gx" x={28} y={22} width={28} height={3} rx={1.5} fill="#67e8f9" />
      <rect className="ct-gx" x={32} y={29} width={36} height={3} rx={1.5} fill="#a78bfa" style={d(0.5)} />
      <rect className="ct-gx" x={28} y={36} width={20} height={3} rx={1.5} fill="#86efac" style={d(1)} />
      <rect className="ct-blink" x={50} y={36} width={3} height={3} fill="#fff" />
      <g className="ct-late">
        <circle cx={70} cy={38} r={7} fill="#22c55e" />
        <path d="M66.5 38 l2.6 2.6 l5 -5.2" stroke="#fff" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <rect x={44} y={48} width={12} height={4} fill="#0a1226" stroke="#67e8f9" strokeWidth={1} />
      <rect x={35} y={52} width={30} height={3} rx={1.5} fill="#67e8f9" opacity={0.5} />
    </Svg>
  );
}

/* Psychology: a brain whose thoughts light up one after another */
function PsyScene() {
  const nodes: [number, number, number, number][] = [[14, 18, 26, 24], [86, 16, 74, 24], [12, 46, 22, 40], [88, 48, 78, 40], [50, 64, 50, 52]];
  return (
    <Svg>
      {nodes.map(([x, y, tx, ty], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={tx} y2={ty} stroke="#7c2d12" strokeWidth={1.2} className="ct-spark" style={d(i * 0.5)} />
          <circle cx={x} cy={y} r={2.4} fill="#7c2d12" className="ct-twinkle" style={d(i * 0.5)} />
        </g>
      ))}
      <g className="ct-pulse">
        <path d="M50 14 C38 8 24 14 25 26 C18 30 20 42 29 44 C30 52 42 54 50 50Z" fill="#fff3d6" />
        <path d="M50 14 C62 8 76 14 75 26 C82 30 80 42 71 44 C70 52 58 54 50 50Z" fill="#ffe9bd" />
        <path d="M50 14 V50" stroke="#d29a3a" strokeWidth={1.2} />
        <path d="M31 25 q7 -5 12 2 M30 37 q9 -3 13 4 M57 27 q7 -5 12 -1 M58 40 q9 -3 13 3" stroke="#e0b565" strokeWidth={1.3} fill="none" strokeLinecap="round" />
      </g>
    </Svg>
  );
}

/* Philosophy: a Greek column, and a big "?" that turns into a bright idea */
function PhiloScene() {
  return (
    <Svg>
      <rect x={62} y={14} width={26} height={5} rx={1.2} fill="#7a5a2e" />
      <circle cx={64} cy={16.5} r={2.6} fill="#7a5a2e" />
      <circle cx={86} cy={16.5} r={2.6} fill="#7a5a2e" />
      <rect x={66} y={19} width={18} height={30} fill="#a8854f" />
      {[70, 75, 80].map((x) => (
        <rect key={x} x={x} y={19} width={1.4} height={30} fill="#c9a972" opacity={0.8} />
      ))}
      <rect x={62} y={49} width={26} height={4} rx={1} fill="#7a5a2e" />
      <rect x={58} y={53} width={34} height={4} rx={1} fill="#6a4c25" />
      <circle cx={14} cy={52} r={2} fill="#fff" opacity={0.7} className="ct-twinkle" />
      <circle cx={20} cy={43} r={3.2} fill="#fff" opacity={0.75} className="ct-twinkle" style={d(0.4)} />
      <g className="ct-float">
        <ellipse cx={30} cy={24} rx={20} ry={13} fill="#fffaf0" />
        <g className="ct-swapa">
          <text x={30} y={31} textAnchor="middle" fontSize={18} fontWeight={700} fill="#7a5a2e">
            ?
          </text>
        </g>
        <g className="ct-swapb">
          <circle cx={30} cy={22} r={6} fill="#fde047" />
          <rect x={27.5} y={27} width={5} height={3.5} rx={1} fill="#a8854f" />
          <path d="M30 12 v-3 M22 15 l-2.5 -2 M38 15 l2.5 -2" stroke="#f59e0b" strokeWidth={1.4} strokeLinecap="round" />
        </g>
      </g>
    </Svg>
  );
}

/* Self-development: a sprout grows, opens a flower, under a turning sun */
function SelfScene() {
  const rays = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <Svg>
      <g className="ct-spin" style={{ transformOrigin: "82px 16px" }}>
        {rays.map((a) => (
          <line key={a} x1={82} y1={5} x2={82} y2={8.5} stroke="#fde047" strokeWidth={1.6} strokeLinecap="round" transform={`rotate(${a} 82 16)`} />
        ))}
      </g>
      <circle cx={82} cy={16} r={5.5} fill="#fde047" />
      <rect x={40} y={54} width={20} height={11} rx={2.5} fill="#c2410c" />
      <rect x={38} y={51} width={24} height={5} rx={2} fill="#ea580c" />
      <path className="ct-gy" d="M50 51 V28" stroke="#86efac" strokeWidth={3} strokeLinecap="round" fill="none" />
      <g className="ct-leaf" style={{ transformOrigin: "50px 40px" }}>
        <ellipse cx={42} cy={38} rx={8} ry={3.6} fill="#4ade80" transform="rotate(-30 42 38)" />
      </g>
      <g className="ct-leaf" style={{ transformOrigin: "50px 34px", animationDelay: "0.15s" }}>
        <ellipse cx={58} cy={32} rx={8} ry={3.6} fill="#22c55e" transform="rotate(30 58 32)" />
      </g>
      <g className="ct-flower" style={{ transformOrigin: "50px 26px" }}>
        <circle cx={50} cy={25} r={4.2} fill="#fde68a" />
        <circle cx={50} cy={25} r={1.8} fill="#f59e0b" />
      </g>
      <circle cx={20} cy={26} r={1.6} fill="#fde68a" className="ct-twinkle" />
      <circle cx={30} cy={14} r={1.2} fill="#fff" className="ct-twinkle" style={d(1)} />
    </Svg>
  );
}

/* Languages and literature: an open book releasing letters, and a writing quill */
function LitScene() {
  const letters: [string, number, number][] = [["A", 30, 0], ["ب", 46, 1.1], ["Z", 58, 2.2], ["ک", 70, 3.1]];
  return (
    <Svg>
      <path d="M50 58 C40 53 28 53 16 56 V27 C28 24 40 24 50 29Z" fill="#fff1e0" />
      <path d="M50 58 C60 53 72 53 84 56 V27 C72 24 60 24 50 29Z" fill="#ffe2c2" />
      <path d="M50 29 V58" stroke="#b9814f" strokeWidth={1.2} />
      <path d="M22 35 h20 M22 40 h18 M22 45 h20 M58 35 h20 M60 40 h16 M58 45 h20" stroke="#d1a47a" strokeWidth={1.2} strokeLinecap="round" />
      {letters.map(([t, x, s]) => (
        <text key={t} className="ct-rise" x={x} y={28} fontSize={10} fontWeight={700} fill="#fcd34d" style={d(s)}>
          {t}
        </text>
      ))}
      <g className="ct-write" style={{ transformOrigin: "84px 28px" }}>
        <path d="M84 6 C96 8 98 22 88 30 L84 26 C90 20 90 13 84 6Z" fill="#fff1e0" />
        <path d="M84 6 L86 28" stroke="#d1a47a" strokeWidth={1} />
      </g>
    </Svg>
  );
}

/* Engineering: two meshing gears and a turning nut */
function Gear(p: { cx: number; cy: number; r: number; teeth: number; body: string; hole: string; cls: string; dur: string }) {
  return (
    <g className={p.cls} style={{ transformOrigin: `${p.cx}px ${p.cy}px`, animationDuration: p.dur }}>
      {Array.from({ length: p.teeth }, (_, i) => (
        <rect key={i} x={p.cx - 1.9} y={p.cy - p.r - 3.2} width={3.8} height={5} rx={0.9} fill={p.body} transform={`rotate(${(360 / p.teeth) * i} ${p.cx} ${p.cy})`} />
      ))}
      <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.body} />
      <circle cx={p.cx} cy={p.cy} r={p.r * 0.62} fill="none" stroke={p.hole} strokeWidth={1} opacity={0.35} />
      <circle cx={p.cx} cy={p.cy} r={p.r * 0.38} fill={p.hole} />
    </g>
  );
}
function EngScene() {
  return (
    <Svg>
      <Gear cx={36} cy={40} r={15} teeth={10} body="#cbd5e1" hole="#1b2a3c" cls="ct-spin" dur="9s" />
      <Gear cx={64} cy={30} r={9} teeth={7} body="#fb923c" hole="#1b2a3c" cls="ct-spin-r" dur="5.8s" />
      <g className="ct-spin-r" style={{ transformOrigin: "84px 56px", animationDuration: "14s" }}>
        <polygon points={ngon(84, 56, 7, 6)} fill="#94a3b8" />
        <circle cx={84} cy={56} r={2.6} fill="#1b2a3c" />
      </g>
      <circle cx={14} cy={14} r={1.6} fill="#fb923c" className="ct-twinkle" />
      <circle cx={86} cy={12} r={1.2} fill="#fff" className="ct-twinkle" style={d(0.8)} />
    </Svg>
  );
}

/* Medical: a heartbeat line drawing itself, a beating heart and a pulsing cross */
function MedScene() {
  return (
    <Svg>
      <g className="ct-beat" style={{ transformOrigin: "22px 16px" }}>
        <path transform="translate(14 8) scale(.66)" fill="#fb7185" d={HEART} />
      </g>
      <g className="ct-pulse">
        <circle cx={80} cy={16} r={11} fill="#fff" opacity={0.95} />
        <rect x={78} y={10} width={4} height={12} rx={1} fill="#ef4444" />
        <rect x={74} y={14} width={12} height={4} rx={1} fill="#ef4444" />
      </g>
      <path d="M2 46 H98" stroke="#fff" strokeOpacity={0.2} strokeWidth={1} />
      <path className="ct-draw" pathLength={100} d="M2 46 H24 l4 -10 l5 22 l5 -30 l5 26 l3 -8 H98" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/* Teacher guide: a chalkboard where the answer is underlined and graded "A+" */
function TeacherScene() {
  return (
    <Svg>
      <rect x={10} y={6} width={80} height={44} rx={3} fill="#173d2e" stroke="#b8864b" strokeWidth={2.6} />
      <text x={38} y={29} textAnchor="middle" fontSize={11} fill="#fff" fontFamily="'Comic Sans MS','Segoe Print',cursive">
        2 + 2 = 4
      </text>
      <path className="ct-draw" pathLength={100} d="M18 35 q20 5 40 0" stroke="#fde68a" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <g className="ct-pop">
        <circle cx={76} cy={20} r={8} fill="#fbbf24" />
        <text x={76} y={23.5} textAnchor="middle" fontSize={9} fontWeight={800} fill="#7c2d12">
          A+
        </text>
      </g>
      <rect x={8} y={50} width={84} height={3} rx={1.5} fill="#b8864b" />
      <rect x={14} y={46} width={9} height={4} rx={1} fill="#e5e7eb" />
      <circle cx={80} cy={61} r={5} fill="#ef4444" />
      <path d="M80 56 q1 -4 4 -4" stroke="#4ade80" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

/* Science: an atom with three electrons racing around the nucleus */
function SciScene() {
  return (
    <Svg>
      {[0, 60, 120].map((a, i) => (
        <g key={a} transform={`rotate(${a} 50 32)`}>
          <ellipse cx={50} cy={32} rx={28} ry={10} fill="none" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.2} />
          <circle r={2.4} fill="#a7f3d0">
            <animateMotion dur={`${3 + i}s`} repeatCount="indefinite" path="M22 32 a28 10 0 1 0 56 0 a28 10 0 1 0 -56 0" />
          </circle>
        </g>
      ))}
      <circle className="ct-pulse" cx={50} cy={32} r={5} fill="#fde047" />
      <circle className="ct-rise" cx={14} cy={62} r={2} fill="#fff" opacity={0.6} />
      <circle className="ct-rise" cx={86} cy={64} r={1.6} fill="#fff" opacity={0.6} style={d(1.5)} />
      <circle className="ct-twinkle" cx={12} cy={14} r={1.4} fill="#fff" />
    </Svg>
  );
}

/* Comic: a "POW!" burst with halftone dots and a speech bubble */
function ComicScene() {
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 6; c++) {
      const rad = Math.max(0.5, 2 - (c + r) * 0.17);
      dots.push(<circle key={`${r}-${c}`} cx={8 + c * 6} cy={38 + r * 6} r={rad} fill="#be123c" opacity={0.3} />);
    }
  return (
    <Svg>
      {dots}
      <g className="ct-pop">
        <polygon points={starPts(54, 30, 26, 16, 12)} fill="#fff" stroke="#be123c" strokeWidth={2} strokeLinejoin="round" />
        <text x={54} y={34} textAnchor="middle" fontSize={13} fontWeight={900} fill="#be123c" transform="rotate(-8 54 30)">
          POW!
        </text>
      </g>
      <g className="ct-twinkle" style={d(0.6)}>
        <ellipse cx={14} cy={12} rx={9} ry={6} fill="#fff" stroke="#be123c" strokeWidth={1.4} />
        <polygon points="18,17 24,22 22,16" fill="#fff" stroke="#be123c" strokeWidth={1.2} strokeLinejoin="round" />
        <text x={14} y={15} textAnchor="middle" fontSize={8} fontWeight={800} fill="#be123c">
          !?
        </text>
      </g>
    </Svg>
  );
}

/* Children: ABC blocks that bounce, with a rainbow and clouds */
function KidsScene() {
  return (
    <Svg>
      <g className="ct-float">
        <path d="M60 50 a18 18 0 0 1 36 0" stroke="#fb7185" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <path d="M64.5 50 a13.5 13.5 0 0 1 27 0" stroke="#fbbf24" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <path d="M69 50 a9 9 0 0 1 18 0" stroke="#bae6fd" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <circle cx={60} cy={51} r={4} fill="#fff" />
        <circle cx={96} cy={51} r={4} fill="#fff" />
      </g>
      <rect x={8} y={54} width={50} height={2} rx={1} fill="#fff" opacity={0.4} />
      <g className="ct-bounce" style={d(0.5)}>
        <rect x={26} y={14} width={18} height={18} rx={3} fill="#34d399" />
        <text x={35} y={27} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fff">
          C
        </text>
      </g>
      <g className="ct-bounce">
        <rect x={14} y={35} width={18} height={18} rx={3} fill="#fb7185" />
        <text x={23} y={48} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fff">
          A
        </text>
      </g>
      <g className="ct-bounce" style={d(0.25)}>
        <rect x={36} y={35} width={18} height={18} rx={3} fill="#fbbf24" />
        <text x={45} y={48} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fff">
          B
        </text>
      </g>
      <polygon className="ct-twinkle" points={starPts(12, 16, 4, 1.8, 5)} fill="#fde047" />
      <polygon className="ct-twinkle" points={starPts(58, 10, 3.4, 1.5, 5)} fill="#fff" style={d(1)} />
    </Svg>
  );
}

/* Arts and Music: three colour strokes painted across, with notes floating up */
function ArtScene() {
  const notes: [string, number, number][] = [["♪", 20, 0], ["♫", 46, 1.3], ["♪", 74, 2.4]];
  return (
    <Svg>
      <path className="ct-draw" pathLength={100} d="M8 48 C28 18 50 62 92 20" stroke="#fde047" strokeWidth={4} fill="none" strokeLinecap="round" />
      <path className="ct-draw" pathLength={100} d="M8 54 C28 24 50 68 92 26" stroke="#fb7185" strokeWidth={4} fill="none" strokeLinecap="round" style={d(0.25)} />
      <path className="ct-draw" pathLength={100} d="M8 60 C28 30 50 74 92 32" stroke="#38bdf8" strokeWidth={4} fill="none" strokeLinecap="round" style={d(0.5)} />
      {notes.map(([t, x, s], i) => (
        <text key={i} className="ct-rise" x={x} y={36} fontSize={14} fill="#fff" style={d(s)}>
          {t}
        </text>
      ))}
    </Svg>
  );
}

/* Religion: a glowing mosque under a crescent moon and twinkling stars */
function ReligionScene() {
  const stars: [number, number, number][] = [[12, 12, 0], [30, 20, 0.8], [58, 8, 1.4], [94, 38, 0.4]];
  return (
    <Svg>
      {stars.map(([x, y, s], i) => (
        <circle key={i} className="ct-twinkle" cx={x} cy={y} r={1.4} fill="#fff" style={d(s)} />
      ))}
      <path className="ct-pulse" d="M86 8 a9 9 0 1 0 7 14 a7.4 7.4 0 1 1 -7 -14z" fill="#fde68a" />
      <path d="M34 46 a16 16 0 0 1 32 0Z" fill="#fcd34d" />
      <rect x={49} y={24} width={2} height={6} fill="#fcd34d" />
      <circle cx={50} cy={23} r={1.8} fill="#fcd34d" />
      <rect x={28} y={46} width={44} height={14} fill="#f0b429" />
      <path d="M45 60 v-7 a5 5 0 0 1 10 0 v7z" fill="#064e3b" />
      <rect className="ct-twinkle" x={33} y={50} width={4} height={6} rx={2} fill="#fff7cc" />
      <rect className="ct-twinkle" x={63} y={50} width={4} height={6} rx={2} fill="#fff7cc" style={d(0.9)} />
      <rect x={14} y={30} width={6} height={30} fill="#f0b429" />
      <polygon points="14,30 17,22 20,30" fill="#fcd34d" />
      <rect x={13} y={38} width={8} height={2} fill="#fcd34d" />
      <rect x={76} y={30} width={6} height={30} fill="#f0b429" />
      <polygon points="76,30 79,22 82,30" fill="#fcd34d" />
      <rect x={75} y={38} width={8} height={2} fill="#fcd34d" />
    </Svg>
  );
}

/* Mathematics: a sine wave being drawn, with π, ∑ and √ floating up */
function MathScene() {
  const syms: [string, number, number][] = [["π", 26, 0], ["∑", 52, 1.2], ["√", 78, 2.1]];
  return (
    <Svg>
      <path d="M14 8 V62 M10 34 H96" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.2} fill="none" />
      <path className="ct-draw" pathLength={100} d="M14 34 q10 -24 20 0 t20 0 t20 0 t20 0" stroke="#fde047" strokeWidth={2.2} fill="none" strokeLinecap="round" />
      {syms.map(([t, x, s]) => (
        <text key={t} className="ct-rise" x={x} y={58} fontSize={12} fontWeight={700} fill="#bfdbfe" style={d(s)}>
          {t}
        </text>
      ))}
    </Svg>
  );
}

/* Law: scales of justice that keep swaying */
function LawScene() {
  return (
    <Svg>
      <rect x={48.5} y={14} width={3} height={38} fill="#f2c14e" />
      <rect x={34} y={52} width={32} height={4.5} rx={2.2} fill="#f2c14e" />
      <circle cx={50} cy={13} r={3.2} fill="#f2c14e" />
      <g className="ct-tip" style={{ transformOrigin: "50px 16px" }}>
        <rect x={22} y={14.8} width={56} height={2.4} rx={1.2} fill="#f2c14e" />
        <g className="ct-tipb" style={{ transformOrigin: "24px 16px" }}>
          <path d="M24 16 L14 37 M24 16 L34 37" stroke="#f2c14e" strokeWidth={0.9} fill="none" />
          <path d="M12 37 h24 a12 6 0 0 1 -24 0z" fill="#f2c14e" />
        </g>
        <g className="ct-tipb" style={{ transformOrigin: "76px 16px" }}>
          <path d="M76 16 L66 37 M76 16 L86 37" stroke="#f2c14e" strokeWidth={0.9} fill="none" />
          <path d="M64 37 h24 a12 6 0 0 1 -24 0z" fill="#f2c14e" />
        </g>
      </g>
      <circle className="ct-twinkle" cx={12} cy={12} r={1.4} fill="#ffe9bf" />
    </Svg>
  );
}

/* Economics: bars that grow, a rising trend arrow and a spinning coin */
function EconScene() {
  const bars: [number, number][] = [[16, 12], [32, 20], [48, 30], [64, 40]];
  return (
    <Svg>
      {bars.map(([x, h], i) => (
        <rect key={x} className="ct-gy" x={x} y={56 - h} width={11} height={h} rx={2} fill="#fbbf24" opacity={0.9} style={d(i * 0.3)} />
      ))}
      <path d="M10 56 H92" stroke="#fff" strokeOpacity={0.35} strokeWidth={1} />
      <path className="ct-draw" pathLength={100} d="M20 40 L38 30 L54 24 L74 10" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path className="ct-arrow" d="M68 8 L76 8 L76 16" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <g className="ct-coin">
        <circle cx={84} cy={44} r={9} fill="#fbbf24" stroke="#b45309" strokeWidth={1.4} />
        <circle cx={84} cy={44} r={6.2} fill="none" stroke="#b45309" strokeWidth={0.8} />
        <text x={84} y={47.6} textAnchor="middle" fontSize={9} fontWeight={800} fill="#92400e">
          $
        </text>
      </g>
    </Svg>
  );
}

function FallbackScene() {
  return (
    <Svg>
      <path d="M50 54 C40 49 28 49 16 52 V23 C28 20 40 20 50 25Z" fill="#fff" opacity={0.9} />
      <path d="M50 54 C60 49 72 49 84 52 V23 C72 20 60 20 50 25Z" fill="#fff" opacity={0.75} />
      <polygon className="ct-twinkle" points={starPts(50, 12, 6, 2.5, 5)} fill="#fde047" />
    </Svg>
  );
}

/* ───────────────────────── themes ───────────────────────── */

type Theme = { bg: [string, string]; fg: string; Scene: () => React.ReactElement };

const THEMES: Record<string, Theme> = {
  "Computer Science": { bg: ["#061b3a", "#0c3a7a"], fg: "#e0f7ff", Scene: CSScene },
  Psychology: { bg: ["#e0a23b", "#a35a06"], fg: "#2a1500", Scene: PsyScene },
  Philosophy: { bg: ["#ead9b3", "#c9ab7d"], fg: "#3b2a14", Scene: PhiloScene },
  "Self- development": { bg: ["#0f6b4a", "#033d2b"], fg: "#f3eab8", Scene: SelfScene },
  "Languages and literature": { bg: ["#a3202a", "#5a0f1e"], fg: "#ffe8d6", Scene: LitScene },
  Engineering: { bg: ["#33465d", "#101a28"], fg: "#e8eef6", Scene: EngScene },
  Medical: { bg: ["#139aa5", "#05505a"], fg: "#ffffff", Scene: MedScene },
  "Teacher guide": { bg: ["#2a6b50", "#0e2f24"], fg: "#eaf7ee", Scene: TeacherScene },
  Science: { bg: ["#6d28d9", "#2a0f5c"], fg: "#f3e8ff", Scene: SciScene },
  Comic: { bg: ["#fde047", "#fb7185"], fg: "#3b0a2a", Scene: ComicScene },
  Children: { bg: ["#0ea5e9", "#7c3aed"], fg: "#ffffff", Scene: KidsScene },
  "Arts and Music": { bg: ["#ec4899", "#6d28d9"], fg: "#ffffff", Scene: ArtScene },
  Religion: { bg: ["#065f46", "#0b1d3a"], fg: "#fdf3c8", Scene: ReligionScene },
  Mathematics: { bg: ["#1d4ed8", "#1e3a8a"], fg: "#ffffff", Scene: MathScene },
  Law: { bg: ["#6b3315", "#2b1208"], fg: "#ffe9bf", Scene: LawScene },
  Economics: { bg: ["#2b2a28", "#8a5a12"], fg: "#fff3d0", Scene: EconScene },
};
const FALLBACK: Theme = { bg: ["#7c3aed", "#312e81"], fg: "#ffffff", Scene: FallbackScene };

/* ───────────────────────── animations ───────────────────────── */

const CSS = `
.ct-row{scrollbar-width:none}.ct-row::-webkit-scrollbar{display:none}
.ct-tile:hover{translate:0 -6px}
.ct-tile svg{transition:scale .4s ease}.ct-tile:hover svg{scale:1.07}
.ct-shine{position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.35) 50%,transparent 60%);transform:translateX(-120%);transition:transform .8s ease;pointer-events:none}
.ct-tile:hover .ct-shine{transform:translateX(120%)}
.ct-float{animation:ct-float 4s ease-in-out infinite}
.ct-spin{animation:ct-spin 9s linear infinite}
.ct-spin-r{animation:ct-spin 6s linear infinite reverse}
.ct-pulse{transform-box:fill-box;transform-origin:center;animation:ct-pulse 2.4s ease-in-out infinite}
.ct-beat{animation:ct-beat 1.2s ease-in-out infinite}
.ct-blink{animation:ct-blink 1s steps(1) infinite}
.ct-draw{stroke-dasharray:100;stroke-dashoffset:100;animation:ct-draw 3.6s ease-in-out infinite}
.ct-arrow{animation:ct-arrow 3.6s ease-in-out infinite}
.ct-rise{animation:ct-rise 4s ease-in infinite}
.ct-fall{animation:ct-fall 4s linear infinite}
.ct-gy{transform-box:fill-box;transform-origin:50% 100%;animation:ct-gy 4.5s ease-in-out infinite}
.ct-gx{transform-box:fill-box;transform-origin:0 50%;animation:ct-gx 4s ease-in-out infinite}
.ct-late{transform-box:fill-box;transform-origin:center;animation:ct-late 4s ease-in-out infinite}
.ct-pop{transform-box:fill-box;transform-origin:center;animation:ct-pop 2.6s ease-in-out infinite}
.ct-twinkle{transform-box:fill-box;transform-origin:center;animation:ct-twinkle 2.6s ease-in-out infinite}
.ct-spark{animation:ct-spark 3s ease-in-out infinite}
.ct-leaf{animation:ct-leaf 4.5s ease-in-out infinite}
.ct-flower{animation:ct-flower 4.5s ease-in-out infinite}
.ct-write{animation:ct-write 2.2s ease-in-out infinite}
.ct-tip{animation:ct-tip 5s ease-in-out infinite}
.ct-tipb{animation:ct-tipb 5s ease-in-out infinite}
.ct-coin{transform-box:fill-box;transform-origin:center;animation:ct-coin 2.4s ease-in-out infinite}
.ct-bounce{animation:ct-bounce 1.8s ease-in-out infinite}
.ct-swapa{animation:ct-swapa 5s ease-in-out infinite}
.ct-swapb{animation:ct-swapb 5s ease-in-out infinite}
@keyframes ct-float{0%,100%{translate:0 0}50%{translate:0 -3px}}
@keyframes ct-spin{to{transform:rotate(360deg)}}
@keyframes ct-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
@keyframes ct-beat{0%,100%{transform:scale(1)}15%{transform:scale(1.25)}30%{transform:scale(1)}45%{transform:scale(1.18)}60%{transform:scale(1)}}
@keyframes ct-blink{50%{opacity:0}}
@keyframes ct-draw{0%{stroke-dashoffset:100;opacity:1}55%,90%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
@keyframes ct-arrow{0%,50%{opacity:0}60%,90%{opacity:1}100%{opacity:0}}
@keyframes ct-rise{0%{translate:0 6px;opacity:0}15%{opacity:1}100%{translate:0 -26px;opacity:0}}
@keyframes ct-fall{0%{translate:0 -6px;opacity:0}10%{opacity:.7}90%{opacity:.5}100%{translate:0 78px;opacity:0}}
@keyframes ct-gy{0%{transform:scaleY(0)}25%,85%{transform:scaleY(1)}95%,100%{transform:scaleY(0)}}
@keyframes ct-gx{0%{transform:scaleX(0)}25%,85%{transform:scaleX(1)}95%,100%{transform:scaleX(0)}}
@keyframes ct-late{0%,60%{transform:scale(0);opacity:0}72%{transform:scale(1.25);opacity:1}82%,92%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}}
@keyframes ct-pop{0%,100%{transform:scale(.93)}50%{transform:scale(1.1)}}
@keyframes ct-twinkle{0%,100%{opacity:.3;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}
@keyframes ct-spark{0%,100%{opacity:.15}50%{opacity:1}}
@keyframes ct-leaf{0%,30%{transform:scale(0)}45%{transform:scale(1.15)}55%,90%{transform:scale(1)}100%{transform:scale(0)}}
@keyframes ct-flower{0%,50%{transform:scale(0)}62%{transform:scale(1.3)}70%,90%{transform:scale(1)}100%{transform:scale(0)}}
@keyframes ct-write{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(9deg)}}
@keyframes ct-tip{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
@keyframes ct-tipb{0%,100%{transform:rotate(7deg)}50%{transform:rotate(-7deg)}}
@keyframes ct-coin{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.12)}}
@keyframes ct-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
@keyframes ct-swapa{0%,42%{opacity:1}52%,92%{opacity:0}100%{opacity:1}}
@keyframes ct-swapb{0%,42%{opacity:0}52%,92%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){
  .ct-float,.ct-spin,.ct-spin-r,.ct-pulse,.ct-beat,.ct-blink,.ct-draw,.ct-arrow,.ct-rise,.ct-fall,.ct-gy,.ct-gx,.ct-late,.ct-pop,.ct-twinkle,.ct-spark,.ct-leaf,.ct-flower,.ct-write,.ct-tip,.ct-tipb,.ct-coin,.ct-bounce,.ct-swapa,.ct-swapb{animation:none!important}
  .ct-draw{stroke-dashoffset:0}
  .ct-swapb{opacity:0}
}
`;

/* ───────────────────────── the row of category tiles ───────────────────────── */

export function CategoryTiles(props: {
  categories: readonly string[];
  onPick: (category: string) => void;
  active?: string;
  lang?: string;
  countLabel?: string;
}) {
  const { categories, onPick, active, lang = "en", countLabel = "" } = props;
  const { books } = useStore();
  const rtl = lang !== "en";
  const names = lang === "ps" ? NAMES_PS : lang === "fa" ? NAMES_FA : null;

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of books) m[b.category] = (m[b.category] || 0) + 1;
    return m;
  }, [books]);

  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div ref={ref} dir={rtl ? "rtl" : "ltr"} className="ct-row -mx-4 mt-5 flex snap-x gap-3.5 overflow-x-auto px-4 pb-6 pt-3">
        {categories.map((c, i) => {
          const th = THEMES[c] ?? FALLBACK;
          const Scene = th.Scene;
          const name = names?.[c] ?? c;
          const n = counts[c] ?? 0;
          const isActive = active === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              aria-label={name}
              aria-pressed={isActive}
              className="ct-tile group relative h-36 w-44 shrink-0 snap-start overflow-hidden rounded-3xl text-start shadow-book sm:h-40 sm:w-52"
              style={{
                background: `linear-gradient(145deg, ${th.bg[0]}, ${th.bg[1]})`,
                color: th.fg,
                opacity: seen ? 1 : 0,
                transform: seen ? "none" : "translateY(24px)",
                transition: `opacity .6s ease ${i * 60}ms, transform .6s cubic-bezier(.2,.8,.2,1) ${i * 60}ms, translate .3s ease`,
                outline: isActive ? `3px solid ${th.bg[0]}` : undefined,
                outlineOffset: isActive ? 3 : undefined,
              }}
            >
              <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(circle at 85% 8%, rgba(255,255,255,.3), transparent 55%)" }} />
              <div aria-hidden className="absolute inset-x-0 top-0 h-[68%]">
                <Scene />
              </div>
              <span aria-hidden className="ct-shine" />
              {n > 0 && (
                <span className="absolute start-3 top-3 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                  {n} {countLabel}
                </span>
              )}
              <div
                className="absolute inset-x-0 bottom-0 px-4 pb-3.5 pt-8"
                style={{ background: `linear-gradient(to top, ${th.bg[1]}d9, transparent)` }}
              >
                <p className={`text-[15px] font-bold leading-tight ${rtl ? "font-rtl" : "font-display"}`}>{name}</p>
                {rtl && (
                  <p dir="ltr" className="mt-0.5 text-start text-[10px] uppercase tracking-wider opacity-70">
                    {c}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

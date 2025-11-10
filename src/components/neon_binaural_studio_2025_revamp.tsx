'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { History, Headphones, Star, Play, Pause, Home, SlidersHorizontal, Brain, BookOpenText, Activity, Trash2, Sparkles } from "lucide-react";
import { PwaInstallButton } from "@/components/pwa/pwa-install-button";

/* ---- DOM typings to avoid any ---- */
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    __NBS_TESTED__?: boolean;
  }
}

/* ===============================
   Wave-in-Triangle Icon (NEW)
   =============================== */
function IconWaveTriangle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <defs>
        <clipPath id="tri-clip">
          <path d="M12 3 L21 19 H3 Z" />
        </clipPath>
      </defs>
      {/* Triangle outline */}
      <path d="M12 3 L21 19 H3 Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      {/* Wave clipped to triangle */}
      <g clipPath="url(#tri-clip)">
        <path
          d="M1 15 C 4 11, 8 19, 11 15 C 14 11, 18 19, 23 15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

// ------------------------------------------------------------
// Brain Studio — 2025 Revamp
// ------------------------------------------------------------

const BANDS = {
  delta: { name: "Delta", range: [0.5, 4], hint: "deep sleep", color: "#00D1FF", icon: "🌙" },
  theta: { name: "Theta", range: [4, 8], hint: "meditation", color: "#7C3AED", icon: "🧘" },
  alpha: { name: "Alpha", range: [8, 12], hint: "calm focus", color: "#FF6B9D", icon: "🫧" },
  beta:  { name: "Beta",  range: [12, 30], hint: "active focus", color: "#FFD93D", icon: "⚡" },
  gamma: { name: "Gamma", range: [30, 80], hint: "high attention", color: "#6BCF7F", icon: "✨" },
  pure:  { name: "Pure",  range: [0, 0],  hint: "no beat",      color: "#1F2937", icon: "◯" },
} as const;

// Pure Tone / Sacred Frequencies
type PureTone = {
  name: string;
  frequency: number;
  category: string;
  hint: string;
  color: string;
  icon: string;
  description: string[];
};

const PURE_TONES: Record<string, PureTone> = {
  om432: {
    name: "OM 432 Hz",
    frequency: 432,
    category: "Meditation",
    hint: "Universe's heartbeat",
    color: "#7C3AED",
    icon: "🕉️",
    description: [
      "Called the 'natural tuning' of the universe",
      "Resonates with nature, water molecules, human body",
      "Promotes relaxation and emotional release",
      "Used in meditation, yoga, deep relaxation"
    ]
  },
  om136: {
    name: "Cosmic OM",
    frequency: 136.1,
    category: "Meditation",
    hint: "Earth's year frequency",
    color: "#7C3AED",
    icon: "🪐",
    description: [
      "Calculated from Earth's orbit around the sun",
      "Used in Tibetan and Indian meditation practices",
      "Aligns with the 'frequency of the universe'",
      "Deep meditation and spiritual awakening"
    ]
  },
  miracle528: {
    name: "Miracle 528 Hz",
    frequency: 528,
    category: "Healing",
    hint: "DNA repair & love",
    color: "#6BCF7F",
    icon: "💚",
    description: [
      "Most famous healing frequency",
      "DNA repair and transformation",
      "Love frequency, heart chakra activation",
      "Used for healing and miracles"
    ]
  },
  pain174: {
    name: "Foundation 174 Hz",
    frequency: 174,
    category: "Healing",
    hint: "Pain relief",
    color: "#6BCF7F",
    icon: "🩹",
    description: [
      "Anesthetic effect on the body",
      "Reduces physical and energetic pain",
      "Security, safety, and grounding",
      "Foundation for healing work"
    ]
  },
  tissue285: {
    name: "Regeneration 285 Hz",
    frequency: 285,
    category: "Healing",
    hint: "Cellular healing",
    color: "#6BCF7F",
    icon: "🔬",
    description: [
      "Tissue regeneration and repair",
      "Influences energy fields",
      "Helps heal minor injuries",
      "Cellular level restoration"
    ]
  },
  fear396: {
    name: "Liberation 396 Hz",
    frequency: 396,
    category: "Emotional",
    hint: "Release fear & guilt",
    color: "#FF6B9D",
    icon: "🦋",
    description: [
      "Releases guilt and fear",
      "Root chakra activation",
      "Grounding and stability",
      "Liberation from negative emotions"
    ]
  },
  change417: {
    name: "Change 417 Hz",
    frequency: 417,
    category: "Emotional",
    hint: "Undo & transform",
    color: "#FF6B9D",
    icon: "🔄",
    description: [
      "Facilitating positive change",
      "Breaking negative patterns",
      "Sacral chakra and creativity",
      "Undoing difficult situations"
    ]
  },
  connection639: {
    name: "Connection 639 Hz",
    frequency: 639,
    category: "Emotional",
    hint: "Relationships & harmony",
    color: "#FF6B9D",
    icon: "💞",
    description: [
      "Harmonious relationships",
      "Heart chakra communication",
      "Empathy and understanding",
      "Connection with others"
    ]
  },
  intuition741: {
    name: "Awakening 741 Hz",
    frequency: 741,
    category: "Mental",
    hint: "Expression & solutions",
    color: "#00D1FF",
    icon: "💡",
    description: [
      "Awakening intuition",
      "Throat chakra activation",
      "Finding solutions and clarity",
      "Detoxification on all levels"
    ]
  },
  spiritual852: {
    name: "Spiritual 852 Hz",
    frequency: 852,
    category: "Mental",
    hint: "Third eye activation",
    color: "#00D1FF",
    icon: "👁️",
    description: [
      "Third eye and intuition",
      "Inner strength and awareness",
      "Spiritual enlightenment",
      "Return to spiritual order"
    ]
  },
  divine963: {
    name: "Divine 963 Hz",
    frequency: 963,
    category: "Mental",
    hint: "Crown chakra & unity",
    color: "#00D1FF",
    icon: "👑",
    description: [
      "Crown chakra activation",
      "Pineal gland stimulation",
      "Connection to higher consciousness",
      "Frequency of the Gods"
    ]
  },
  holy111: {
    name: "Holy 111 Hz",
    frequency: 111,
    category: "Sleep",
    hint: "Sacred sites frequency",
    color: "#FFD93D",
    icon: "🏛️",
    description: [
      "Found in ancient sacred sites worldwide",
      "Beta-endorphin production",
      "Deep meditation and trance states",
      "Profound relaxation"
    ]
  },
};

type BandKey = keyof typeof BANDS;
type ToneKey = keyof typeof PURE_TONES;
type TabKey = 'home' | 'soundscapes' | 'studio' | 'focus' | 'tones' | 'history';
type VocabPair = [word: string, def: string];

const ONBOARDING_STORAGE_KEY = "nbs.onboarding.v1";
const TAB_LABELS: Record<TabKey, string> = {
  home: "Home",
  soundscapes: "Soundscapes",
  studio: "Studio",
  focus: "Focus",
  tones: "Tones",
  history: "History",
};
const ONBOARDING_STEPS: Array<{
  tab: TabKey;
  title: string;
  summary: string;
  bullets: string[];
}> = [
  {
    tab: "home",
    title: "Welcome Home",
    summary: "Dial in a quick binaural session and watch the live waveform visualizer.",
    bullets: [
      "Set the base frequency, beat offset, and session length.",
      "Start or stop playback with the center control ring.",
      "Daily Dose helps track your three recommended sessions."
    ],
  },
  {
    tab: "soundscapes",
    title: "Pick a Moodscape",
    summary: "Explore curated brainwave presets and mark your go-to favorites.",
    bullets: [
      "Each tile shows the frequency band and when to use it.",
      "Tap a card to load it instantly and begin playback.",
      "Use the star icon to surface personal favorites up top."
    ],
  },
  {
    tab: "studio",
    title: "Customize the Studio",
    summary: "Fine-tune oscillator waves, panning, and gain for full control.",
    bullets: [
      "Voice A feeds the left ear, Voice B the right.",
      "Adjust volume and stereo position to balance your mix.",
      "Swap oscillator shapes to sculpt the tone you prefer."
    ],
  },
  {
    tab: "focus",
    title: "Challenge Your Focus",
    summary: "Warm up your brain with quick math, vocab, and pattern drills.",
    bullets: [
      "Quant mode rotates through consulting-style math prompts.",
      "Vocab flashcards keep language sharp between sessions.",
      "Pattern labs test recall with sequences and logic riddles."
    ],
  },
  {
    tab: "history",
    title: "Review Your Streak",
    summary: "See what you’ve played recently and keep the streak alive.",
    bullets: [
      "Sessions log automatically once you cross 14 minutes.",
      "Badges unlock as you stack consistent practice days.",
      "Clear history anytime if you want a fresh reset."
    ],
  },
];

// beefed up bank
const DEFAULT_WORDS: VocabPair[] = [
  ["concise", "brief and clear"],
  ["cogent", "logical and convincing"],
  ["prudent", "acting with care and thought"],
  ["lucid", "easy to understand"],
  ["salient", "most noticeable or important"],
  ["tenable", "defensible against attack or objection"],
  ["succinct", "expressed with few words"],
  ["astute", "sharp in judgment"],
  ["parsimonious", "unwilling to spend resources"],
  ["ambivalent", "having mixed feelings"],
  ["candor", "open and honest expression"],
  ["eschew", "deliberately avoid"],
  ["abet", "encourage or assist"],
  ["fervent", "intensely passionate"],
  ["aplomb", "self confidence"],
  ["rancor", "bitter resentment"],
  ["scrutiny", "critical observation"],
  ["aplastic", "lacking development or growth"],
  ["ameliorate", "make something better"],
  ["cursory", "hasty and not thorough"],
];

function clamp(n: number, lo: number, hi: number) { return Math.min(Math.max(n, lo), hi); }
function series(start: number, len: number, f: (n: number) => number) {
  const out = [start];
  for (let i = 1; i < len; i++) out.push(f(out[i - 1]));
  return out;
}
function approxEqual(a: number, b: number, tol = 1e-2) { return Math.abs(a - b) <= tol; }
function rint(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function parseNum(s: string) {
  const t = (s ?? "").toString().trim().replace(/,/g, ".");
  if (t === "") return NaN;
  return Number(t);
}
function choice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// no-`any` helper
function notInRecent<T>(val: T, recent: readonly T[], eq?: (a: T, b: T) => boolean): boolean {
  return !(eq ? recent.some(r => eq(r, val)) : recent.includes(val));
}

// --- Session history / streak types & helpers ---
export type Session = {
  startedAt: number;          // epoch ms
  endedAt: number;            // epoch ms
  durationMin: number;        // whole minutes, floored
  plannedMin: number;         // minutes slider at start
  band: BandKey;              // preset used
};

const SESSIONS_KEY = "nbs.sessions.v1";

// >>> Tick rule: one session counts only if >= 14 minutes
const SESSION_MINUTES = 14;

function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(Boolean);
  } catch { return []; }
}
function saveSessions(s: Session[]) {
  try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(s)); } catch {}
}
function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function daysAgo(date: Date, days: number) {
  const d = new Date(date); d.setDate(d.getDate() - days); d.setHours(0,0,0,0); return d;
}
function computeStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;
  const byDay = new Set<string>();
  for (const s of sessions) {
    if (s.durationMin >= SESSION_MINUTES) {
      const d = new Date(s.endedAt); d.setHours(0,0,0,0);
      byDay.add(d.toISOString());
    }
  }
  if (byDay.size === 0) return 0;
  let streak = 0; const today = new Date(); today.setHours(0,0,0,0);
  for (let i=0;; i++) {
    const dayISO = daysAgo(today, i).toISOString();
    if (byDay.has(dayISO)) streak++; else break;
  }
  return streak;
}

// Quant (Math + Consulting) types
type QuantQ = {
  kind: 'arith' | 'breakeven' | 'cagr' | 'ltv' | 'payback' | 'cm';
  prompt: string;
  formula?: string;
  answer: number;
  solution: string;
};

// generate one random question
function genQuant(): QuantQ {
  const kinds: QuantQ['kind'][] = ['arith','breakeven','cagr','ltv','payback','cm'];
  const kind = kinds[Math.floor(Math.random()*kinds.length)];

  if (kind === 'arith') {
    const a = rint(10, 50), b = rint(2, 12), c = rint(2, 9);
    return {
      kind,
      prompt: `Compute: ${a} + ${b} × ${c}`,
      answer: a + b * c,
      solution: `${a} + (${b}×${c}) = ${a} + ${b*c} = ${a + b*c}`
    };
  }
  if (kind === 'breakeven') {
    const P = rint(10, 40), V = rint(2, 15), F = rint(20000, 120000);
    const q = Math.ceil(F / (P - V));
    return {
      kind,
      prompt: `Price $${P}, variable $${V} per unit, fixed $${F}. Units to break even?`,
      formula: `Q = Fixed / (Price − Variable)`,
      answer: q,
      solution: `Q = ${F} / (${P} − ${V}) = ${F}/${P-V} ≈ ${q}`
    };
  }
  if (kind === 'cagr') {
    const A = rint(50, 400), B = rint(A + 20, A + 300), n = rint(2, 7);
    const cagr = Math.pow(B / A, 1 / n) - 1;
    return {
      kind,
      prompt: `CAGR from $${A}M to $${B}M over ${n} years? (answer in %)`,
      formula: `CAGR = (End/Start)^(1/n) − 1`,
      answer: Math.round(cagr * 100 * 100) / 100,
      solution: `(${B}/${A})^(1/${n}) − 1 = ${(Math.pow(B/A,1/n)).toFixed(4)} − 1 = ${(cagr*100).toFixed(2)}%`
    };
  }
  if (kind === 'ltv') {
    const arpu = rint(5, 30), gm = rint(60, 90) / 100, months = rint(6, 24);
    const ltv = arpu * gm * months;
    return {
      kind,
      prompt: `LTV with ARPU $${arpu}/mo, GM ${(gm*100).toFixed(0)}%, retention ${months} mo?`,
      formula: `LTV ≈ ARPU × Gross Margin × Months`,
      answer: Math.round(ltv * 100) / 100,
      solution: `${arpu} × ${gm.toFixed(2)} × ${months} = $${(ltv).toFixed(2)}`
    };
  }
  if (kind === 'payback') {
    const cac = rint(50, 500), arpu = rint(5, 40), gm = rint(60, 90) / 100;
    const m = cac / (arpu * gm);
    return {
      kind,
      prompt: `Payback (months) if CAC $${cac}, ARPU $${arpu}/mo, GM ${(gm*100).toFixed(0)}%?`,
      formula: `Payback ≈ CAC / (ARPU × GM)`,
      answer: Math.round(m * 100) / 100,
      solution: `${cac} / (${arpu} × ${gm.toFixed(2)}) = ${m.toFixed(2)} months`
    };
  }
  const p = rint(10, 60), v = rint(2, Math.max(3, p-1));
  const cm = (p - v) / p * 100;
  return {
    kind: 'cm',
    prompt: `Contribution margin (%) if price $${p} and variable cost $${v}?`,
    formula: `CM% = (P − V) / P × 100`,
    answer: Math.round(cm * 100) / 100,
    solution: `(${p} − ${v})/${p} × 100 = ${(cm).toFixed(2)}%`
  };
}

// avoid repeats across last N prompts
function genQuantUnique(recentPrompts: string[], maxTries = 20): QuantQ {
  for (let i = 0; i < maxTries; i++) {
    const q = genQuant();
    if (notInRecent(q.prompt, recentPrompts)) return q;
  }
  return genQuant();
}

// Pure helper for testability
export function nextWordPick(current: VocabPair, list: VocabPair[]): VocabPair {
  const idx = list.findIndex(([w]) => w === current[0]);
  if (idx === -1) return list[0] ?? current;
  const next = (idx + 1) % Math.max(1, list.length);
  return list[next] ?? current;
}
export function nextWordRandom(prev: VocabPair, list: VocabPair[], recent: string[]): VocabPair {
  const candidates = list.filter(([w]) => w !== prev[0] && !recent.includes(w));
  if (candidates.length) return choice(candidates);
  const others = list.filter(([w]) => w !== prev[0]);
  return others.length ? choice(others) : prev;
}

function useRaf(fn: () => void, active = true) {
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    const loop = () => { fn(); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [fn, active]);
}

function ProgressRing({ value, size = 88, color = "#ef4444", bg = "rgba(0,0,0,.08)" }: { value: number; size?: number; color?: string; bg?: string; }) {
  const r = (size / 2) - 6; const c = 2 * Math.PI * r; const pct = clamp(value, 0, 1);
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} className="fill-none" stroke={bg} strokeWidth={6} />
      <circle cx={size / 2} cy={size / 2} r={r} className="fill-none" stroke={color} strokeWidth={6}
        style={{ strokeDasharray: c, strokeDashoffset: c - c * pct, transition: "stroke-dashoffset .2s cubic-bezier(.22,.61,.36,1)" }}
        strokeLinecap="round" />
    </svg>
  );
}

function HeroControl({ playing, ring, deadline, onStart, onStop, accent }: { playing: boolean; ring: number; deadline: number | null; onStart: () => void; onStop: () => void; accent: string; }) {
  const [mmss, setMmss] = useState("");

  useEffect(() => {
    if (!deadline) { setMmss(""); return; }
    const update = () => {
      const ms = Math.max(0, deadline - Date.now());
      const m = Math.floor(ms / 60000);
      const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
      setMmss(`${String(m).padStart(2, "0")}:${s}`);
    };
    update();
    const id = window.setInterval(update, 500);
    return () => window.clearInterval(id);
  }, [deadline]);

  return (
    <div className="grid place-items-center gap-4">
      {/* BIG BOLD PLAY/PAUSE BUTTON */}
      <button
        onClick={playing ? onStop : onStart}
        className={`relative w-40 h-40 rounded-full border-[6px] border-black shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all duration-200 hover:shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-none active:translate-x-[8px] active:translate-y-[8px] ${playing ? 'bg-[#FF6B9D]' : 'bg-[#6BCF7F]'}`}
        aria-label={playing ? "Pause" : "Play"}
      >
        <div className="absolute inset-0 grid place-items-center">
          {playing ? (
            <Pause className="w-16 h-16 text-white" strokeWidth={4} />
          ) : (
            <Play className="w-16 h-16 text-white ml-2" strokeWidth={4} fill="white" />
          )}
        </div>
      </button>

      {/* BOLD TIME DISPLAY */}
      {mmss && (
        <div className="px-8 py-4 bg-white border-[4px] border-black rounded-full shadow-[6px_6px_0_rgba(0,0,0,1)]">
          <span className="text-3xl font-black tabular-nums">{mmss}</span>
        </div>
      )}
    </div>
  );
}

// ----------- MAIN APP -----------
export default function NeonBinauralStudio() {
  const [tab, setTab] = useState<TabKey>("home");
  const [playing, setPlaying] = useState(false);
  const [band, setBand] = useState<BandKey>("theta");
  const [baseHz, setBaseHz] = useState(220);
  const [offset, setOffset] = useState(6);
  const [minutes, setMinutes] = useState(15);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [ring, setRing] = useState(0);
  const [favorites, setFavorites] = useState<BandKey[]>(["alpha", "theta"]);

  // Pure tone state
  const [activeTone, setActiveTone] = useState<ToneKey | null>(null);
  const [toneFavorites, setToneFavorites] = useState<ToneKey[]>(["om432", "miracle528"]);

  // Sessions / streak
  const [sessions, setSessions] = useState<Session[]>([]);
  const [streak, setStreak] = useState(0);
  const sessionStartRef = useRef<{ start: number; planned: number; band: BandKey } | null>(null);

  // Studio state
  const [waveA, setWaveA] = useState<OscillatorType>("sine");
  const [waveB, setWaveB] = useState<OscillatorType>("sine");
  const [freqA, setFreqA] = useState(440);
  const [freqB, setFreqB] = useState(528);
  const [gainA, setGainA] = useState(0.12);
  const [gainB, setGainB] = useState(0.12);
  const [panA, setPanA] = useState(-1);
  const [panB, setPanB] = useState(1);

  // Focus tools state — Quant + Pattern + Vocab
  const [quantQ, setQuantQ] = useState<QuantQ>(() => genQuant());
  const [quantFeedback, setQuantFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [quantInput, setQuantInput] = useState<string>("");
  const [quantReveal, setQuantReveal] = useState(false);
  const [quantScore, setQuantScore] = useState(0);
  const [quantRecent, setQuantRecent] = useState<string[]>([]); // last few prompts to avoid repeats

  type PatternItem = { seq: number[]; ans: number; solution: string; type: 'x2'|'arith'|'fib' };
  const patternRef = useRef<PatternItem>({ seq: [2, 4, 8, 16], ans: 32, solution: "Each term ×2. Next = last × 2", type: 'x2' });
  const lastPatternTypeRef = useRef<PatternItem['type']>('x2');
  const [patternHist, setPatternHist] = useState<PatternItem[]>([]);
  const [patternInput, setPatternInput] = useState("");
  const [patternScore, setPatternScore] = useState(0);
  const [patternFeedback, setPatternFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [patternReveal, setPatternReveal] = useState(false);

  const [vocab, setVocab] = useState<VocabPair>(DEFAULT_WORDS[0]);
  const [vocabRecent, setVocabRecent] = useState<string[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const markOnboardingSeen = useCallback(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.setItem(ONBOARDING_STORAGE_KEY, "1"); } catch {}
  }, []);

  const clearOnboardingSeen = useCallback(() => {
    if (typeof window === "undefined") return;
    try { window.localStorage.removeItem(ONBOARDING_STORAGE_KEY); } catch {}
  }, []);

  const lastOnboardingStepIndex = Math.max(ONBOARDING_STEPS.length - 1, 0);
  const safeOnboardingStepIndex = Math.min(onboardingStep, lastOnboardingStepIndex);
  const onboardingCurrent = ONBOARDING_STEPS[safeOnboardingStepIndex] ?? ONBOARDING_STEPS[0];
  const onboardingIsLast = safeOnboardingStepIndex >= lastOnboardingStepIndex;
  const onboardingProgressPct = Math.round(((safeOnboardingStepIndex + 1) / Math.max(ONBOARDING_STEPS.length, 1)) * 100);

  function nextWord() {
    setVocab(cur => {
      const nxt = nextWordRandom(cur, DEFAULT_WORDS, vocabRecent);
      setVocabRecent(r => [nxt[0], ...r].slice(0, 7)); // remember last 7 words
      return nxt;
    });
  }

  // Pattern generation function with no immediate repeat type
  const newPattern = useCallback(() => {
    setPatternHist(h => (patternRef.current ? [...h, patternRef.current] : h).slice(-20));
    const types: PatternItem['type'][] = ['x2','arith','fib'];
    const filtered = types.filter(t => t !== lastPatternTypeRef.current);
    const type = choice(filtered.length ? filtered : types);

    let seq: number[] = [], ans = 0, solution = "";
    if (type==='x2'){
      seq = series(rint(1,4)*2, 5, function(n){ return n * 2; });
      ans = seq[seq.length-1]*2;
      solution = "Each term ×2. Next = last × 2";
    }
    if (type==='arith'){
      const inc = rint(2,9);
      const start = rint(1,9);
      seq = series(start, 5, function(n){ return n + inc; });
      ans = seq[seq.length-1]+inc;
      solution = `Arithmetic sequence with +${inc}. Next = last + ${inc}`;
    }
    if (type==='fib'){
      seq=[1,1];
      for(let i=2;i<5;i++) seq.push(seq[i-1]+seq[i-2]);
      ans = seq[3]+seq[4];
      solution = "Fibonacci rule aₙ = aₙ₋₁ + aₙ₋₂. Next = sum of last two terms";
    }
    patternRef.current = { seq, ans, solution, type };
    lastPatternTypeRef.current = type;
    setPatternInput("");
    setPatternFeedback(null);
    setPatternReveal(false);
  }, []);

  // Initialize pattern generation on mount
  useEffect(() => { newPattern(); }, [newPattern]);

  // Audio engine nodes
  const ctxRef = useRef<AudioContext | null>(null);
  const oscARef = useRef<OscillatorNode | null>(null);
  const oscBRef = useRef<OscillatorNode | null>(null);
  const gARef = useRef<GainNode | null>(null);
  const gBRef = useRef<GainNode | null>(null);
  const pARef = useRef<StereoPannerNode | null>(null);
  const pBRef = useRef<StereoPannerNode | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const splitterRef = useRef<ChannelSplitterNode | null>(null);
  const analyserLRef = useRef<AnalyserNode | null>(null);
  const analyserRRef = useRef<AnalyserNode | null>(null);
  const mediaElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const scopeLRef = useRef<HTMLCanvasElement | null>(null);
  const scopeRRef = useRef<HTMLCanvasElement | null>(null);

  // Load sessions on mount
  useEffect(() => {
    const s = loadSessions();
    setSessions(s);
    setStreak(computeStreak(s));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!seen) setShowOnboarding(true);
    } catch {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    const ensureRunning = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (ctx.state !== "running") {
        ctx.resume().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", ensureRunning);
    window.addEventListener("pageshow", ensureRunning);
    return () => {
      document.removeEventListener("visibilitychange", ensureRunning);
      window.removeEventListener("pageshow", ensureRunning);
    };
  }, []);

  // Persist sessions when changed
  useEffect(() => { saveSessions(sessions); setStreak(computeStreak(sessions)); }, [sessions]);

  // Band ↔ frequency wiring
  useEffect(() => {
    if (band === "pure") {
      setFreqA(baseHz);
      setFreqB(baseHz);
    } else {
      const [lo, hi] = BANDS[band].range as [number, number];
      const tuned = clamp(offset, lo, hi);
      setOffset(tuned);
      setFreqA(baseHz);
      setFreqB(baseHz + tuned);
    }
  }, [band, baseHz, offset]);

  // live param updates when playing
  useEffect(() => { if (playing && oscARef.current) oscARef.current.frequency.value = freqA; }, [freqA, playing]);
  useEffect(() => { if (playing && oscBRef.current) oscBRef.current.frequency.value = freqB; }, [freqB, playing]);
  useEffect(() => { if (playing && pARef.current) pARef.current.pan.value = panA; }, [panA, playing]);
  useEffect(() => { if (playing && pBRef.current) pBRef.current.pan.value = panB; }, [panB, playing]);
  useEffect(() => { if (playing && gARef.current && ctxRef.current) ramp(gARef.current.gain, gainA, ctxRef.current); }, [gainA, playing]);
  useEffect(() => { if (playing && gBRef.current && ctxRef.current) ramp(gBRef.current.gain, gainB, ctxRef.current); }, [gainB, playing]);
  useEffect(() => { if (playing && oscARef.current) oscARef.current.type = waveA; }, [waveA, playing]);
  useEffect(() => { if (playing && oscBRef.current) oscBRef.current.type = waveB; }, [waveB, playing]);

  function ramp(param: AudioParam, value: number, ctx: AudioContext) {
    const now = ctx.currentTime;
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + 0.03);
  }

  function start() {
    if (playing) return;
    const CtxCtor = (window.AudioContext ?? window.webkitAudioContext) as typeof AudioContext;
    const ctx: AudioContext = new CtxCtor({ sampleRate: 48000 });
    ctxRef.current = ctx;
    ctx.onstatechange = () => {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    };
    ctx.resume().catch(() => {});
    masterRef.current = new GainNode(ctx, { gain: 0.9 });

    // analysis path
    splitterRef.current = new ChannelSplitterNode(ctx, { numberOfOutputs: 2 });
    analyserLRef.current = new AnalyserNode(ctx, { fftSize: 2048, smoothingTimeConstant: 0.85 });
    analyserRRef.current = new AnalyserNode(ctx, { fftSize: 2048, smoothingTimeConstant: 0.85 });
    masterRef.current.connect(splitterRef.current);
    splitterRef.current.connect(analyserLRef.current, 0);
    splitterRef.current.connect(analyserRRef.current, 1);

    let directDestinationConnected = true;
    masterRef.current.connect(ctx.destination);

    if (typeof MediaStreamAudioDestinationNode !== "undefined" && mediaElementRef.current) {
      try {
        const mediaDest = new MediaStreamAudioDestinationNode(ctx);
        mediaStreamRef.current = mediaDest;
        masterRef.current.connect(mediaDest);
        const media = mediaElementRef.current;
        media.srcObject = mediaDest.stream;
        media.loop = true;
        media.autoplay = true;
        media.setAttribute("playsinline", "true");
        media.muted = false;
        const played = media.play();
        if (played && typeof played.then === "function") {
          played
            .then(() => {
              if (directDestinationConnected) {
                try { masterRef.current?.disconnect(ctx.destination); } catch {}
                directDestinationConnected = false;
              }
            })
            .catch(() => {
              media.srcObject = null;
              mediaStreamRef.current = null;
            });
        } else if (directDestinationConnected) {
          try { masterRef.current?.disconnect(ctx.destination); } catch {}
          directDestinationConnected = false;
        }
      } catch {
        mediaStreamRef.current = null;
      }
    }

    // voices
    const makeVoice = (type: OscillatorType, frequency: number, pan: number, gain: number) => {
      const osc = new OscillatorNode(ctx, { type, frequency });
      const g = new GainNode(ctx, { gain: 0 });
      const p = new StereoPannerNode(ctx, { pan });
      osc.connect(g).connect(p).connect(masterRef.current!);
      return { osc, g, p, target: gain };
    };
    const vA = makeVoice(waveA, freqA, panA, gainA);
    const vB = makeVoice(waveB, freqB, panB, gainB);
    oscARef.current = vA.osc; gARef.current = vA.g; pARef.current = vA.p;
    oscBRef.current = vB.osc; gBRef.current = vB.g; pBRef.current = vB.p;

    vA.osc.start(); vB.osc.start();
    ramp(vA.g.gain, vA.target, ctx);
    ramp(vB.g.gain, vB.target, ctx);

    // record session start
    sessionStartRef.current = { start: Date.now(), planned: minutes, band };

    setPlaying(true);
    if (minutes > 0) setDeadline(Date.now() + minutes * 60 * 1000);

    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        const bandInfo = BANDS[band];
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Brain",
          artist: `${bandInfo.name} focus`,
          album: "Binaural Session",
          artwork: [
            {
              src: "/icons/brain-icon-maskable.svg",
              sizes: "512x512",
              type: "image/svg+xml",
            },
          ],
        });
        navigator.mediaSession.playbackState = "playing";
        navigator.mediaSession.setActionHandler("pause", () => stop());
        navigator.mediaSession.setActionHandler("stop", () => stop());
        navigator.mediaSession.setActionHandler("play", async () => {
          const current = ctxRef.current;
          if (current && current.state !== "running") {
            await current.resume().catch(() => {});
          }
          if (!ctxRef.current) {
            start();
          }
        });
      } catch {
        // no-op if Media Session API not available
      }
    }
  }

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      const t = ctx.currentTime + 0.06;
      if (gARef.current) ramp(gARef.current.gain, 0, ctx);
      if (gBRef.current) ramp(gBRef.current.gain, 0, ctx);
      if (oscARef.current) try { oscARef.current.stop(t); } catch {}
      if (oscBRef.current) try { oscBRef.current.stop(t); } catch {}
      setTimeout(() => {
        try { mediaStreamRef.current?.disconnect(); } catch {}
        mediaStreamRef.current = null;
        if (mediaElementRef.current) {
          const media = mediaElementRef.current;
          media.pause();
          media.removeAttribute("src");
          media.srcObject = null;
          media.load();
        }
        try { masterRef.current?.disconnect(); } catch {}
        masterRef.current = null;
        splitterRef.current = null;
        analyserLRef.current = null;
        analyserRRef.current = null;
        ctx.close();
        ctxRef.current = null;
      }, 120);
    }
    setPlaying(false);
    setDeadline(null);
    setRing(0);

    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.playbackState = "paused";
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
      } catch {
        // ignore
      }
    }

    if (sessionStartRef.current) {
      const { start: startedAt, planned, band: bandAtStart } = sessionStartRef.current;
      const endedAt = Date.now();

      // record WHOLE minutes (floor), not rounded
      const durationMin = Math.max(0, Math.floor((endedAt - startedAt) / 60000));

      const rec: Session = { startedAt, endedAt, durationMin, plannedMin: planned, band: bandAtStart };
      setSessions(prev => [rec, ...prev].slice(0, 200));
      sessionStartRef.current = null;
    }
  }, []);

  // Timer ring
  useRaf(() => {
    if (!deadline) return;
    const now = Date.now();
    const total = minutes * 60 * 1000;
    const left = Math.max(0, deadline - now);
    setRing(1 - left / total);
    if (left === 0 && playing) stop();
  }, !!deadline);

  useEffect(() => {
    if (!playing || !deadline) return;
    const remaining = Math.max(0, deadline - Date.now());
    if (remaining === 0) {
      stop();
      return;
    }
    const timeout = window.setTimeout(() => {
      stop();
    }, remaining);
    return () => window.clearTimeout(timeout);
  }, [playing, deadline, stop]);

  // Oscilloscope draw (guard for null canvases + only on Home tab)
  useRaf(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (tab !== 'home') return;
    const cL = scopeLRef.current;
    const cR = scopeRRef.current;
    if (analyserLRef.current && cL) drawScopeFromAnalyser(analyserLRef.current, cL, "#111827", BANDS[band].color);
    else drawScopeFake(cL, "#111827", BANDS[band].color);
    if (analyserRRef.current && cR) drawScopeFromAnalyser(analyserRRef.current, cR, "#111827", BANDS[band].color);
    else drawScopeFake(cR, "#111827", BANDS[band].color);
  }, true);

  useEffect(() => {
    if (!showOnboarding) return;
    const step = ONBOARDING_STEPS[onboardingStep] ?? ONBOARDING_STEPS[0];
    if (step && tab !== step.tab) {
      setTab(step.tab);
    }
  }, [showOnboarding, onboardingStep, tab]);

  // Quant handlers
  function handleQuantSubmit(){
    const raw = (quantInput ?? '').toString().trim().replace(',', '.');
    if (!raw) { setQuantFeedback('wrong'); return; }
    const val = parseFloat(raw);
    if (Number.isNaN(val)) { setQuantFeedback('wrong'); return; }
    const tol = quantQ.kind==='arith' ? 0 : Math.max(0.05 * Math.abs(quantQ.answer), 0.01);
    const correct = approxEqual(val, quantQ.answer, tol);
    setQuantFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      setQuantScore(s => s + 1);
      handleQuantNext();
    }
  }
  function handleQuantNext(){
    const next = genQuantUnique(quantRecent, 24);
    setQuantQ(next);
    setQuantInput("");
    setQuantReveal(false);
    setQuantFeedback(null);
    setQuantRecent(r => [next.prompt, ...r].slice(0, 12));
  }
  function handleQuantPrev(){
    setQuantInput("");
    setQuantReveal(false);
    setQuantFeedback(null);
  }

  // Pattern handlers
  function handlePatternSubmit(){
    const val = parseNum(patternInput);
    const ans = Number(patternRef.current?.ans ?? NaN);
    if (!Number.isFinite(val) || !Number.isFinite(ans)) { setPatternFeedback('wrong'); return; }
    const correct = val === ans;
    setPatternFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      setPatternScore(s=>s+1);
      handlePatternNext();
    }
  }
  function handlePatternNext(){ newPattern(); }
  function handlePatternPrev(){
    setPatternHist(h=>{
      if (!h.length) return h;
      const prev = h[h.length-1];
      patternRef.current = prev;
      lastPatternTypeRef.current = prev.type;
      setPatternInput("");
      setPatternFeedback(null);
      setPatternReveal(false);
      return h.slice(0,-1);
    });
  }
  function handlePatternReveal(){ setPatternReveal(true); }

  function handleOnboardingPrev() {
    setOnboardingStep(i => Math.max(i - 1, 0));
  }
  function handleOnboardingNext() {
    if (onboardingIsLast) {
      handleOnboardingFinish();
      return;
    }
    setOnboardingStep(i => Math.min(i + 1, lastOnboardingStepIndex));
  }
  function handleOnboardingFinish() {
    markOnboardingSeen();
    setShowOnboarding(false);
    setOnboardingStep(0);
  }
  function handleOnboardingSkip() {
    markOnboardingSeen();
    setShowOnboarding(false);
    setOnboardingStep(0);
  }
  function handleReplayTour() {
    clearOnboardingSeen();
    setOnboardingStep(0);
    setShowOnboarding(true);
  }

  // soundscapes helper: pick and auto play
  function pickBandAndPlay(k: BandKey) {
    setBand(k);
    setActiveTone(null); // deactivate any tone
    if (!playing) start();
  }

  // tones helper: pick pure tone and auto play
  function pickToneAndPlay(k: ToneKey) {
    const tone = PURE_TONES[k];
    setActiveTone(k);
    setBaseHz(tone.frequency);
    setFreqA(tone.frequency);
    setFreqB(tone.frequency);
    setBand("pure"); // use pure mode for no binaural beat
    if (!playing) start();
  }

  // ------------ Derived for UI ------------
  const accent = BANDS[band].color;

  // Daily Dose counts only sessions >= 14 minutes, today
  const todayCount = sessions.filter(s =>
    isSameDay(new Date(s.endedAt), new Date()) &&
    s.durationMin >= SESSION_MINUTES
  ).length;

  const activeView = (() => {
    switch (tab) {
      case "home":
        return (
          <HomeView
            baseHz={baseHz}
            offset={offset}
            minutes={minutes}
            setBaseHz={setBaseHz}
            setOffset={setOffset}
            setMinutes={setMinutes}
            scopeLRef={scopeLRef}
            scopeRRef={scopeRRef}
            playing={playing}
            ring={ring}
            deadline={deadline}
            onStart={start}
            onStop={stop}
            accent={accent}
            streak={streak}
            todayCount={todayCount}
          />
        );
      case "soundscapes":
        return (
          <SoundscapesView
            band={band}
            favorites={favorites}
            setFavorites={setFavorites}
            onPick={pickBandAndPlay}
          />
        );
      case "studio":
        return (
          <StudioView
            freqA={freqA}
            setFreqA={setFreqA}
            freqB={freqB}
            setFreqB={setFreqB}
            gainA={gainA}
            setGainA={setGainA}
            gainB={gainB}
            setGainB={setGainB}
            panA={panA}
            setPanA={setPanA}
            panB={panB}
            setPanB={setPanB}
            waveA={waveA}
            setWaveA={setWaveA}
            waveB={waveB}
            setWaveB={setWaveB}
          />
        );
      case "focus":
        return (
          <FocusView
            // Quant
            quantQ={quantQ}
            quantInput={quantInput}
            setQuantInput={setQuantInput}
            quantFeedback={quantFeedback}
            quantReveal={quantReveal}
            quantScore={quantScore}
            onQuantSubmit={handleQuantSubmit}
            onQuantNext={handleQuantNext}
            onQuantPrev={handleQuantPrev}
            onQuantReveal={() => setQuantReveal(true)}
            // Vocab
            nextWord={nextWord}
            vocab={vocab}
            // Pattern
            patternRef={patternRef}
            patternScore={patternScore}
            patternHist={patternHist}
            patternInput={patternInput}
            setPatternInput={setPatternInput}
            patternFeedback={patternFeedback}
            patternReveal={patternReveal}
            onPatternSubmit={handlePatternSubmit}
            onPatternNext={handlePatternNext}
            onPatternPrev={handlePatternPrev}
            onPatternReveal={handlePatternReveal}
          />
        );
      case "tones":
        return (
          <TonesView
            activeTone={activeTone}
            toneFavorites={toneFavorites}
            setToneFavorites={setToneFavorites}
            onPick={pickToneAndPlay}
          />
        );
      case "history":
        return <HistoryView sessions={sessions} onClear={() => { setSessions([]); }} />;
      default:
        return null;
    }
  })();

  return (
    <div className="min-h-screen text-foreground flex flex-col">
      <audio
        ref={mediaElementRef}
        aria-hidden="true"
        preload="auto"
        className="absolute -z-50 h-0 w-0 opacity-0"
      />

      {/* BOLD HEADER - Full Width */}
      <header className="sticky top-0 z-[100] bg-white border-b-[6px] border-black shadow-[0_6px_0_rgba(0,0,0,1)]">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              className={`inline-flex items-center gap-2 rounded-full border-[4px] px-8 py-3 text-lg font-extrabold shadow-[4px_4px_0_rgba(0,0,0,1)] transition-all duration-200 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                ${playing ? "text-white bg-[#FF6B9D] border-black" : "text-white bg-[#00D1FF] border-black"}
              `}
              aria-label="Brain"
            >
              <IconWaveTriangle className="h-6 w-6" />
              <span>BRAIN</span>
            </button>
            {playing && (
              <div className="animate-bounce">
                <Badge className="bg-[#FF6B9D] text-white border-[3px] border-black font-extrabold text-sm px-4 py-1.5 shadow-[3px_3px_0_rgba(0,0,0,1)]">
                  ⚡ LIVE
                </Badge>
              </div>
            )}
            <div className="hidden md:flex items-center gap-3">
              <PwaInstallButton />
            </div>
          </div>
        </div>
      </header>

      {/* DESKTOP NAV - Bold Tabs */}
      <div className="hidden md:block sticky top-[88px] z-[90] bg-[#FFD93D] border-b-[6px] border-black">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 py-3">
            <NavItem icon={<Home size={20} />} label="Home" active={tab === "home"} onClick={() => setTab("home")} />
            <NavItem icon={<Brain size={20} />} label="Soundscapes" active={tab === "soundscapes"} onClick={() => setTab("soundscapes")} />
            <NavItem icon={<Sparkles size={20} />} label="Tones" active={tab === "tones"} onClick={() => setTab("tones")} />
            <NavItem icon={<SlidersHorizontal size={20} />} label="Studio" active={tab === "studio"} onClick={() => setTab("studio")} />
            <NavItem icon={<BookOpenText size={20} />} label="Focus" active={tab === "focus"} onClick={() => setTab("focus")} />
            <NavItem icon={<Activity size={20} />} label="History" active={tab === "history"} onClick={() => setTab("history")} />
          </nav>
        </div>
      </div>

      {/* MAIN CONTENT - Full Width */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 md:py-8 mb-24 md:mb-8">
        <div className="max-w-[1800px] mx-auto">
          {activeView}
        </div>
      </main>

      {/* MOBILE BOTTOM NAV - Bold & Cartoonish */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFD93D] border-t-[6px] border-black z-[100]">
        <nav className="grid grid-cols-6 gap-1 p-2">
          <NavItem icon={<Home size={20} />} label="Home" active={tab === "home"} onClick={() => setTab("home")} />
          <NavItem icon={<Brain size={20} />} label="Beats" active={tab === "soundscapes"} onClick={() => setTab("soundscapes")} />
          <NavItem icon={<Sparkles size={20} />} label="Tones" active={tab === "tones"} onClick={() => setTab("tones")} />
          <NavItem icon={<SlidersHorizontal size={20} />} label="Studio" active={tab === "studio"} onClick={() => setTab("studio")} />
          <NavItem icon={<BookOpenText size={20} />} label="Focus" active={tab === "focus"} onClick={() => setTab("focus")} />
          <NavItem icon={<Activity size={20} />} label="History" active={tab === "history"} onClick={() => setTab("history")} />
        </nav>
      </div>

      {!showOnboarding && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReplayTour}
          className="fixed right-4 bottom-28 md:right-6 md:bottom-6 z-40 shadow-lg text-xs font-medium"
        >
          Replay tour
        </Button>
      )}

      {showOnboarding && onboardingCurrent && (
        <div className="fixed inset-0 z-[80] bg-slate-900/35 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-lg">
            <Card className="relative border-2 border-black/20 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500 transition-all duration-500 rounded-r-lg"
                  style={{ width: `${onboardingProgressPct}%` }}
                />
              </div>
              <CardHeader className="space-y-3 pt-7 pb-3">
                <Badge variant="outline" className="w-fit text-[11px] uppercase tracking-wide">
                  Step {safeOnboardingStepIndex + 1} of {ONBOARDING_STEPS.length}
                </Badge>
                <CardTitle className="text-xl font-semibold">{onboardingCurrent.title}</CardTitle>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {onboardingCurrent.summary}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-foreground/90">
                  {onboardingCurrent.bullets.map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-foreground/70" aria-hidden />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl border border-dashed border-black/10 bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  Currently highlighting the <span className="font-medium text-foreground">{TAB_LABELS[onboardingCurrent.tab]}</span> tab.
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/60 px-6 py-4">
                <Button variant="ghost" size="sm" onClick={handleOnboardingSkip} className="text-sm text-muted-foreground hover:text-foreground">
                  Skip
                </Button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleOnboardingPrev} disabled={safeOnboardingStepIndex === 0}>
                    Back
                  </Button>
                  <Button size="sm" onClick={handleOnboardingNext}>
                    {onboardingIsLast ? "Finish" : "Next"}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );

  // ---------- drawing helpers ----------
  function drawScopeFromAnalyser(analyser: AnalyserNode, canvas: HTMLCanvasElement | null, core: string, glow: string) {
    if (!canvas) return;
    const ctx2 = canvas.getContext("2d"); if (!ctx2) return;
    const w = (canvas.width = Math.max(1, canvas.clientWidth * (window.devicePixelRatio || 1)));
    const h = (canvas.height = Math.max(1, canvas.clientHeight * (window.devicePixelRatio || 1)));
    ctx2.clearRect(0, 0, w, h);
    ctx2.fillStyle = "#fff"; ctx2.fillRect(0, 0, w, h);
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(buf);

    ctx2.beginPath();
    for (let i = 0; i < buf.length; i++) {
      const x = (i / (buf.length - 1)) * w; const y = (buf[i] / 255) * h;
      if (i) { ctx2.lineTo(x, y); } else { ctx2.moveTo(x, y); }
    }
    ctx2.lineWidth = 3; ctx2.strokeStyle = glow; ctx2.shadowBlur = 10; ctx2.shadowColor = glow; ctx2.globalAlpha = .85; ctx2.stroke();

    ctx2.beginPath();
    for (let i = 0; i < buf.length; i++) {
      const x = (i / (buf.length - 1)) * w; const y = (buf[i] / 255) * h;
      if (i) { ctx2.lineTo(x, y); } else { ctx2.moveTo(x, y); }
    }
    ctx2.lineWidth = 1.2; ctx2.strokeStyle = core; ctx2.shadowBlur = 0; ctx2.globalAlpha = 1; ctx2.stroke();
  }

  function drawScopeFake(canvas: HTMLCanvasElement | null, core: string, glow: string) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const w = (canvas.width = Math.max(1, canvas.clientWidth * (window.devicePixelRatio || 1)));
    const h = (canvas.height = Math.max(1, canvas.clientHeight * (window.devicePixelRatio || 1)));
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);

    ctx.beginPath();
    for (let i = 0; i < w; i++) {
      const t = i / w; const y = h / 2 + Math.sin(t * Math.PI * 4) * (h * 0.18);
      if (i) { ctx.lineTo(i, y); } else { ctx.moveTo(i, y); }
    }
    ctx.lineWidth = 3; ctx.strokeStyle = glow; ctx.shadowBlur = 10; ctx.shadowColor = glow; ctx.globalAlpha = .85; ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < w; i++) {
      const t = i / w; const y = h / 2 + Math.sin(t * Math.PI * 4) * (h * 0.18);
      if (i) { ctx.lineTo(i, y); } else { ctx.moveTo(i, y); }
    }
    ctx.lineWidth = 1.2; ctx.strokeStyle = core; ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.stroke();
  }
}

// ---- Views (Home, Soundscapes, Studio, Focus, History) ----
function HomeView({ baseHz, offset, minutes, setBaseHz, setOffset, setMinutes, scopeLRef, scopeRRef, playing, ring, deadline, onStart, onStop, accent, streak, todayCount }:{
  baseHz: number; offset: number; minutes: number;
  setBaseHz: (n:number)=>void; setOffset:(n:number)=>void; setMinutes:(n:number)=>void;
  scopeLRef: React.RefObject<HTMLCanvasElement | null>; scopeRRef: React.RefObject<HTMLCanvasElement | null>;
  playing:boolean; ring:number; deadline:number|null; onStart:()=>void; onStop:()=>void; accent:string; streak:number; todayCount:number;
}){
  return (
    <div className="grid gap-12">
      {/* Now Playing */}
      <Card style={{backgroundColor: '#FFD93D'}}>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">🎵 Now Playing</CardTitle>
            <div className="hidden md:block px-4 py-2 bg-white border-[3px] border-black rounded-full shadow-[3px_3px_0_rgba(0,0,0,1)]">
              <span className="text-sm font-black">🔥 {streak} day{streak===1?"":"s"}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
          {/* Visualizer - Hidden on Mobile */}
          <div className="hidden lg:grid gap-5">
            <div className="space-y-3">
              <div className="inline-block px-4 py-2 bg-white border-[3px] border-black rounded-full shadow-[3px_3px_0_rgba(0,0,0,1)]">
                <span className="text-xs font-black uppercase">👈 Left Channel</span>
              </div>
              <div className="rounded-3xl border-[5px] border-black bg-black h-48 overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,1)]">
                <canvas ref={scopeLRef} className="h-full w-full" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="inline-block px-4 py-2 bg-white border-[3px] border-black rounded-full shadow-[3px_3px_0_rgba(0,0,0,1)]">
                <span className="text-xs font-black uppercase">👉 Right Channel</span>
              </div>
              <div className="rounded-3xl border-[5px] border-black bg-black h-48 overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,1)]">
                <canvas ref={scopeRRef} className="h-full w-full" />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-6 pt-0 lg:pt-8">
            <HeroControl playing={playing} ring={ring} deadline={deadline} onStart={onStart} onStop={onStop} accent={accent} />
            <div className="w-full grid gap-4">
              <QuickField label="Base Hz" value={baseHz} min={60} max={1200} step={1} onChange={setBaseHz} />
              <QuickField label="Offset" value={offset} min={0} max={40} step={0.1} onChange={setOffset} />
              <QuickField label="Minutes" value={minutes} min={1} max={120} step={1} onChange={setMinutes} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Dose */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">⚡ Daily Dose</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4 text-sm">
          <span className={`inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 rounded-full border-[4px] border-black transition-all duration-200 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] font-black uppercase text-sm ${todayCount>=1? 'bg-[#6BCF7F] text-white' : 'bg-white text-black/50'}`}>✓ Session 1</span>
          <span className={`inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 rounded-full border-[4px] border-black transition-all duration-200 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] font-black uppercase text-sm ${todayCount>=2? 'bg-[#6BCF7F] text-white' : 'bg-white text-black/50'}`}>✓ Session 2</span>
          <span className={`inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 rounded-full border-[4px] border-black transition-all duration-200 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] font-black uppercase text-sm ${todayCount>=3? 'bg-[#6BCF7F] text-white' : 'bg-white text-black/50'}`}>✓ Session 3</span>
          <p className="w-full text-xs font-bold text-black/60 pt-1">⏱️ Sessions count after 14 minutes of play!</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SoundscapesView({ band, favorites, setFavorites, onPick }:{
  band:BandKey; favorites:BandKey[]; setFavorites:(favs:BandKey[])=>void; onPick:(k:BandKey)=>void;
}){
  function toggleFav(k:BandKey){ setFavorites(favorites.includes(k)? favorites.filter((x: BandKey)=>x!==k): [...favorites,k]); }
  return (
    <div className="grid gap-12">
      {/* Favorites */}
      <div className="grid gap-6">
        <div className="inline-block w-fit px-6 py-3 bg-[#FFD93D] border-[4px] border-black rounded-full shadow-[5px_5px_0_rgba(0,0,0,1)]">
          <span className="text-lg font-black uppercase">⭐ My Favorites</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {favorites.map(k=> (
            <MoodCard
              key={k}
              k={k}
              active={band===k}
              onPick={()=>onPick(k)}
              onFav={()=>toggleFav(k)}
              highlight
            />
          ))}
        </div>
      </div>

      {/* All */}
      <div className="grid gap-6">
        <div className="inline-block w-fit px-6 py-3 bg-white border-[4px] border-black rounded-full shadow-[5px_5px_0_rgba(0,0,0,1)]">
          <span className="text-lg font-black uppercase">🎨 All Moodscapes</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {(Object.keys(BANDS) as BandKey[])
            .filter((k) => !favorites.includes(k))
            .map(k=> (
              <MoodCard
                key={k}
                k={k}
                active={band===k}
                onPick={()=>onPick(k)}
                onFav={()=>toggleFav(k)}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function MoodCard({ k, active, onPick, onFav, highlight }:{ k:BandKey; active:boolean; onPick:()=>void; onFav:()=>void; highlight?:boolean; }){
  const v = BANDS[k];
  const inFavorites = highlight ?? false;
  const starProps = inFavorites
    ? { fill: "#FFD93D", stroke: "black", strokeWidth: "2", className: "h-6 w-6" }
    : { fill: "white", stroke: "black", strokeWidth: "2", className: "h-6 w-6" };
  return (
    <button
      onClick={onPick}
      className={`relative rounded-3xl border-[5px] border-black px-6 py-8 text-left bg-white transition-all duration-200 shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${active? 'ring-[5px] ring-[#00D1FF] ring-offset-4' : ''} group`}
      style={{backgroundColor: active ? v.color : 'white'}}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-5xl" aria-hidden>{v.icon}</div>
        <button
          onClick={(e)=>{e.stopPropagation(); onFav();}}
          className="hover:scale-125 transition-transform"
        >
          <Star {...starProps} />
        </button>
      </div>
      <div className={`font-black text-2xl mb-2 ${active ? 'text-white' : 'text-black'}`}>{v.name}</div>
      <div className={`text-sm font-bold ${active ? 'text-white/90' : 'text-black/70'}`}>{v.range[0]}–{v.range[1]} Hz</div>
      <div className={`text-xs font-extrabold uppercase tracking-wider mt-1 ${active ? 'text-white/80' : 'text-black/60'}`}>{v.hint}</div>
    </button>
  );
}

function TonesView({ activeTone, toneFavorites, setToneFavorites, onPick }:{
  activeTone: ToneKey | null;
  toneFavorites: ToneKey[];
  setToneFavorites: (favs: ToneKey[]) => void;
  onPick: (k: ToneKey) => void;
}){
  function toggleFav(k: ToneKey) {
    setToneFavorites(toneFavorites.includes(k) ? toneFavorites.filter((x: ToneKey) => x !== k) : [...toneFavorites, k]);
  }

  // Group by category
  const byCategory: Record<string, ToneKey[]> = {};
  const allToneKeys = Object.keys(PURE_TONES) as ToneKey[];
  allToneKeys.forEach(k => {
    const cat = PURE_TONES[k].category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(k);
  });

  return (
    <div className="grid gap-12">
      {/* Favorites */}
      {toneFavorites.length > 0 && (
        <div className="grid gap-6">
          <div className="inline-block w-fit px-6 py-3 bg-[#FFD93D] border-[4px] border-black rounded-full shadow-[5px_5px_0_rgba(0,0,0,1)]">
            <span className="text-lg font-black uppercase">⭐ Favorite Tones</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {toneFavorites.map(k => (
              <ToneCard
                key={k}
                k={k}
                active={activeTone === k}
                onPick={() => onPick(k)}
                onFav={() => toggleFav(k)}
                highlight
              />
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {Object.entries(byCategory).map(([category, tones]) => {
        const nonFavTones = tones.filter(k => !toneFavorites.includes(k));
        if (nonFavTones.length === 0) return null;

        return (
          <div key={category} className="grid gap-6">
            <div className="inline-block w-fit px-6 py-3 bg-white border-[4px] border-black rounded-full shadow-[5px_5px_0_rgba(0,0,0,1)]">
              <span className="text-lg font-black uppercase">{category}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nonFavTones.map(k => (
                <ToneCard
                  key={k}
                  k={k}
                  active={activeTone === k}
                  onPick={() => onPick(k)}
                  onFav={() => toggleFav(k)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ToneCard({ k, active, onPick, onFav, highlight }:{
  k: ToneKey;
  active: boolean;
  onPick: () => void;
  onFav: () => void;
  highlight?: boolean;
}){
  const tone = PURE_TONES[k];
  const inFavorites = highlight ?? false;
  const starProps = inFavorites
    ? { fill: "#FFD93D", stroke: "black", strokeWidth: "2", className: "h-6 w-6" }
    : { fill: "white", stroke: "black", strokeWidth: "2", className: "h-6 w-6" };

  return (
    <button
      onClick={onPick}
      className={`relative rounded-3xl border-[5px] border-black px-6 py-6 text-left bg-white transition-all duration-200 shadow-[6px_6px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none ${active ? 'ring-[5px] ring-[#00D1FF] ring-offset-4' : ''} group`}
      style={{ backgroundColor: active ? tone.color : 'white' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-4xl" aria-hidden>{tone.icon}</div>
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className="hover:scale-125 transition-transform"
        >
          <Star {...starProps} />
        </button>
      </div>
      <div className={`font-black text-xl mb-1 ${active ? 'text-white' : 'text-black'}`}>{tone.name}</div>
      <div className={`text-sm font-bold mb-2 ${active ? 'text-white/90' : 'text-black/70'}`}>{tone.frequency} Hz</div>
      <div className={`text-xs font-extrabold uppercase tracking-wider mb-3 ${active ? 'text-white/80' : 'text-black/60'}`}>{tone.hint}</div>

      {/* Description bullets in small text */}
      <div className={`space-y-1 text-[10px] leading-relaxed ${active ? 'text-white/70' : 'text-black/50'}`}>
        {tone.description.map((desc, idx) => (
          <div key={idx} className="flex items-start gap-1.5">
            <span className="mt-1 inline-block h-1 w-1 rounded-full flex-shrink-0" style={{ backgroundColor: active ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)' }} />
            <span>{desc}</span>
          </div>
        ))}
      </div>
    </button>
  );
}

function StudioView(props:{
  freqA:number; setFreqA:(n:number)=>void; freqB:number; setFreqB:(n:number)=>void;
  gainA:number; setGainA:(n:number)=>void; gainB:number; setGainB:(n:number)=>void;
  panA:number; setPanA:(n:number)=>void; panB:number; setPanB:(n:number)=>void;
  waveA:OscillatorType; setWaveA:(w:OscillatorType)=>void; waveB:OscillatorType; setWaveB:(w:OscillatorType)=>void;
}){
  const {freqA,setFreqA,freqB,setFreqB,gainA,setGainA,gainB,setGainB,panA,setPanA,panB,setPanB,waveA,setWaveA,waveB,setWaveB}=props;
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <VoiceCard title="Voice A" freq={freqA} setFreq={setFreqA} gain={gainA} setGain={setGainA} pan={panA} setPan={setPanA} wave={waveA} setWave={setWaveA} />
      <VoiceCard title="Voice B" freq={freqB} setFreq={setFreqB} gain={gainB} setGain={setGainB} pan={panB} setPan={setPanB} wave={waveB} setWave={setWaveB} />
    </div>
  );
}

function VoiceCard({title,freq,setFreq,gain,setGain,pan,setPan,wave,setWave}:{title:string;freq:number;setFreq:(n:number)=>void;gain:number;setGain:(n:number)=>void;pan:number;setPan:(n:number)=>void;wave:OscillatorType;setWave:(w:OscillatorType)=>void;}){
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Headphones className="h-4 w-4" />{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field label="Frequency" value={freq} setValue={setFreq} min={20} max={2000} step={1} />
        <Field label="Volume" value={gain} setValue={setGain} min={0} max={1} step={0.001} isFloat />
        <Field label="Pan" value={pan} setValue={setPan} min={-1} max={1} step={0.01} isFloat />
        <SelectWave value={wave} setValue={setWave} />
      </CardContent>
    </Card>
  );
}

function FocusView(props:{
  // Quant
  quantQ: ReturnType<typeof genQuant>;
  quantInput: string;
  setQuantInput: (s:string)=>void;
  quantFeedback: null | 'correct' | 'wrong';
  quantReveal: boolean;
  quantScore: number;
  onQuantSubmit: ()=>void;
  onQuantNext: ()=>void;
  onQuantPrev: ()=>void;
  onQuantReveal: ()=>void;
  // Vocab
  nextWord: ()=>void; vocab: VocabPair;
  // Pattern
  patternRef: React.RefObject<{seq:number[];ans:number;solution:string; type:'x2'|'arith'|'fib'}>;
  patternScore:number;
  patternHist:{seq:number[];ans:number;solution:string; type:'x2'|'arith'|'fib'}[];
  patternInput:string; setPatternInput:(s:string)=>void;
  patternFeedback: null | 'correct' | 'wrong';
  patternReveal: boolean;
  onPatternSubmit: ()=>void; onPatternNext: ()=>void; onPatternPrev: ()=>void; onPatternReveal: ()=>void;
}){
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Focus</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="quant">
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
            <TabsTrigger value="quant">Quant</TabsTrigger>
            <TabsTrigger value="vocab">Vocab</TabsTrigger>
            <TabsTrigger value="pattern">Pattern</TabsTrigger>
          </TabsList>

          {/* Quant */}
          <TabsContent value="quant" className="mt-4 space-y-3">
            <div className="text-base font-medium">{props.quantQ.prompt}</div>
            {props.quantReveal && (
              <div className="text-sm bg-muted/50 border rounded-lg p-3 space-y-1">
                {props.quantQ.formula && <div><span className="font-semibold">Formula:</span> {props.quantQ.formula}</div>}
                <div><span className="font-semibold">Solution:</span> {props.quantQ.solution}</div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Input className="w-full sm:w-40" type="text" inputMode="decimal" value={props.quantInput} onChange={e=>props.setQuantInput(e.target.value)} placeholder="answer" onKeyDown={e=>{ if(e.key==='Enter') props.onQuantSubmit(); }} />
              <Button className="w-full sm:w-auto" onClick={props.onQuantSubmit}>Submit</Button>
              <Button className="w-full sm:w-auto" variant="secondary" onClick={props.onQuantPrev}><History className="h-4 w-4 mr-1"/>Prev</Button>
              <Button className="w-full sm:w-auto" variant="secondary" onClick={props.onQuantReveal}>Reveal</Button>
              <Button className="w-full sm:w-auto" variant="secondary" onClick={props.onQuantNext}>Next</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Score <span className="text-foreground font-semibold">{props.quantScore}</span></span>
              {props.quantFeedback==='correct' && <span className="text-green-600">✓ correct</span>}
              {props.quantFeedback==='wrong' && <span className="text-red-600">✗ try again</span>}
            </div>
          </TabsContent>

          {/* Vocab */}
          <TabsContent value="vocab" className="mt-4 space-y-3">
            <div className="text-lg font-medium">{props.vocab[0]}</div>
            <div className="text-sm text-muted-foreground">{props.vocab[1]}</div>
            <Button variant="secondary" onClick={props.nextWord}>Shuffle</Button>
          </TabsContent>

          {/* Pattern — mirrors Quant UX */}
          <TabsContent value="pattern" className="mt-4 space-y-3">
            <div className="text-lg font-mono">{props.patternRef.current?.seq.join(', ')}, ?</div>
            {props.patternReveal && (
              <div className="text-sm bg-muted/50 border rounded-lg p-3 space-y-1">
                <div><span className="font-semibold">Solution:</span> {props.patternRef.current?.solution}. Answer = <span className="font-semibold">{props.patternRef.current?.ans}</span></div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="w-full sm:w-32"
                type="text"
                inputMode="numeric"
                value={props.patternInput}
                onChange={e => props.setPatternInput(e.target.value)}
                placeholder="answer"
                onKeyDown={e => { if (e.key === 'Enter') props.onPatternSubmit(); }}
              />
              <Button className="w-full sm:w-auto" onClick={props.onPatternSubmit}>Submit</Button>
              <Button className="w-full sm:w-auto" variant="secondary" onClick={props.onPatternPrev}><History className="h-4 w-4 mr-1" />Prev</Button>
              <Button className="w-full sm:w-auto" variant="secondary" onClick={props.onPatternReveal}>Reveal</Button>
              <Button className="w-full sm:w-auto" variant="secondary" onClick={props.onPatternNext}>Next</Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Streak <span className="text-foreground font-semibold">{props.patternScore}</span></span>
              {props.patternFeedback==='correct' && <span className="text-green-600">✓ correct</span>}
              {props.patternFeedback==='wrong' && <span className="text-red-600">✗ try again</span>}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function HistoryView({ sessions, onClear }: { sessions: Session[]; onClear: () => void; }){
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-sm text-muted-foreground">Recent Sessions</CardTitle>
            <Button className="w-full sm:w-auto" variant="secondary" size="sm" onClick={onClear}><Trash2 className="h-4 w-4 mr-1"/>Clear</Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-muted-foreground">
          {sessions.length === 0 && <div className="text-muted-foreground/80">No sessions yet. Hit Play to start your first.</div>}
          {sessions.map((s, i) => {
            const d = new Date(s.endedAt);
            const date = formatDate(d);
            const dur = `${s.durationMin}m`;
            return (
              <div key={s.startedAt+":"+i} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-b-0 last:pb-0">
                <span className="text-sm">{date} · {dur} · {BANDS[s.band].name}</span>
                <span className="text-emerald-600">✓</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Badges</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2 sm:gap-3 text-sm">
          <span className="px-3 py-2 rounded-xl border bg-card">Day 1</span>
          <span className="px-3 py-2 rounded-xl border bg-card opacity-60">3 Day Streak</span>
          <span className="px-3 py-2 rounded-xl border bg-card opacity-60">7 Day Streak</span>
        </CardContent>
      </Card>
    </div>
  );
}

function NavItem({icon,label,active,onClick}:{icon:React.ReactNode;label:string;active:boolean;onClick:()=>void;}){
  return (
    <button
      onClick={onClick}
      className={`flex md:flex-row flex-col items-center justify-center gap-2 py-2 md:py-2.5 px-3 md:px-6 rounded-full border-[3px] border-black font-extrabold transition-all duration-200 focus-visible:outline-none shadow-[3px_3px_0_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${active? 'text-white bg-[#00D1FF]' : 'text-black bg-white'}`}
    >
      <div>{icon}</div>
      <div className="text-[9px] md:text-xs uppercase tracking-wider">{label}</div>
    </button>
  );
}

function QuickField({label,value,min,max,step,onChange}:{label:string;value:number;min:number;max:number;step:number;onChange:(n:number)=>void;}){
  return (
    <div className="space-y-3">
      <div className="inline-block px-4 py-2 bg-white border-[3px] border-black rounded-full shadow-[3px_3px_0_rgba(0,0,0,1)]">
        <Label className="text-xs font-black uppercase tracking-wider">{label}</Label>
      </div>
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v])=>onChange(Number(v))} />
        </div>
        <input
          className="w-24 px-4 py-3 text-center text-lg font-black border-[4px] border-black rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:shadow-[2px_2px_0_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
          type="number" value={value} min={min} max={max} step={step} onChange={e=>onChange(Number(e.target.value||0))}
        />
      </div>
    </div>
  );
}

function Field({ label, value, setValue, min, max, step, isFloat }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number; step: number; isFloat?: boolean; }) {
  return (
    <div className="space-y-3">
      <div className="inline-block px-4 py-2 bg-white border-[3px] border-black rounded-full shadow-[3px_3px_0_rgba(0,0,0,1)]">
        <Label className="text-xs font-black uppercase tracking-wider">{label}</Label>
      </div>
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => setValue(isFloat ? Number(v) : Math.round(v))} />
        </div>
        <input
          className="w-24 px-4 py-3 text-center text-lg font-black border-[4px] border-black rounded-xl shadow-[4px_4px_0_rgba(0,0,0,1)] focus:outline-none focus:shadow-[2px_2px_0_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
          type="number" value={value} min={min} max={max} step={step}
          onChange={e => setValue(isFloat ? Number(e.target.value || 0) : Number.parseInt(e.target.value || "0"))}
        />
      </div>
    </div>
  );
}

function SelectWave({ value, setValue }: { value: OscillatorType; setValue: (w: OscillatorType) => void; }) {
  const waves: Array<{type: OscillatorType; emoji: string}> = [
    { type: "sine", emoji: "〰️" },
    { type: "triangle", emoji: "📐" },
    { type: "square", emoji: "⬛" },
    { type: "sawtooth", emoji: "🪚" },
  ];

  return (
    <div className="space-y-3">
      <div className="inline-block px-4 py-2 bg-white border-[3px] border-black rounded-full shadow-[3px_3px_0_rgba(0,0,0,1)]">
        <Label className="text-xs font-black uppercase tracking-wider">Wave Type</Label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {waves.map((w) => (
          <button
            key={w.type}
            onClick={() => setValue(w.type)}
            className={`flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border-[4px] border-black font-black uppercase text-xs tracking-wider transition-all shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] ${value === w.type ? 'bg-[#00D1FF] text-white' : 'bg-white text-black'}`}
          >
            <span className="text-2xl">{w.emoji}</span>
            <span>{w.type}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ------------------------
// Minimal runtime tests
// ------------------------
if (typeof window !== "undefined" && !window.__NBS_TESTED__) {
  window.__NBS_TESTED__ = true;
  console.assert(clamp(5, 0, 10) === 5, "clamp: within bounds");
  console.assert(clamp(-1, 0, 1) === 0, "clamp: low bound");
  console.assert(clamp(2, 0, 1) === 1, "clamp: high bound");
  const list: VocabPair[] = [["a","A"],["b","B"],["c","C"]];
  console.assert(JSON.stringify(nextWordPick(["a","A"], list)) === JSON.stringify(["b","B"]), "nextWordPick: a->b");
  console.assert(JSON.stringify(nextWordPick(["c","C"], list)) === JSON.stringify(["a","A"]), "nextWordPick: wraps to a");
  console.assert(JSON.stringify(nextWordPick(["x","X"], list)) === JSON.stringify(["a","A"]), "nextWordPick: fallback to first if missing");
  const s = series(1, 5, function(n){ return n + 1; });
  console.assert(JSON.stringify(s) === JSON.stringify([1,2,3,4,5]), "series: linear");
  console.assert(approxEqual(1.00, 1.01, 0.02) === true, "approxEqual: within tol");
  console.assert(approxEqual(1.00, 1.03, 0.02) === false, "approxEqual: outside tol");
  for(let i=0;i<50;i++){ const v=rint(2,5); console.assert(v>=2 && v<=5, "rint: bounds"); }
  const q1 = genQuant(); console.assert(q1 && typeof q1.answer === 'number', 'genQuant: numeric answer');
  const q2 = genQuant(); console.assert(q1.prompt !== q2.prompt || q1.answer !== q2.answer, 'genQuant: randomizes');
}

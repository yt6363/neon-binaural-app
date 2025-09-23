'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { History, Headphones, Star, StarOff, Play, Pause, Home, SlidersHorizontal, Brain, BookOpenText, Activity, Trash2 } from "lucide-react";

// ------------------------------------------------------------
// Neon Binaural Studio — 2025 Revamp (Light mode / Gen Z UX)
// Full app shell + working tabs + audio engine + real scopes
// This patch wires Session History + Daily Streak with localStorage.
// Also fixes Pattern game to match Quant reveal panel and Enter submit.
// And sets equal heights for both visualizer rectangles.
// ------------------------------------------------------------

const BANDS = {
  delta: { name: "Delta", range: [0.5, 4], hint: "deep sleep", color: "#00BFA6", icon: "🌙" },
  theta: { name: "Theta", range: [4, 8], hint: "meditation", color: "#1DA1F2", icon: "🧘" },
  alpha: { name: "Alpha", range: [8, 12], hint: "calm focus", color: "#FF6B6B", icon: "🫧" },
  beta:  { name: "Beta",  range: [12, 30], hint: "active focus", color: "#FFD700", icon: "⚡" },
  gamma: { name: "Gamma", range: [30, 80], hint: "high attention", color: "#7C3AED", icon: "✨" },
  pure:  { name: "Pure",  range: [0, 0],  hint: "no beat",      color: "#111827", icon: "◯" },
} as const;

type BandKey = keyof typeof BANDS;

type VocabPair = [word: string, def: string];
const DEFAULT_WORDS: VocabPair[] = [
  ["concise", "brief and clear"],
  ["cogent", "logical and convincing"],
  ["prudent", "acting with care and thought"],
  ["lucid", "easy to understand"],
  ["salient", "most noticeable"],
  ["tenable", "defensible"],
  ["succinct", "expressed with few words"],
  ["astute", "able to assess and exploit"],
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

// --- Session history / streak types & helpers ---
export type Session = {
  startedAt: number;          // epoch ms
  endedAt: number;            // epoch ms
  durationMin: number;        // rounded minutes
  plannedMin: number;         // minutes slider at start
  band: BandKey;              // preset used
};

const SESSIONS_KEY = "nbs.sessions.v1";
const MIN_COUNTED_MINUTES = 1; // counts toward streak if ≥ 1 minute

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
    if (s.durationMin >= MIN_COUNTED_MINUTES) {
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
  answer: number;     // numeric expected answer (CAGR uses %)
  solution: string;   // short solution
};

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
      answer: Math.round(cagr * 100 * 100) / 100, // percent, 2dp
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

// Pure helper for testability
export function nextWordPick(current: VocabPair, list: VocabPair[]): VocabPair {
  const idx = list.findIndex(([w]) => w === current[0]);
  if (idx === -1) return list[0] ?? current;
  const next = (idx + 1) % Math.max(1, list.length);
  return list[next] ?? current;
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

function HeroControl({ playing, ring, deadline, onStart, onStop, accent, streak }: { playing: boolean; ring: number; deadline: number | null; onStart: () => void; onStop: () => void; accent: string; streak: number; }) {
  const [mmss, setMmss] = useState("00:00");
  useRaf(() => {
    if (!deadline) { setMmss("00:00"); return; }
    const ms = Math.max(0, deadline - Date.now());
    const m = Math.floor(ms / 60000); const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    setMmss(`${String(m).padStart(2, '0')}:${s}`);
  }, !!deadline);
  return (
    <div className="grid place-items-center gap-2">
      <button
        onClick={playing ? onStop : onStart}
        className="relative w-24 h-24 rounded-full grid place-items-center select-none bg-white shadow-lg border border-black/5"
        aria-label={playing ? "Pause" : "Play"}
      >
        <ProgressRing value={ring} size={96} color={playing ? accent : "#111827"} bg="rgba(0,0,0,.08)" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl" style={{ color: playing ? accent : "#111827" }}>{playing ? <Pause /> : <Play />}</div>
            <div className="text-[11px] font-mono text-neutral-600">{mmss}</div>
          </div>
        </div>
      </button>
      <div className="text-[11px] text-neutral-600">Streak: <span className="font-semibold text-neutral-800">{streak} day{streak===1?"":"s"}</span></div>
    </div>
  );
}

// ----------- MAIN APP -----------
export default function NeonBinauralStudio() {
  const [tab, setTab] = useState<'home'|'soundscapes'|'studio'|'focus'|'history'>("home");
  const [playing, setPlaying] = useState(false);
  const [band, setBand] = useState<BandKey>("theta");
  const [baseHz, setBaseHz] = useState(220);
  const [offset, setOffset] = useState(6);
  const [minutes, setMinutes] = useState(15);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [ring, setRing] = useState(0);
  const [favorites, setFavorites] = useState<BandKey[]>(["alpha", "theta"]);

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

  // Focus tools state — Quant (Math + Consulting merged)
  const [quantQ, setQuantQ] = useState<QuantQ>(() => genQuant());
  const [quantFeedback, setQuantFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [quantInput, setQuantInput] = useState<string>("");
  const [quantReveal, setQuantReveal] = useState(false);
  const [quantScore, setQuantScore] = useState(0);

  // Pattern game state
  type PatternItem = { seq: number[]; ans: number; solution: string };
  const patternRef = useRef<PatternItem>({ seq: [2, 4, 8, 16], ans: 32, solution: "Each term ×2. Next = last × 2" });
  const [patternHist, setPatternHist] = useState<PatternItem[]>([]);
  const [patternInput, setPatternInput] = useState("");
  const [patternScore, setPatternScore] = useState(0);
  const [patternFeedback, setPatternFeedback] = useState<null | 'correct' | 'wrong'>(null);
  const [patternReveal, setPatternReveal] = useState(false);

  const [vocab, setVocab] = useState<VocabPair>(DEFAULT_WORDS[0]);
  function nextWord() { setVocab(cur => nextWordPick(cur, DEFAULT_WORDS)); }

  // Pattern generation function with solution text
  const newPattern = useCallback(() => {
    setPatternHist(h => (patternRef.current ? [...h, patternRef.current] : h).slice(-20));
    const type = ['x2','arith','fib'][rint(0, 2)];
    let seq: number[] = [], ans = 0, solution = "";
    if (type==='x2'){
      seq = series(2, 5, function(n){ return n * 2; });
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
    patternRef.current = { seq, ans, solution };
    setPatternInput("");
    setPatternFeedback(null);
    setPatternReveal(false);
  }, []);

  // Initialize pattern generation on mount
  useEffect(() => {
    newPattern();
  }, [newPattern]);

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
  const scopeLRef = useRef<HTMLCanvasElement | null>(null);
  const scopeRRef = useRef<HTMLCanvasElement | null>(null);

  // Load sessions on mount
  useEffect(() => {
    const s = loadSessions();
    setSessions(s);
    setStreak(computeStreak(s));
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

  // Timer ring
  useRaf(() => {
    if (!deadline) return;
    const now = Date.now();
    const total = minutes * 60 * 1000;
    const left = Math.max(0, deadline - now);
    setRing(1 - left / total);
    if (left === 0 && playing) stop();
  }, !!deadline);

  // Oscilloscope draw (guard for null canvases + only on Home tab)
  useRaf(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (tab !== 'home') return;
    const cL = scopeLRef.current;
    const cR = scopeRRef.current;
    // Left
    if (analyserLRef.current && cL) drawScopeFromAnalyser(analyserLRef.current, cL, "#111827", BANDS[band].color);
    else drawScopeFake(cL, "#111827", BANDS[band].color);
    // Right
    if (analyserRRef.current && cR) drawScopeFromAnalyser(analyserRRef.current, cR, "#111827", BANDS[band].color);
    else drawScopeFake(cR, "#111827", BANDS[band].color);
  }, true);

  function ramp(param: AudioParam, value: number, ctx: AudioContext) {
    const now = ctx.currentTime;
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + 0.03);
  }

  function start() {
    if (playing) return;
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx({ sampleRate: 48000 });
    ctxRef.current = ctx;
    masterRef.current = new GainNode(ctx, { gain: 0.9 });

    // analysis path
    splitterRef.current = new ChannelSplitterNode(ctx, { numberOfOutputs: 2 });
    analyserLRef.current = new AnalyserNode(ctx, { fftSize: 2048, smoothingTimeConstant: 0.85 });
    analyserRRef.current = new AnalyserNode(ctx, { fftSize: 2048, smoothingTimeConstant: 0.85 });
    masterRef.current.connect(splitterRef.current);
    splitterRef.current.connect(analyserLRef.current, 0);
    splitterRef.current.connect(analyserRRef.current, 1);
    masterRef.current.connect(ctx.destination);

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
  }

  function stop() {
    if (ctxRef.current) {
      const ctx = ctxRef.current;
      const t = ctx.currentTime + 0.06;
      if (gARef.current) ramp(gARef.current.gain, 0, ctx);
      if (gBRef.current) ramp(gBRef.current.gain, 0, ctx);
      if (oscARef.current) try { oscARef.current.stop(t); } catch {}
      if (oscBRef.current) try { oscBRef.current.stop(t); } catch {}
      setTimeout(() => {
        ctx.close();
        ctxRef.current = null;
        analyserLRef.current = null; analyserRRef.current = null;
      }, 120);
    }
    setPlaying(false);
    setDeadline(null);
    setRing(0);

    if (sessionStartRef.current) {
      const { start: startedAt, planned, band: bandAtStart } = sessionStartRef.current;
      const endedAt = Date.now();
      const durationMin = Math.max(0, Math.round((endedAt - startedAt) / 60000));
      const rec: Session = { startedAt, endedAt, durationMin, plannedMin: planned, band: bandAtStart };
      setSessions(prev => [rec, ...prev].slice(0, 200));
      sessionStartRef.current = null;
    }
  }

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
    setQuantQ(genQuant());
    setQuantInput("");
    setQuantReveal(false);
    setQuantFeedback(null);
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
  function handlePatternNext(){
    newPattern();
  }
  function handlePatternPrev(){
    setPatternHist(h=>{
      if (!h.length) return h;
      const prev = h[h.length-1];
      patternRef.current = prev;
      setPatternInput("");
      setPatternFeedback(null);
      setPatternReveal(false);
      return h.slice(0,-1);
    });
  }
  function handlePatternReveal(){
    setPatternReveal(true);
  }

  // ------------ Derived for UI ------------
  const accent = BANDS[band].color;
  const todayCount = sessions.filter(s => isSameDay(new Date(s.endedAt), new Date())).length;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <div className="max-w-5xl mx-auto p-16 pt-8 pb-28 space-y-16">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-semibold tracking-tight">Neon Binaural</div>
            {playing && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">LIVE</Badge>}
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <NavItem icon={<Home size={16}/>} label="Home" active={tab==='home'} onClick={()=>setTab('home')} />
            <NavItem icon={<Brain size={16}/>} label="Soundscapes" active={tab==='soundscapes'} onClick={()=>setTab('soundscapes')} />
            <NavItem icon={<SlidersHorizontal size={16}/>} label="Studio" active={tab==='studio'} onClick={()=>setTab('studio')} />
            <NavItem icon={<BookOpenText size={16}/>} label="Focus" active={tab==='focus'} onClick={()=>setTab('focus')} />
            <NavItem icon={<Activity size={16}/>} label="History" active={tab==='history'} onClick={()=>setTab('history')} />
          </div>
        </div>

        {tab === 'home' && (
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
        )}

        {tab === 'soundscapes' && (
          <SoundscapesView band={band} setBand={setBand} favorites={favorites} setFavorites={setFavorites} />
        )}

        {tab === 'studio' && (
          <StudioView
            freqA={freqA} setFreqA={setFreqA}
            freqB={freqB} setFreqB={setFreqB}
            gainA={gainA} setGainA={setGainA}
            gainB={gainB} setGainB={setGainB}
            panA={panA} setPanA={setPanA}
            panB={panB} setPanB={setPanB}
            waveA={waveA} setWaveA={setWaveA}
            waveB={waveB} setWaveB={setWaveB}
          />
        )}

        {tab === 'focus' && (
          <FocusView
            // Quant
            quantQ={quantQ}
            quantInput={quantInput}
            setQuantInput={setQuantInput} quantFeedback={quantFeedback}
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
        )}

        {tab === 'history' && (
          <HistoryView sessions={sessions} onClear={()=>{ setSessions([]); }} />
        )}
      </div>

      {/* Bottom nav (mobile) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-black/10 p-2 grid grid-cols-5 md:hidden">
        <NavItem icon={<Home size={18}/>} label="Home" active={tab==='home'} onClick={()=>setTab('home')} />
        <NavItem icon={<Brain size={18}/>} label="Sound" active={tab==='soundscapes'} onClick={()=>setTab('soundscapes')} />
        <NavItem icon={<SlidersHorizontal size={18}/>} label="Studio" active={tab==='studio'} onClick={()=>setTab('studio')} />
        <NavItem icon={<BookOpenText size={18}/>} label="Focus" active={tab==='focus'} onClick={()=>setTab('focus')} />
        <NavItem icon={<Activity size={18}/>} label="History" active={tab==='history'} onClick={()=>setTab('history')} />
      </div>
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
      const x = (i / (buf.length - 1)) * w; const y = (buf[i] / 255) * h; i ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y);
    }
    ctx2.lineWidth = 3; ctx2.strokeStyle = glow; ctx2.shadowBlur = 10; ctx2.shadowColor = glow; ctx2.globalAlpha = .85; ctx2.stroke();
    ctx2.beginPath();
    for (let i = 0; i < buf.length; i++) {
      const x = (i / (buf.length - 1)) * w; const y = (buf[i] / 255) * h; i ? ctx2.lineTo(x, y) : ctx2.moveTo(x, y);
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
      const t = i / w; const y = h / 2 + Math.sin(t * Math.PI * 4) * (h * 0.18); i ? ctx.lineTo(i, y) : ctx.moveTo(i, y);
    }
    ctx.lineWidth = 3; ctx.strokeStyle = glow; ctx.shadowBlur = 10; ctx.shadowColor = glow; ctx.globalAlpha = .85; ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < w; i++) {
      const t = i / w; const y = h / 2 + Math.sin(t * Math.PI * 4) * (h * 0.18); i ? ctx.lineTo(i, y) : ctx.moveTo(i, y);
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
      <Card className="bg-white border border-black/10">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-neutral-600">Now Playing</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid md:grid-cols-3 gap-8 items-center">
          {/* Visualizer (contained) */}
          <div className="md:col-span-2 grid gap-3">
            <div className="h-32 rounded-xl border border-black/10 bg-white overflow-hidden">
              <canvas ref={scopeLRef} className="h-full w-full" />
            </div>
            <div className="h-32 rounded-xl border border-black/10 bg-white overflow-hidden">
              <canvas ref={scopeRRef} className="h-full w-full" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-6">
            <HeroControl playing={playing} ring={ring} deadline={deadline} onStart={onStart} onStop={onStop} accent={accent} streak={streak} />
            <div className="w-full grid gap-4">
              <QuickField label="Base Hz" value={baseHz} min={60} max={1200} step={1} onChange={setBaseHz} />
              <QuickField label="Offset" value={offset} min={0} max={40} step={0.1} onChange={setOffset} />
              <QuickField label="Minutes" value={minutes} min={1} max={120} step={1} onChange={setMinutes} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Dose */}
      <Card className="bg-white border border-black/10">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-neutral-600">Daily Dose</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-3 text-sm text-neutral-600">
          <span className={`inline-flex items-center px-2 py-1 rounded-full border ${todayCount>=1? 'border-emerald-300 bg-emerald-50 text-emerald-700':'border-black/10'}`}>{todayCount>=1? '☑' : '☐'} Session 1</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full border ${todayCount>=2? 'border-emerald-300 bg-emerald-50 text-emerald-700':'border-black/10 opacity-60'}`}>{todayCount>=2? '☑' : '☐'} Session 2</span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full border ${todayCount>=3? 'border-emerald-300 bg-emerald-50 text-emerald-700':'border-black/10 opacity-60'}`}>{todayCount>=3? '☑' : '☐'} Session 3</span>
        </CardContent>
      </Card>
    </div>
  );
}

function SoundscapesView({ band, setBand, favorites, setFavorites }:{ band:BandKey; setBand:(b:BandKey)=>void; favorites:BandKey[]; setFavorites:(favs:BandKey[])=>void; }){
  function toggleFav(k:BandKey){ setFavorites(favorites.includes(k)? favorites.filter((x: BandKey)=>x!==k): [...favorites,k]); }
  return (
    <div className="grid gap-10">
      {/* Favorites */}
      <div className="grid gap-3">
        <div className="text-sm text-neutral-600">My Favorites</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {favorites.map(k=> <MoodCard key={k} k={k} active={band===k} onPick={()=>setBand(k)} onFav={()=>toggleFav(k)} />)}
        </div>
      </div>

      {/* All */}
      <div className="grid gap-3">
        <div className="text-sm text-neutral-600">All Moodscapes</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {(Object.keys(BANDS) as BandKey[]).map(k=> <MoodCard key={k} k={k} active={band===k} onPick={()=>setBand(k)} onFav={()=>toggleFav(k)} />)}
        </div>
      </div>
    </div>
  );
}

function MoodCard({ k, active, onPick, onFav }:{ k:BandKey; active:boolean; onPick:()=>void; onFav:()=>void; }){
  const v = BANDS[k];
  return (
    <button onClick={onPick} className={`relative rounded-2xl border px-3 py-4 text-left bg-white ${active? 'border-black/40' : 'border-black/10'} group`}>
      <div className="flex items-center justify-between">
        <div className="text-2xl" aria-hidden>{v.icon}</div>
        <div onClick={(e)=>{e.stopPropagation(); onFav();}} className="opacity-70 hover:opacity-100">
          {active ? <Star fill="#111" color="#111" size={18}/> : <StarOff size={18}/>}
        </div>
      </div>
      <div className="mt-3 font-medium" style={{color:'#111827'}}>{v.name}</div>
      <div className="text-xs text-neutral-600">{v.range[0]}–{v.range[1]} Hz · {v.hint}</div>
      <div className="absolute inset-x-3 bottom-3 h-1 rounded-full" style={{background:v.color, opacity:.2}}/>
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
    <Card className="bg-white border border-black/10">
      <CardHeader className="pb-2"><CardTitle className="text-sm text-neutral-600 flex items-center gap-2"><Headphones className="h-4 w-4" />{title}</CardTitle></CardHeader>
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
  // Quant (Math + Consulting)
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
  patternRef: React.RefObject<{seq:number[];ans:number;solution:string}>;
  patternScore:number;
  patternHist:{seq:number[];ans:number;solution:string}[];
  patternInput:string; setPatternInput:(s:string)=>void;
  patternFeedback: null | 'correct' | 'wrong';
  patternReveal: boolean;
  onPatternSubmit: ()=>void; onPatternNext: ()=>void; onPatternPrev: ()=>void; onPatternReveal: ()=>void;
}){
  return (
    <Card className="bg-white border border-black/10">
      <CardHeader className="pb-2"><CardTitle className="text-sm text-neutral-600">Focus</CardTitle></CardHeader>
      <CardContent>
        <Tabs defaultValue="quant">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="quant">Quant</TabsTrigger>
            <TabsTrigger value="vocab">Vocab</TabsTrigger>
            <TabsTrigger value="pattern">Pattern</TabsTrigger>
          </TabsList>

          {/* Quant: Math + Consulting */}
          <TabsContent value="quant" className="mt-4 space-y-3">
            <div className="text-base font-medium">{props.quantQ.prompt}</div>
            {props.quantReveal && (
              <div className="text-sm bg-neutral-50 border border-black/10 rounded-lg p-3 space-y-1">
                {props.quantQ.formula && <div><span className="font-semibold">Formula:</span> {props.quantQ.formula}</div>}
                <div><span className="font-semibold">Solution:</span> {props.quantQ.solution}</div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input className="w-40" type="text" inputMode="decimal" value={props.quantInput} onChange={e=>props.setQuantInput(e.target.value)} placeholder="answer" onKeyDown={e=>{ if(e.key==='Enter') props.onQuantSubmit(); }} />
              <Button onClick={props.onQuantSubmit}>Submit</Button>
              <Button variant="secondary" onClick={props.onQuantPrev}><History className="h-4 w-4 mr-1"/>Prev</Button>
              <Button variant="secondary" onClick={props.onQuantReveal}>Reveal</Button>
              <Button variant="secondary" onClick={props.onQuantNext}>Next</Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-600">
              <span>Score <span className="text-neutral-800 font-semibold">{props.quantScore}</span></span>
              {props.quantFeedback==='correct' && <span className="text-green-600">✓ correct</span>}
              {props.quantFeedback==='wrong' && <span className="text-red-600">✗ try again</span>}
            </div>
          </TabsContent>

          {/* Vocab */}
          <TabsContent value="vocab" className="mt-4 space-y-3">
            <div className="text-lg font-medium">{props.vocab[0]}</div>
            <div className="text-sm text-neutral-600">{props.vocab[1]}</div>
            <Button variant="secondary" onClick={props.nextWord}>Next</Button>
          </TabsContent>

          {/* Pattern — mirrors Quant UX */}
          <TabsContent value="pattern" className="mt-4 space-y-3">
            <div className="text-lg font-mono">{props.patternRef.current?.seq.join(', ')}, ?</div>
            {props.patternReveal && (
              <div className="text-sm bg-neutral-50 border border-black/10 rounded-lg p-3 space-y-1">
                <div><span className="font-semibold">Solution:</span> {props.patternRef.current?.solution}. Answer = <span className="font-semibold">{props.patternRef.current?.ans}</span></div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                className="w-32"
                type="text"
                inputMode="numeric"
                value={props.patternInput}
                onChange={e => props.setPatternInput(e.target.value)}
                placeholder="answer"
                onKeyDown={e => { if (e.key === 'Enter') props.onPatternSubmit(); }}
              />
              <Button onClick={props.onPatternSubmit}>Submit</Button>
              <Button variant="secondary" onClick={props.onPatternPrev}><History className="h-4 w-4 mr-1" />Prev</Button>
              <Button variant="secondary" onClick={props.onPatternReveal}>Reveal</Button>
              <Button variant="secondary" onClick={props.onPatternNext}>Next</Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-600">
              <span>Streak <span className="text-neutral-800 font-semibold">{props.patternScore}</span></span>
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
      <Card className="bg-white border border-black/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-neutral-600">Recent Sessions</CardTitle>
            <Button variant="secondary" size="sm" onClick={onClear}><Trash2 className="h-4 w-4 mr-1"/>Clear</Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-neutral-700">
          {sessions.length === 0 && <div className="text-neutral-500">No sessions yet. Hit Play to start your first.</div>}
          {sessions.map((s, i) => {
            const d = new Date(s.endedAt);
            const date = formatDate(d);
            const dur = `${s.durationMin}m`;
            return (
              <div key={s.startedAt+":"+i} className="flex items-center justify-between border-b border-black/5 pb-2 last:border-b-0 last:pb-0">
                <span>{date} · {dur} · {BANDS[s.band].name}</span>
                <span className="text-emerald-600">✓</span>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card className="bg-white border border-black/10">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-neutral-600">Badges</CardTitle></CardHeader>
        <CardContent className="flex gap-3 text-sm">
          <span className="px-3 py-2 rounded-xl border border-black/10 bg-white">Day 1</span>
          <span className="px-3 py-2 rounded-xl border border-black/10 bg-white opacity-60">3 Day Streak</span>
          <span className="px-3 py-2 rounded-xl border border-black/10 bg-white opacity-60">7 Day Streak</span>
        </CardContent>
      </Card>
    </div>
  );
}

function NavItem({icon,label,active,onClick}:{icon:React.ReactNode;label:string;active:boolean;onClick:()=>void;}){
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 rounded-xl ${active? 'text-neutral-900' : 'text-neutral-500'}`}>
      <div className={`p-2 rounded-full ${active? 'bg-neutral-200' : 'bg-transparent'}`}>{icon}</div>
      <div className="text-[11px] mt-1">{label}</div>
    </button>
  );
}

function QuickField({label,value,min,max,step,onChange}:{label:string;value:number;min:number;max:number;step:number;onChange:(n:number)=>void;}){
  return (
    <div className="space-y-2">
      <Label className="text-xs text-neutral-500">{label}</Label>
      <div className="flex items-center gap-3">
        <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v])=>onChange(Number(v))} />
        <Input className="w-24" type="number" value={value} min={min} max={max} step={step} onChange={e=>onChange(Number(e.target.value||0))} />
      </div>
    </div>
  );
}

function Field({ label, value, setValue, min, max, step, isFloat }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number; step: number; isFloat?: boolean; }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-neutral-500">{label}</Label>
      <div className="flex items-center gap-3">
        <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => setValue(isFloat ? Number(v) : Math.round(v))} />
        <Input className="w-24" type="number" value={value} min={min} max={max} step={step}
          onChange={e => setValue(isFloat ? Number(e.target.value || 0) : Number.parseInt(e.target.value || "0"))} />
      </div>
    </div>
  );
}

function SelectWave({ value, setValue }: { value: OscillatorType; setValue: (w: OscillatorType) => void; }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-neutral-500">Wave</Label>
      <div className="grid grid-cols-4 gap-2">
        {["sine", "triangle", "square", "sawtooth"].map((w) => (
          <button key={w} onClick={() => setValue(w as OscillatorType)}
            className={`text-xs rounded-md px-2 py-1 border transition ${value === w ? "border-neutral-600 bg-neutral-100" : "border-black/10 bg-white"}`}>{w}</button>
        ))}
      </div>
    </div>
  );
}

// ------------------------
// Minimal runtime tests (extended)
// ------------------------
if (typeof window !== "undefined" && !(window as any).__NBS_TESTED__) {
  (window as any).__NBS_TESTED__ = true;
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

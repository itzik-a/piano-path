/* App state: one object, saved to localStorage on every change.
   Shape is unchanged from v1, so progress saved by the old page loads as-is.
   Sync (src/state/sync.ts) listens via `onLocalChange` and writes back via `replaceState`. */
import { useSyncExternalStore } from "react";
import { KEYS } from "../data/curriculum";

export type ArpStatus = "solid" | "learning" | "none";
export type ScaleForm = "maj" | "nat" | "harm" | "mel";

export interface LogEntry {
  /** date, YYYY-MM-DD */
  d: string;
  /** items ticked (auto entries); older entries have only `min` */
  n?: number;
  /** minutes, from before practice became item based (no longer written) */
  min?: number;
  note: string;
  items: string;
  ts: number;
  /** filled in automatically from Today's ticks (one per day) */
  auto?: boolean;
}

export interface PieceProgress {
  /** index into PIECE_STEPS */
  step: number;
  /** "working on bars", free text, e.g. "17–32" */
  bars?: string;
}

export type Rot = "scale" | "arp" | "chord";
export const ROTS: Rot[] = ["scale", "arp", "chord"];

/** Daily key rotations (scales, arpeggios, chords): how many times each key has been ticked (n), plus the latest day's ticks. */
export interface Rotation {
  n: Record<Rot, Record<string, number>>;
  day: ({ d: string } & Record<Rot, string[]>) | null;
}

/** Study drill results: what keeps coming back, and how many answers a day. */
export interface StudyState {
  /** outstanding misses per drill item ("keys:D", "cards:C:min:7:4:1"): +1 on a miss, −1 when right; removed at 0 */
  miss: Record<string, number>;
  /** answers per day and drill, [answered, right], kept 60 days: { "2026-11-22": { keys: [12, 10] } } */
  days: Record<string, Record<string, [number, number]>>;
}

/** One section of a piece's harmonic analysis (Study → Analysis notes). */
export interface AnalysisRow {
  /** creation time, also the row's id */
  id: number;
  /** "1–8" */
  bars: string;
  /** "B minor" */
  key: string;
  /** Roman numerals, free text: "i – iv⁶ – V⁷ – i" */
  harm: string;
  note: string;
}

export interface AppState {
  v: 1;
  settings: { minutes: number; stage: number };
  arps: Record<string, ArpStatus>;
  scales: Record<string, Record<ScaleForm, number>>;
  checks: Record<string, boolean>;
  /** arpeggio fingerings you've entered, keyed "<key>:<form>", e.g. "A:3" */
  fingerings: Record<string, string>;
  /** learning progress per repertoire item id */
  pieces: Record<string, PieceProgress>;
  log: LogEntry[];
  /** `ts` of deleted log entries, so a delete on one device sticks after sync */
  logDeleted: number[];
  today: { date: string; done: Record<string, boolean> } | null;
  rot: Rotation;
  study: StudyState;
  /** harmonic analysis per piece: repertoire item id, or "keep:<title>" for Keep up pieces outside the stages */
  analysis: Record<string, AnalysisRow[]>;
  updatedAt: number;
}

const LS = "pianoPath.v1";

export const todayStr = () => new Date().toLocaleDateString("en-CA");

export function defaults(): AppState {
  const arps: AppState["arps"] = {};
  const scales: AppState["scales"] = {};
  KEYS.forEach((o, i) => {
    arps[o.k] = i < 6 ? "solid" : "none";
    scales[o.k] = { maj: 95, nat: 95, harm: 0, mel: 0 };
  });
  return { v: 1, settings: { minutes: 45, stage: 1 }, arps, scales, checks: {}, fingerings: {}, pieces: {}, log: [], logDeleted: [], today: null, rot: { n: { scale: {}, arp: {}, chord: {} }, day: null }, study: { miss: {}, days: {} }, analysis: {}, updatedAt: 0 };
}

/* Chords used to rotate by key ("C" = C major and A minor together); now major and minor are separate
   items ("C:maj", "C:min"). An old key entry counts for both. */
function chordCounts(n: Record<string, number>) {
  const out: Record<string, number> = {};
  for (const [k, c] of Object.entries(n)) {
    if (k.includes(":")) out[k] = (out[k] || 0) + c;
    else [`${k}:maj`, `${k}:min`].forEach((id) => { out[id] = (out[id] || 0) + c; });
  }
  return out;
}
const chordTicks = (ids: string[]) => [...new Set(ids.flatMap((k) => (k.includes(":") ? [k] : [`${k}:maj`, `${k}:min`])))];

export function normalize(s: unknown): AppState {
  const d = defaults();
  if (!s || typeof s !== "object") return d;
  const x = s as Partial<AppState>;
  return {
    v: 1,
    settings: { ...d.settings, ...(x.settings || {}) },
    arps: { ...d.arps, ...(x.arps || {}) },
    scales: { ...d.scales, ...(x.scales || {}) },
    checks: x.checks || {},
    fingerings: x.fingerings || {},
    pieces: x.pieces || {},
    log: Array.isArray(x.log) ? x.log : [],
    logDeleted: Array.isArray(x.logDeleted) ? x.logDeleted : [],
    today: x.today || null,
    rot: x.rot ? {
      n: { scale: x.rot.n?.scale || {}, arp: x.rot.n?.arp || {}, chord: chordCounts(x.rot.n?.chord || {}) },
      day: x.rot.day ? { ...x.rot.day, scale: x.rot.day.scale || [], arp: x.rot.day.arp || [], chord: chordTicks(x.rot.day.chord || []) } : null,
    } : d.rot,
    study: { miss: x.study?.miss || {}, days: x.study?.days || {} },
    analysis: x.analysis || {},
    updatedAt: x.updatedAt || 0,
  };
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) return normalize(JSON.parse(raw));
  } catch { /* fall through */ }
  return defaults();
}

let state: AppState = load();
const listeners = new Set<() => void>();
const localListeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }
function saveLocal() {
  try { localStorage.setItem(LS, JSON.stringify(state)); } catch { /* storage full or blocked */ }
}

export const getState = () => state;

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

/** Apply a local change: copy, mutate, stamp, save, notify. */
export function update(fn: (draft: AppState) => void) {
  const next = structuredClone(state);
  fn(next);
  next.updatedAt = Date.now();
  state = next;
  saveLocal();
  emit();
  localListeners.forEach((l) => l());
}

/** Called after changes made on this device (not after sync replaces state). */
export function onLocalChange(l: () => void) {
  localListeners.add(l);
  return () => { localListeners.delete(l); };
}

/** Replace state wholesale (used by sync when a newer copy arrives). */
export function replaceState(s: unknown) {
  state = normalize(s);
  saveLocal();
  emit();
}

export function useAppState() {
  return useSyncExternalStore(subscribe, getState);
}

/* Keep two open tabs on the same device in step. */
window.addEventListener("storage", (e) => {
  if (e.key === LS && e.newValue) {
    try { state = normalize(JSON.parse(e.newValue)); emit(); } catch { /* ignore */ }
  }
});

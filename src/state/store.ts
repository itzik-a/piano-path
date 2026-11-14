/* App state: one object, saved to localStorage on every change.
   Shape is unchanged from v1, so progress saved by the old page loads as-is.
   Sync (Firebase, coming next) will hook in via `subscribe` + `replaceState`. */
import { useSyncExternalStore } from "react";
import { KEYS } from "../data/curriculum";

export type ArpStatus = "solid" | "learning" | "none";
export type ScaleForm = "maj" | "nat" | "harm" | "mel";

export interface LogEntry {
  /** date, YYYY-MM-DD */
  d: string;
  min: number;
  note: string;
  items: string;
  ts: number;
}

export interface AppState {
  v: 1;
  settings: { minutes: number; stage: number };
  arps: Record<string, ArpStatus>;
  scales: Record<string, Record<ScaleForm, number>>;
  checks: Record<string, boolean>;
  log: LogEntry[];
  today: { date: string; done: Record<string, boolean> } | null;
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
  return { v: 1, settings: { minutes: 45, stage: 1 }, arps, scales, checks: {}, log: [], today: null, updatedAt: 0 };
}

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
    log: Array.isArray(x.log) ? x.log : [],
    today: x.today || null,
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

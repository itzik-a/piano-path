/* Small UI choices (tabs, inversions, open sections, picked keys) kept on this device in localStorage.
   Not synced: each device keeps its own. */
import { useState } from "react";
import { todayStr } from "../state/store";

function read<T>(key: string, fallback: () => T, valid: (v: unknown) => boolean): T {
  const raw = localStorage.getItem(key);
  if (raw == null) return fallback();
  let v: unknown;
  try { v = JSON.parse(raw); } catch { v = raw; } // older prefs were saved as plain strings
  return valid(v) ? (v as T) : fallback();
}

/** Like useState, but the value is saved under `key` and restored next time. `valid` guards against stale or odd saved values. */
export function usePref<T>(key: string, fallback: () => T, valid: (v: unknown) => boolean = () => true) {
  const [v, setV] = useState<T>(() => read(key, fallback, valid));
  const set = (next: T) => { setV(next); localStorage.setItem(key, JSON.stringify(next)); };
  return [v, set] as const;
}

/** A choice kept for the rest of today only; tomorrow it starts again from `fallback` (e.g. today's rotation key). */
export function useDayPref<T>(key: string, fallback: () => T, valid: (v: unknown) => boolean = () => true) {
  const [saved, setSaved] = usePref<{ d: string; v: T } | null>(key, () => null,
    (x) => !!x && typeof x === "object" && (x as { d: unknown }).d === todayStr() && valid((x as { v: unknown }).v));
  const v = saved && saved.d === todayStr() ? saved.v : fallback();
  return [v, (next: T) => setSaved({ d: todayStr(), v: next })] as const;
}

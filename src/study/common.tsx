/* Small pieces shared by the Study drills. */
import { KEYS, pretty } from "../data/curriculum";

/** The twelve keys as chips (major names, relative minor in the label). `any` adds an "All" chip (value ""). */
export function KeyPicker({ value, onChange, label, any = false }: { value: string; onChange: (k: string) => void; label: string; any?: boolean }) {
  return (
    <div className="key-picker" role="group" aria-label={label}>
      {any && (
        <button type="button" className="key-chip wide" aria-pressed={value === ""} onClick={() => onChange("")}>All</button>
      )}
      {KEYS.map((o) => (
        <button
          type="button" key={o.k} className="key-chip" aria-pressed={o.k === value}
          aria-label={`${pretty(o.k)} major / ${o.m} minor`} onClick={() => onChange(o.k)}
        >
          {pretty(o.k)}
        </button>
      ))}
    </div>
  );
}

/** Fisher–Yates, returning a new array. */
export function shuffle<T>(xs: T[]): T[] {
  const o = [...xs];
  for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  return o;
}

export const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

export const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

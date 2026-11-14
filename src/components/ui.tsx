import type { ReactNode } from "react";
import { IconCheck } from "./Icons";

export function Check({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" className="check" role="checkbox" aria-checked={checked} aria-label={label} onClick={onToggle}>
      <IconCheck width={16} height={16} />
    </button>
  );
}

export function Ring({ value, size = 88, stroke = 8, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`} className="ring-arc"
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}

export function Bar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label={label}>
      <span style={{ width: `${value * 100}%` }} />
    </div>
  );
}

export function Seg<T extends string | number>({ options, value, onChange, label, format }: {
  options: T[]; value: T; onChange: (v: T) => void; label: string; format?: (v: T) => string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={String(o)} aria-pressed={o === value} onClick={() => onChange(o)}>
          {format ? format(o) : String(o)}
        </button>
      ))}
    </div>
  );
}

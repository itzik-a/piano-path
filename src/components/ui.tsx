import { IconCheck } from "./Icons";

export function Check({ checked, label, onToggle }: { checked: boolean; label: string; onToggle: () => void }) {
  return (
    <button type="button" className="check" role="checkbox" aria-checked={checked} aria-label={label} onClick={onToggle}>
      <IconCheck width={16} height={16} />
    </button>
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

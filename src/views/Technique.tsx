import { useEffect, useState, type KeyboardEvent } from "react";
import { KEYS, pretty } from "../data/curriculum";
import { useAppState, type ArpStatus, type ScaleForm } from "../state/store";
import { cycleArp, setTempo } from "../state/actions";
import { arpCount } from "../lib/plan";

const LABEL: Record<ArpStatus, string> = { solid: "Solid", learning: "Learning", none: "Not yet" };
const FORMS: { f: ScaleForm; l: string }[] = [
  { f: "maj", l: "Major" }, { f: "nat", l: "Natural" }, { f: "harm", l: "Harmonic" }, { f: "mel", l: "Melodic" },
];

function Keyboard({ arps }: { arps: Record<string, ArpStatus> }) {
  const whites = ["C", "D", "E", "F", "G", "A", "B"];
  const blacks: [string, number][] = [["Db", 0], ["Eb", 1], ["F#", 3], ["Ab", 4], ["Bb", 5]];
  const fill = (k: string) => ({ solid: "var(--good)", learning: "var(--warn)" } as Record<string, string>)[arps[k]];
  const W = 70, H = 210, BW = 42, BH = 128;
  const key = (k: string) => ({
    className: `k ${arps[k]}`,
    role: "button",
    tabIndex: 0,
    "aria-label": `${pretty(k)} major: ${LABEL[arps[k]]}. Tap to change.`,
    onClick: () => cycleArp(k),
    onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); cycleArp(k); } },
  });
  return (
    <svg className="kbd" viewBox={`0 0 ${W * 7 + 2} ${H + 2}`} role="group" aria-label="Russian arpeggio status by key">
      {whites.map((k, i) => {
        const c = fill(k);
        return (
          <g key={k} {...key(k)}>
            <rect x={1 + i * W + 1.5} y={1} width={W - 3} height={H} rx={10} fill={c || "var(--key-white)"} stroke="var(--key-edge)" />
            <text x={1 + i * W + W / 2} y={H - 18} textAnchor="middle" fontSize={17} fontWeight={600} fill={c ? "var(--on-status)" : "var(--muted)"}>{pretty(k)}</text>
          </g>
        );
      })}
      {blacks.map(([k, after]) => {
        const c = fill(k), x = 1 + (after + 1) * W - BW / 2;
        return (
          <g key={k} {...key(k)}>
            <rect x={x} y={1} width={BW} height={BH} rx={8} fill={c || "var(--key-black)"} />
            <text x={x + BW / 2} y={BH - 14} textAnchor="middle" fontSize={13} fontWeight={600} fill={c ? "var(--on-status)" : "var(--key-black-text)"}>{pretty(k)}</text>
          </g>
        );
      })}
    </svg>
  );
}

/** Number field that commits on blur or Enter, so typing isn't clamped mid-way. */
function TempoInput({ value, onCommit, label }: { value: number; onCommit: (v: number) => void; label: string }) {
  const [v, setV] = useState(String(value || 0));
  useEffect(() => { setV(String(value || 0)); }, [value]);
  const commit = () => {
    const n = Math.max(0, Math.min(240, parseInt(v, 10) || 0));
    setV(String(n));
    if (n !== value) onCommit(n);
  };
  return (
    <input
      className={`tempo ${+v ? "" : "zero"}`} type="number" inputMode="numeric" min={0} max={240} aria-label={label}
      value={v} onChange={(e) => setV(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}

export function Technique() {
  const state = useAppState();
  return (
    <>
      <header className="page-head">
        <h1 className="display">Technique</h1>
        <p className="muted">Arpeggio status and your best clean scale tempos.</p>
      </header>

      <section className="card">
        <div className="card-head">
          <h2>Russian arpeggios</h2>
          <span className="tag good">{arpCount(state)} of 12 solid</span>
        </div>
        <p className="muted small">11 forms per key. Tap a key to cycle: not yet → learning → solid. Suggested order for the keys left: F, F♯, D♭, A♭, E♭, B♭.</p>
        <Keyboard arps={state.arps} />
        <div className="legend">
          <span><i className="sw solid" />Solid</span>
          <span><i className="sw learning" />Learning</span>
          <span><i className="sw none" />Not yet</span>
        </div>
      </section>

      <section className="card">
        <h2>Scales by key</h2>
        <p className="muted small">
          Best clean tempo, hands together, same note grouping per click each time. Enter 0 for a form you haven't learned yet.
          Stage 1 target: harmonic minor at 95, melodic minor at 80.
        </p>
        <div className="table-wrap">
          <table className="scales">
            <thead>
              <tr>
                <th>Key</th>
                {FORMS.map((x) => <th key={x.f}>{x.l}</th>)}
                <th>Arpeggios</th>
              </tr>
            </thead>
            <tbody>
              {KEYS.map((o) => {
                const s = state.scales[o.k];
                return (
                  <tr key={o.k}>
                    <th scope="row"><b>{pretty(o.k)}</b><span>{o.m} min</span></th>
                    {FORMS.map(({ f }) => (
                      <td key={f}>
                        <TempoInput value={s[f]} label={`${pretty(o.k)} ${f} tempo`} onCommit={(v) => setTempo(o.k, f, v)} />
                      </td>
                    ))}
                    <td><button type="button" className={`status ${state.arps[o.k]}`} onClick={() => cycleArp(o.k)}>{LABEL[state.arps[o.k]]}</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

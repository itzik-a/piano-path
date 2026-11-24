/* Learning step (and, optionally, the bars you're working on) for one repertoire piece. */
import { useEffect, useState } from "react";
import { LAST_STEP, PIECE_STEPS } from "../data/curriculum";
import { useAppState } from "../state/store";
import { setPieceBars, setPieceStep } from "../state/actions";

function BarsInput({ id, value }: { id: string; value: string }) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);
  return (
    <label className="bars">
      <span>Working on bars</span>
      <input
        className="fingering" type="text" inputMode="text" autoComplete="off" spellCheck={false}
        placeholder="e.g. 17–32" value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => { if (v.trim() !== value) setPieceBars(id, v); }}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
    </label>
  );
}

export function PieceProgress({ id, title, showBars = false }: { id: string; title: string; showBars?: boolean }) {
  const state = useAppState();
  const p = state.pieces[id];
  const step = state.checks[id] ? LAST_STEP : p?.step ?? 0;
  return (
    <div className="piece-progress">
      <div className="progress-steps" role="group" aria-label={`Learning step for ${title}`}>
        {PIECE_STEPS.map((s, i) => (
          <button
            key={s.l} type="button" className={`step ${i <= step ? "reached" : ""}`}
            aria-pressed={i === step} aria-label={`Step ${i + 1}: ${s.l}`} title={s.l}
            onClick={() => setPieceStep(id, i)}
          >
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="step-label">
        Step {step + 1} of {PIECE_STEPS.length}: <b>{PIECE_STEPS[step].l}</b>
        {!showBars && p?.bars && step < LAST_STEP && <> · bars {p.bars}</>}
      </div>
      {showBars && <BarsInput id={id} value={p?.bars ?? ""} />}
    </div>
  );
}

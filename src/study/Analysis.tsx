/* Analysis notes: for each piece, sections by bar range with the key, the Roman numerals and a note.
   Stored in state `analysis` (synced). A keypad adds the symbols a phone keyboard lacks (° ø ⁶ ₄ …). */
import { useEffect, useRef, useState } from "react";
import { MAINTAIN, STAGES, imslp } from "../data/curriculum";
import { IconExternal, IconPlus, IconTrash } from "../components/Icons";
import { usePref } from "../lib/prefs";
import { useAppState, type AnalysisRow } from "../state/store";
import { addAnalysisRow, deleteAnalysisRow, restoreAnalysisRow, setAnalysisRow } from "../state/actions";

interface Piece { id: string; t: string; q?: string; group: string }
const PIECES: Piece[] = [
  ...MAINTAIN.map((m) => ({ id: `keep:${m.t}`, t: m.t, group: "Keep up" })),
  ...STAGES.flatMap((st) => st.items.filter((i) => i.c === "R").map((i) => ({ id: i.id, t: i.keep ?? i.t, q: i.q, group: `Stage ${st.n}` }))),
];
const GROUPS = [...new Set(PIECES.map((p) => p.group))];
const SYMBOLS = ["°", "ø", "⁷", "⁶", "⁵", "⁴", "₅", "₄", "₃", "₂", "♯", "♭", "/", "–", "→"];

export function Analysis() {
  const state = useAppState();
  const [id, setId] = usePref<string>("pianoPath.anPiece", () => "s1r0", (v) => PIECES.some((p) => p.id === v));
  const piece = PIECES.find((p) => p.id === id)!;
  const rows = state.analysis[id] ?? [];
  const [focus, setFocus] = useState<number | null>(null);
  const [undo, setUndo] = useState<{ row: AnalysisRow; at: number; piece: string } | null>(null);
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 8000);
    return () => clearTimeout(t);
  }, [undo]);

  const done = Object.keys(state.analysis).filter((k) => state.analysis[k].length);
  return (
    <>
      <section className="card">
        <label className="field">
          <span>Piece</span>
          <select value={id} onChange={(e) => { setId(e.target.value); setFocus(null); }}>
            {GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {PIECES.filter((p) => p.group === g).map((p) => (
                  <option key={p.id} value={p.id}>{p.t}{done.includes(p.id) ? " ✓" : ""}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {piece.q && <a className="link" href={imslp(piece.q)} target="_blank" rel="noopener">Score on IMSLP <IconExternal /></a>}
        <p className="muted small">
          Go through the score a section at a time: the bars, the key you&apos;re in, and a numeral for each chord.
          Mark modulations by starting a new section in the new key.
        </p>
      </section>

      {rows.map((r, i) => (
        <RowEditor key={r.id} piece={id} row={r} focused={focus === r.id} onFocus={() => setFocus(r.id)}
          onDelete={() => { deleteAnalysisRow(id, r.id); setUndo({ row: r, at: i, piece: id }); }} />
      ))}

      <button type="button" className="btn primary add-row" onClick={() => setFocus(addAnalysisRow(id))}>
        <IconPlus width={18} height={18} /> {rows.length ? "Add a section" : "Start the analysis"}
      </button>

      {undo && (
        <div className="toast" role="status">
          <span>Section deleted</span>
          <button type="button" className="btn ghost" onClick={() => { restoreAnalysisRow(undo.piece, undo.row, undo.at); setUndo(null); }}>Undo</button>
        </div>
      )}
    </>
  );
}

/** A text field that keeps its own value while typing and saves on blur (or Enter for single lines). */
function useField(saved: string, save: (v: string) => void) {
  const [v, setV] = useState(saved);
  useEffect(() => { setV(saved); }, [saved]);
  return [{ value: v, onChange: (e: { target: { value: string } }) => setV(e.target.value), onBlur: () => { if (v !== saved) save(v); } }, setV] as const;
}

function RowEditor({ piece, row, focused, onFocus, onDelete }: {
  piece: string; row: AnalysisRow; focused: boolean; onFocus: () => void; onDelete: () => void;
}) {
  const save = (k: keyof Omit<AnalysisRow, "id">) => (v: string) => setAnalysisRow(piece, row.id, { [k]: v.trim() });
  const [bars] = useField(row.bars, save("bars"));
  const [key] = useField(row.key, save("key"));
  const [harm, setHarm] = useField(row.harm, save("harm"));
  const [note] = useField(row.note, save("note"));
  const harmRef = useRef<HTMLTextAreaElement>(null);
  const enter = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") e.currentTarget.blur(); };

  // insert a symbol at the caret, save, and put the caret after it
  const insert = (sym: string) => {
    const el = harmRef.current!;
    const a = el.selectionStart ?? harm.value.length, b = el.selectionEnd ?? a;
    const next = harm.value.slice(0, a) + sym + harm.value.slice(b);
    setHarm(next);
    setAnalysisRow(piece, row.id, { harm: next });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + sym.length, a + sym.length); });
  };

  return (
    <section className="card an-row">
      <div className="an-top">
        <label className="field bars-field"><span>Bars</span>
          <input type="text" inputMode="text" autoComplete="off" placeholder="1–8" {...bars} onKeyDown={enter} /></label>
        <label className="field key-field"><span>Key</span>
          <input type="text" autoComplete="off" placeholder="B minor" {...key} onKeyDown={enter} /></label>
        <button type="button" className="icon-btn subtle" aria-label={`Delete bars ${row.bars}`} onClick={onDelete}><IconTrash /></button>
      </div>
      <label className="field"><span>Harmony</span>
        <textarea ref={harmRef} rows={2} className="harm" autoComplete="off" spellCheck={false} placeholder="i – iv⁶ – V⁷ – i"
          value={harm.value} onChange={harm.onChange} onBlur={harm.onBlur} onFocus={onFocus} /></label>
      {focused && (
        <div className="keypad" role="group" aria-label="Insert a symbol">
          {SYMBOLS.map((s) => (
            <button key={s} type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => insert(s)}>{s}</button>
          ))}
        </div>
      )}
      <label className="field"><span>Note</span>
        <textarea rows={2} placeholder="e.g. pivot chord: iv in B minor = ii in A major" {...note} /></label>
    </section>
  );
}

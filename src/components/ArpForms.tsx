/* The 11 Russian arpeggio forms for one key: chord, notes, and your fingering. */
import { useEffect, useState } from "react";
import { DEFAULT_FINGERINGS, FORMS, chordLongName, chordName, enharmonic, formNotes, noteAbove } from "../lib/arpeggios";
import { Seg } from "./ui";
import { useAppState } from "../state/store";
import { setFingering } from "../state/actions";

function FingeringInput({ value, onCommit, label }: { value: string; onCommit: (v: string) => void; label: string }) {
  const [v, setV] = useState(value);
  useEffect(() => { setV(value); }, [value]);
  return (
    <input
      className="fingering" type="text" inputMode="text" autoComplete="off" spellCheck={false}
      placeholder="Fingering  RH : LH" aria-label={label} value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (v.trim() !== value) onCommit(v); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
    />
  );
}

function Note({ n }: { n: string }) {
  const e = enharmonic(n);
  return <span className="note">{n}{e && <small> ={e}</small>}</span>;
}

type View = "List" | "Details";
const VIEW_KEY = "pianoPath.arpView";

export function ArpForms({ k }: { k: string }) {
  const [view, setViewState] = useState<View>(() => (localStorage.getItem(VIEW_KEY) === "Details" ? "Details" : "List"));
  const setView = (v: View) => { setViewState(v); localStorage.setItem(VIEW_KEY, v); };
  return (
    <div className="arp-forms">
      <Seg label="Forms view" options={["List", "Details"] as View[]} value={view} onChange={setView} />
      {view === "List" ? <QuickList k={k} /> : <Detailed k={k} />}
    </div>
  );
}

/** One line per form: "3. F Major: A – C – F" */
function QuickList({ k }: { k: string }) {
  return (
    <ol className="quick-forms">
      {FORMS.map((f) => {
        const rootEnh = enharmonic(noteAbove(k, f.root));
        return (
          <li key={f.n}>
            <span className="qf-n">{f.n}.</span>
            <span className="qf-name">
              {chordLongName(k, f)}
              {rootEnh && <small> (={rootEnh})</small>}
            </span>
            <span className="qf-notes">{formNotes(k, f).join(" – ")}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Detailed({ k }: { k: string }) {
  const state = useAppState();
  return (
    <ol className="forms">
      {FORMS.map((f) => {
        const id = `${k}:${f.n}`;
        const root = noteAbove(k, f.root);
        const rootEnh = enharmonic(root);
        return (
          <li key={f.n} className="form">
            <span className="form-n">{f.n}</span>
            <div className="form-main">
              <div className="form-head">
                <b className="form-chord">{chordName(k, f)}</b>
                {rootEnh && <span className="enh">= {rootEnh}{f.suffix}</span>}
                <span className="form-label">{f.label}</span>
              </div>
              <div className="notes">
                {formNotes(k, f).map((n, i) => <Note key={i} n={n} />)}
              </div>
              <FingeringInput
                value={state.fingerings[id] ?? DEFAULT_FINGERINGS[id] ?? ""}
                label={`Fingering for form ${f.n}, ${chordName(k, f)}`}
                onCommit={(v) => setFingering(k, f.n, v)}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

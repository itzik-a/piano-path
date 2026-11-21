/* The 11 Russian arpeggio forms for one key, in two tabs: Forms (one line per form, to see the progression)
   and Fingering (one octave of notes with RH / LH fingering under them). */
import { DEFAULT_FINGERINGS, FORMS, arpFingering, chordLongName, enharmonic, formNotes, noteAbove, type ArpForm } from "../lib/arpeggios";
import { useAppState } from "../state/store";
import { Fingering } from "./Fingering";
import { Seg } from "./ui";
import { usePref } from "../lib/prefs";

type Tab = "Forms" | "Fingering";

export function ArpForms({ k }: { k: string }) {
  const [tab, setTab] = usePref<Tab>("pianoPath.arpTab", () => "Forms", (v) => v === "Forms" || v === "Fingering");
  return (
    <div className="arp-forms">
      <Seg label="Show" options={["Forms", "Fingering"] as Tab[]} value={tab} onChange={setTab} />
      {tab === "Forms" ? <FormList k={k} /> : <FingeringList k={k} />}
    </div>
  );
}

function Name({ k, f }: { k: string; f: ArpForm }) {
  const rootEnh = enharmonic(noteAbove(k, f.root));
  return (
    <span className="qf-name">
      {chordLongName(k, f)}
      {rootEnh && <small> (={rootEnh})</small>}
    </span>
  );
}

/** One line per form: "2. F♯ Minor   F♯ A C♯ F♯" */
function FormList({ k }: { k: string }) {
  return (
    <ol className="quick-forms">
      {FORMS.map((f) => {
        const notes = formNotes(k, f);
        return (
          <li key={f.n}>
            <span className="qf-n">{f.n}.</span>
            <Name k={k} f={f} />
            <span className="qf-notes">{[...notes, notes[0]].join(" ")}</span>
          </li>
        );
      })}
    </ol>
  );
}

function FingeringList({ k }: { k: string }) {
  const state = useAppState();
  return (
    <ol className="quick-forms arp-list">
      {FORMS.map((f) => {
        const id = `${k}:${f.n}`;
        const { notes, rh, lh } = arpFingering(k, f, state.fingerings[id] || DEFAULT_FINGERINGS[id]);
        return (
          <li key={f.n}>
            <span className="qf-n">{f.n}.</span>
            <Name k={k} f={f} />
            <Fingering notes={notes} rh={rh} lh={lh} />
          </li>
        );
      })}
    </ol>
  );
}

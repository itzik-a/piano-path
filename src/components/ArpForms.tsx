/* The 11 Russian arpeggio forms for one key: chord name, then one octave of notes with RH / LH fingering. */
import { DEFAULT_FINGERINGS, FORMS, arpFingering, chordLongName, enharmonic, noteAbove } from "../lib/arpeggios";
import { useAppState } from "../state/store";
import { Fingering } from "./Fingering";

export function ArpForms({ k }: { k: string }) {
  const state = useAppState();
  return (
    <ol className="quick-forms arp-list">
      {FORMS.map((f) => {
        const id = `${k}:${f.n}`;
        const rootEnh = enharmonic(noteAbove(k, f.root));
        const { notes, rh, lh } = arpFingering(k, f, state.fingerings[id] || DEFAULT_FINGERINGS[id]);
        return (
          <li key={f.n}>
            <span className="qf-n">{f.n}.</span>
            <span className="qf-name">
              {chordLongName(k, f)}
              {rootEnh && <small> (={rootEnh})</small>}
            </span>
            <Fingering notes={notes} rh={rh} lh={lh} />
          </li>
        );
      })}
    </ol>
  );
}

/* The chord quiz from Technique's chord section, moved here: a key's seven chords shuffled on the staff. */
import { KEYS, pretty } from "../data/curriculum";
import { ChordView } from "../components/ChordView";
import { KeyPicker } from "./common";
import { usePref } from "../lib/prefs";

export function ChordsInKey() {
  const [k, setK] = usePref<string>("pianoPath.studyChordKey", () => "C", (v) => KEYS.some((o) => o.k === v));
  const info = KEYS.find((o) => o.k === k)!;
  return (
    <section className="card">
      <h2>{pretty(k)} major / {info.m} minor</h2>
      <KeyPicker value={k} onChange={setK} label="Choose a key" />
      <p className="muted small">Each chord gets its own bar, so accidentals the key signature doesn&apos;t cover are always printed.</p>
      <ChordView k={k} quiz />
    </section>
  );
}

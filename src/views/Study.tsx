/* Study: reading and harmony drills, opened when you want them (no Today block, nothing logged).
   "#study" lists the drills; "#study/<id>" opens one. */
import type { ReactNode } from "react";
import { IconBack } from "../components/Icons";
import { KeySigDrill } from "../study/KeySigs";
import { ChordsInKey } from "../study/ChordsInKey";
import { ChordCards } from "../study/ChordCards";
import { Reading } from "../study/Reading";
import { CadenceDrill, Dim7Drill, SecondaryDrill } from "../study/Harmony";
import { useAppState } from "../state/store";
import { todayCount, weakItems } from "../lib/study";

interface Drill { id: string; title: string; d: string; group: string; view: () => ReactNode }

export const DRILLS: Drill[] = [
  { id: "keys", group: "Reading", title: "Key signatures", d: "Name the key from its signature, or find the signature for a key. Aim for under two seconds.", view: () => <KeySigDrill /> },
  { id: "reading", group: "Reading", title: "Reading passages", d: "A new 8-bar piece for two hands in any key, at four levels. Read it through, then name the chord in each bar.", view: () => <Reading /> },
  { id: "cards", group: "Harmony", title: "Chord flashcards", d: "One chord at a time in any inversion, in one clef or both hands. Name it with its figures (V⁶₅, ii⁶).", view: () => <ChordCards /> },
  { id: "chords", group: "Harmony", title: "Chords in a key", d: "The seven chords of a key on the staff, shuffled. Name each one, then tap to check.", view: () => <ChordsInKey /> },
  { id: "dim7", group: "Harmony", title: "Diminished 7ths", d: "The three diminished 7ths, their spellings, and where each one resolves.", view: () => <Dim7Drill /> },
  { id: "sec", group: "Harmony", title: "Secondary dominants", d: "V⁷/x and vii°⁷/x: a chord borrowed to point at another one. Name it and its target.", view: () => <SecondaryDrill /> },
  { id: "cad", group: "Harmony", title: "Cadence types", d: "Authentic, plagal, half or deceptive: name how the phrase ends.", view: () => <CadenceDrill /> },
];

/** "12 today · 3 to review", for drills that keep results */
function TileStats({ id }: { id: string }) {
  const s = useAppState();
  const [n] = todayCount(s, id), weak = weakItems(s, id).length;
  if (!n && !weak) return null;
  return <p className="tile-stats">{[n && `${n} today`, weak && `${weak} to review`].filter(Boolean).join(" · ")}</p>;
}

export function Study({ sub }: { sub: string }) {
  const drill = DRILLS.find((d) => d.id === sub);
  if (drill) {
    return (
      <>
        <header className="page-head">
          <a className="back" href="#study"><IconBack /> Study</a>
          <h1 className="display">{drill.title}</h1>
        </header>
        {drill.view()}
      </>
    );
  }
  const groups = [...new Set(DRILLS.map((d) => d.group))];
  return (
    <>
      <header className="page-head">
        <h1 className="display">Study</h1>
        <p className="muted">Reading and harmony drills, for when you want them. Nothing here goes into Today or the Log.</p>
      </header>
      {groups.map((g) => (
        <section key={g} className="study-group">
          <h2 className="eyebrow">{g}</h2>
          <div className="tiles">
            {DRILLS.filter((d) => d.group === g).map((d) => (
              <a key={d.id} className="card tile" href={`#study/${d.id}`}>
                <h3>{d.title}</h3>
                <p className="muted small">{d.d}</p>
                <TileStats id={d.id} />
              </a>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

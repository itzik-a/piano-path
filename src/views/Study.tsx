/* Study: reading and harmony drills, opened when you want them (no Today block, nothing logged).
   "#study" lists the drills; "#study/<id>" opens one. */
import type { ReactNode } from "react";
import { IconBack } from "../components/Icons";
import { KeySigDrill } from "../study/KeySigs";
import { ChordsInKey } from "../study/ChordsInKey";

interface Drill { id: string; title: string; d: string; group: string; view: () => ReactNode }

export const DRILLS: Drill[] = [
  { id: "keys", group: "Reading", title: "Key signatures", d: "Name the key from its signature, or find the signature for a key. Aim for under two seconds.", view: () => <KeySigDrill /> },
  { id: "chords", group: "Harmony", title: "Chords in a key", d: "The seven chords of a key on the staff, shuffled. Name each one, then tap to check.", view: () => <ChordsInKey /> },
];

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
              </a>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

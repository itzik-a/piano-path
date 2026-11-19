/* Notes with the right- and left-hand finger under each one; thumbs are highlighted to show the crossings.
   Used for scales and arpeggio forms (one octave, ascending). */
import { enharmonic } from "../lib/arpeggios";

export function Fingering({ notes, rh, lh }: { notes: string[]; rh: string[]; lh: string[] }) {
  const said = notes.map((x, i) => `${x} RH ${rh[i]} LH ${lh[i]}`).join(", ");
  const row = (h: string, fs: string[]) => [
    <span key={h} className="sf-h">{h}</span>,
    ...fs.map((d, i) => <span key={h + i} className={d === "1" ? "sf-f thumb" : "sf-f"}>{d}</span>),
  ];
  return (
    <div className="sf" role="img" aria-label={said} style={{ gridTemplateColumns: `1.9em repeat(${notes.length}, minmax(1.55em, 2.4em))` }}>
      <span className="sf-h" />
      {notes.map((x, i) => {
        const e = enharmonic(x);
        return <span key={i} className="sf-n">{x}{e && <small>={e}</small>}</span>;
      })}
      {row("RH", rh)}
      {row("LH", lh)}
    </div>
  );
}

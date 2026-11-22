/* Chords for one key (major and its relative minor): diatonic triads and 7ths in every inversion,
   and two cadences voiced from each starting position. Pass `only` to show just the major or the minor (Today's rotation). */
import { KEYS, pretty } from "../data/curriculum";
import { enharmonic } from "../lib/arpeggios";
import { INVERSIONS, SEVENTH_FINGERS, TRIAD_FINGERS, cadences, diatonicChords, invert, type ChordMode } from "../lib/chords";
import { Seg } from "./ui";
import { Staff } from "./Staff";
import { usePref } from "../lib/prefs";
import { cadenceOnStaff, chordsOnStaff, keySignature, type Clef } from "../lib/notation";

type Kind = "Triads" | "7ths" | "Cadences";
const KINDS: Kind[] = ["Triads", "7ths", "Cadences"];
type Notation = "letters" | "staff";
const NOTATIONS: Notation[] = ["letters", "staff"];
const CLEFS: Clef[] = ["treble", "bass"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function Note({ n, finger }: { n: string; finger?: string }) {
  const e = enharmonic(n);
  return (
    <span className="cg-n">
      {n}{finger && <sup>{finger}</sup>}
      {e && <small>={e}</small>}
    </span>
  );
}

/** Lets a long numeral or name ("IVmaj7", "C♯m(maj7)") wrap before its quality suffix when the column is narrow. */
function Wrap({ s }: { s: string }) {
  const i = s.slice(1).search(/maj|\(|\+|ø|°/) + 1;
  return i > 0 ? <>{s.slice(0, i)}<wbr />{s.slice(i)}</> : <>{s}</>;
}

export function ChordView({ k, only }: { k: string; only?: ChordMode }) {
  const info = KEYS.find((o) => o.k === k)!;
  const [picked, setMode] = usePref<ChordMode>("pianoPath.chordMode", () => "major", (v) => v === "major" || v === "minor");
  const mode = only ?? picked;
  const [kind, setKind] = usePref<Kind>("pianoPath.chordView", () => "Triads", (v) => KINDS.includes(v as Kind));
  // Each chord type keeps its own inversion / starting position
  const [posBy, setPosBy] = usePref<Partial<Record<Kind, number>>>("pianoPath.chordPos", () => ({}), (v) => !!v && typeof v === "object");
  const positions = kind === "7ths" ? [0, 1, 2, 3] : [0, 1, 2];
  const pos = positions.includes(posBy[kind] ?? 0) ? posBy[kind] ?? 0 : 0;
  const setPos = (i: number) => setPosBy({ ...posBy, [kind]: i });
  const modeName = (m: ChordMode) => (m === "major" ? `${pretty(k)} major` : `${info.m} minor`);
  const [notation, setNotation] = usePref<Notation>("pianoPath.chordNotation", () => "letters", (v) => NOTATIONS.includes(v as Notation));
  const [clef, setClef] = usePref<Clef>("pianoPath.chordClef", () => "treble", (v) => CLEFS.includes(v as Clef));
  const staff = notation === "staff";

  return (
    <div className="chords">
      <div className="chord-controls">
        {!only && <Seg label="Key" options={["major", "minor"] as ChordMode[]} value={mode} onChange={setMode} format={modeName} />}
        <Seg label="Chord type" options={KINDS} value={kind} onChange={setKind} />
        <Seg
          label={kind === "Cadences" ? "Starting position" : "Inversion"} options={positions} value={pos} onChange={setPos}
          format={(i) => INVERSIONS[i]}
        />
        <Seg label="Notation" options={NOTATIONS} value={notation} onChange={setNotation} format={cap} />
        {staff && kind !== "Cadences" && <Seg label="Clef" options={CLEFS} value={clef} onChange={setClef} format={cap} />}
      </div>
      {kind === "Cadences"
        ? <Cadences k={k} mode={mode} start={pos} staff={staff} />
        : <Grid k={k} mode={mode} sevenths={kind === "7ths"} inv={pos} clef={staff ? clef : undefined} />}
    </div>
  );
}

/** The seven chords of the key in one inversion: numeral, name, then the notes with the top note on top. */
function Grid({ k, mode, sevenths, inv, clef }: { k: string; mode: ChordMode; sevenths: boolean; inv: number; clef?: Clef }) {
  const chords = diatonicChords(k, mode, sevenths);
  const f = (sevenths ? SEVENTH_FINGERS : TRIAD_FINGERS)[inv];
  const voices = chords[0].notes.length;
  if (clef) {
    const sig = keySignature(k);
    const placed = chordsOnStaff(chords, inv, sig, clef);
    return (
      <>
        <Staff
          clefs={[clef]} sig={sig}
          columns={chords.map((c, i) => ({ above: c.name, below: c.numeral, notes: placed[i] }))}
          label={`${sevenths ? "Seventh chords" : "Triads"}, ${INVERSIONS[inv].toLowerCase()} position, on the ${clef} staff`}
        />
        <p className="cg-fingers">Fingering, bottom note first: <span className="nowrap">{clef === "treble" ? "RH" : "LH"} <b>{clef === "treble" ? f.rh : f.lh}</b></span></p>
      </>
    );
  }
  return (
    <>
      <div className="cg" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
        {chords.map((c) => <span key={"r" + c.degree} className="cg-roman"><Wrap s={c.numeral} /></span>)}
        {chords.map((c) => <span key={"c" + c.degree} className="cg-name"><Wrap s={c.name} /></span>)}
        {Array.from({ length: voices }, (_, v) => voices - 1 - v).flatMap((v) =>
          chords.map((c) => <Note key={`${v}-${c.degree}`} n={invert(c.notes, inv)[v]} />),
        )}
      </div>
      <p className="cg-fingers">Fingering, bottom note first: <span className="nowrap">RH <b>{f.rh}</b> · LH <b>{f.lh}</b></span></p>
    </>
  );
}

/** Each cadence as columns: right-hand chord (fingers as small numbers) over the left-hand bass. */
function Cadences({ k, mode, start, staff }: { k: string; mode: ChordMode; start: number; staff: boolean }) {
  const sig = keySignature(k);
  const tonic = diatonicChords(k, mode)[0].notes[0];
  return (
    <div className="cadences">
      {cadences(k, mode, start).map((cad) => (
        <div key={cad.name} className="cadence">
          <h4>{cad.name}</h4>
          {staff ? (
            <Staff
              clefs={["treble", "bass"]} sig={sig}
              columns={cadenceOnStaff(cad.steps, tonic, sig).map((notes, i) => ({ below: cad.steps[i].numeral, notes }))}
              label={`${cad.name}, right hand over the bass on a grand staff`}
            />
          ) : <div className="cg" style={{ gridTemplateColumns: `2em repeat(${cad.steps.length}, minmax(0, 1fr))` }}>
            <span />
            {cad.steps.map((s, i) => <span key={"r" + i} className="cg-roman"><Wrap s={s.numeral} /></span>)}
            {[2, 1, 0].flatMap((v) => [
              <span key={"h" + v} className="cg-h">{v === 2 ? "RH" : ""}</span>,
              ...cad.steps.map((s, i) => (
                <Note key={`${v}-${i}`} n={s.rh[v]} finger={TRIAD_FINGERS[s.inv].rh.split(" ")[v]} />
              )),
            ])}
            <span className="cg-h">LH</span>
            {cad.steps.map((s, i) => <Note key={"b" + i} n={s.bass} />)}
          </div>}
        </div>
      ))}
      <p className="cg-fingers">{staff ? "" : "Small numbers are right-hand fingers. "}Keep common notes held and move the others to the nearest chord tone.</p>
    </div>
  );
}

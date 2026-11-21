/* Chords for one key (major and its relative minor): diatonic triads and 7ths in every inversion,
   and two cadences voiced from each starting position. Pass `only` to show just the major or the minor (Today's rotation). */
import { useState } from "react";
import { KEYS, pretty } from "../data/curriculum";
import { enharmonic } from "../lib/arpeggios";
import { INVERSIONS, SEVENTH_FINGERS, TRIAD_FINGERS, cadences, diatonicChords, invert, type ChordMode } from "../lib/chords";
import { Seg } from "./ui";

type Kind = "Triads" | "7ths" | "Cadences";
const KIND_KEY = "pianoPath.chordView";

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
  const [picked, setMode] = useState<ChordMode>("major");
  const mode = only ?? picked;
  const [kind, setKindState] = useState<Kind>(() => (localStorage.getItem(KIND_KEY) as Kind) || "Triads");
  const [pos, setPos] = useState(0);
  const setKind = (v: Kind) => { setKindState(v); localStorage.setItem(KIND_KEY, v); if (v !== "7ths" && pos > 2) setPos(0); };
  const positions = kind === "7ths" ? [0, 1, 2, 3] : [0, 1, 2];
  const modeName = (m: ChordMode) => (m === "major" ? `${pretty(k)} major` : `${info.m} minor`);

  return (
    <div className="chords">
      <div className="chord-controls">
        {!only && <Seg label="Key" options={["major", "minor"] as ChordMode[]} value={mode} onChange={setMode} format={modeName} />}
        <Seg label="Chord type" options={["Triads", "7ths", "Cadences"] as Kind[]} value={kind} onChange={setKind} />
        <Seg
          label={kind === "Cadences" ? "Starting position" : "Inversion"} options={positions} value={pos} onChange={setPos}
          format={(i) => INVERSIONS[i]}
        />
      </div>
      {kind === "Cadences" ? <Cadences k={k} mode={mode} start={pos} /> : <Grid k={k} mode={mode} sevenths={kind === "7ths"} inv={pos} />}
    </div>
  );
}

/** The seven chords of the key in one inversion: numeral, name, then the notes with the top note on top. */
function Grid({ k, mode, sevenths, inv }: { k: string; mode: ChordMode; sevenths: boolean; inv: number }) {
  const chords = diatonicChords(k, mode, sevenths);
  const f = (sevenths ? SEVENTH_FINGERS : TRIAD_FINGERS)[inv];
  const voices = chords[0].notes.length;
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
function Cadences({ k, mode, start }: { k: string; mode: ChordMode; start: number }) {
  return (
    <div className="cadences">
      {cadences(k, mode, start).map((cad) => (
        <div key={cad.name} className="cadence">
          <h4>{cad.name}</h4>
          <div className="cg" style={{ gridTemplateColumns: `2em repeat(${cad.steps.length}, minmax(0, 1fr))` }}>
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
          </div>
        </div>
      ))}
      <p className="cg-fingers">Small numbers are right-hand fingers. Keep common notes held and move the others to the nearest chord tone.</p>
    </div>
  );
}

/* Chords for one key (major and its relative minor): diatonic triads and 7ths in every inversion,
   and two cadences voiced from each starting position. Pass `only` to show just the major or the minor (Today's rotation). */
import { KEYS, pretty } from "../data/curriculum";
import { enharmonic } from "../lib/arpeggios";
import { INVERSIONS, SEVENTH_FINGERS, TRIAD_FINGERS, cadences, diatonicChords, invert, type ChordMode } from "../lib/chords";
import { useState } from "react";
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

/** Quiz state for one set of chords: which are shown, and (for the chord grid) a shuffled order. */
function useQuiz(n: number, shuffled: boolean) {
  const deal = () => {
    const o = Array.from({ length: n }, (_, i) => i);
    if (!shuffled || n < 2) return o;
    do {
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
    } while (o.every((v, i) => v === i)); // never the plain rising order
    return o;
  };
  const [order, setOrder] = useState(deal);
  const [shown, setShown] = useState<Set<number>>(() => new Set());
  return {
    order, shown,
    toggle: (i: number) => setShown((s) => { const t = new Set(s); if (t.has(i)) t.delete(i); else t.add(i); return t; }),
    showAll: () => setShown(new Set(order)),
    again: () => { setOrder(deal()); setShown(new Set()); },
  };
}

function QuizBar({ quiz, n, again }: { quiz: ReturnType<typeof useQuiz>; n: number; again: string }) {
  const done = quiz.shown.size === n;
  return (
    <div className="quiz-bar">
      <span className="quiz-count">{done ? "All shown" : `Tap a chord to check it · ${quiz.shown.size} of ${n}`}</span>
      {done
        ? <button type="button" className="btn ghost" onClick={quiz.again}>{again}</button>
        : <button type="button" className="btn ghost" onClick={quiz.showAll}>Show all</button>}
    </div>
  );
}

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

/** `quiz`: Study's version, always on the staff with names hidden until tapped. */
export function ChordView({ k, only, quiz = false }: { k: string; only?: ChordMode; quiz?: boolean }) {
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
  const staff = quiz || notation === "staff";
  // a new quiz whenever what's on the staff changes
  const fresh = [k, mode, kind, pos, clef, quiz].join("|");

  return (
    <div className="chords">
      <div className="chord-controls">
        {!only && <Seg label="Key" options={["major", "minor"] as ChordMode[]} value={mode} onChange={setMode} format={modeName} />}
        <Seg label="Chord type" options={KINDS} value={kind} onChange={setKind} />
        <Seg
          label={kind === "Cadences" ? "Starting position" : "Inversion"} options={positions} value={pos} onChange={setPos}
          format={(i) => INVERSIONS[i]}
        />
        {!quiz && <Seg label="Notation" options={NOTATIONS} value={notation} onChange={setNotation} format={cap} />}
        {staff && kind !== "Cadences" && <Seg label="Clef" options={CLEFS} value={clef} onChange={setClef} format={cap} />}
      </div>
      {kind === "Cadences"
        ? <Cadences key={fresh} k={k} mode={mode} start={pos} staff={staff} quiz={quiz} />
        : <Grid key={fresh} k={k} mode={mode} sevenths={kind === "7ths"} inv={pos} clef={staff ? clef : undefined} quiz={quiz} />}
    </div>
  );
}

/** The seven chords of the key in one inversion: numeral, name, then the notes with the top note on top. */
function Grid({ k, mode, sevenths, inv, clef, quiz }: { k: string; mode: ChordMode; sevenths: boolean; inv: number; clef?: Clef; quiz: boolean }) {
  const chords = diatonicChords(k, mode, sevenths);
  const f = (sevenths ? SEVENTH_FINGERS : TRIAD_FINGERS)[inv];
  const voices = chords[0].notes.length;
  const q = useQuiz(chords.length, true);
  if (clef) {
    const sig = keySignature(k);
    const placed = chordsOnStaff(chords, inv, sig, clef);
    const order = quiz ? q.order : chords.map((_, i) => i);
    return (
      <>
        <Staff
          clefs={[clef]} sig={sig}
          columns={order.map((i) => ({ above: chords[i].name, below: chords[i].numeral, notes: placed[i], hidden: quiz && !q.shown.has(i) }))}
          onTap={quiz ? (col) => q.toggle(order[col]) : undefined}
          label={`${sevenths ? "Seventh chords" : "Triads"}, ${INVERSIONS[inv].toLowerCase()} position, on the ${clef} staff${quiz ? ", in a shuffled order" : ""}`}
        />
        {quiz && <QuizBar quiz={q} n={chords.length} again="New order" />}
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
function Cadences({ k, mode, start, staff, quiz }: { k: string; mode: ChordMode; start: number; staff: boolean; quiz: boolean }) {
  const sig = keySignature(k);
  const tonic = diatonicChords(k, mode)[0].notes[0];
  const list = cadences(k, mode, start);
  // one quiz over both cadences: chord j of cadence c is item at[c] + j
  const at = list.map((_, c) => list.slice(0, c).reduce((a, x) => a + x.steps.length, 0));
  const total = list.reduce((a, x) => a + x.steps.length, 0);
  const q = useQuiz(total, false);
  return (
    <div className="cadences">
      {list.map((cad, c) => (
        <div key={cad.name} className="cadence">
          <h4>{quiz && !cad.steps.every((_, j) => q.shown.has(at[c] + j)) ? `Cadence ${c + 1}` : cad.name}</h4>
          {staff ? (
            <Staff
              clefs={["treble", "bass"]} sig={sig}
              columns={cadenceOnStaff(cad.steps, tonic, sig).map((notes, i) => ({ below: cad.steps[i].numeral, notes, hidden: quiz && !q.shown.has(at[c] + i) }))}
              onTap={quiz ? (i) => q.toggle(at[c] + i) : undefined}
              label={quiz ? `Cadence ${c + 1}, right hand over the bass on a grand staff` : `${cad.name}, right hand over the bass on a grand staff`}
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
      {quiz && <QuizBar quiz={q} n={total} again="Hide again" />}
      <p className="cg-fingers">{staff ? "" : "Small numbers are right-hand fingers. "}Keep common notes held and move the others to the nearest chord tone.</p>
    </div>
  );
}

/* Chord flashcards: one chord at a time, any inversion, in one clef or split between the hands.
   Name it (numeral with figures), show the answer, then mark Got it or Missed.
   Missed chords come back more often (state `study.miss`, items "cards:<key>:<mode>:<3|7>:<degree>:<inversion>"). */
import { useState } from "react";
import { KEYS, pretty } from "../data/curriculum";
import { Staff } from "../components/Staff";
import { Seg } from "../components/ui";
import { usePref } from "../lib/prefs";
import { diatonicChords, figured, invert, slashName, type ChordMode } from "../lib/chords";
import { keySignature, placeChord, type Clef, type StaffNote } from "../lib/notation";
import { chooseItem, todayCount, weakItems } from "../lib/study";
import { recordAnswer } from "../state/actions";
import { getState, useAppState } from "../state/store";
import { KeyPicker, pick } from "./common";

type ModePick = ChordMode | "both";
type TypePick = "triads" | "7ths" | "both";
type Layout = Clef | "hands";
type LayoutPick = Layout | "mixed";
const MODES: ModePick[] = ["major", "minor", "both"];
const TYPES: TypePick[] = ["triads", "7ths", "both"];
const LAYOUTS: LayoutPick[] = ["treble", "bass", "hands", "mixed"];
const LAYOUT_LABEL: Record<LayoutPick, string> = { treble: "Treble", bass: "Bass", hands: "Both hands", mixed: "Mixed" };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

interface Settings { k: string; mode: ModePick; type: TypePick; layout: LayoutPick }
interface Card { id: string; layout: Layout; rhInv: number }

const parse = (id: string) => {
  const [, k, mode, t, d, inv] = id.split(":");
  return { k, mode: mode as ChordMode, sevenths: t === "7", degree: +d, inv: +inv };
};

function freshId({ k, mode, type }: Settings) {
  const key = k || pick(KEYS).k;
  const m = mode === "both" ? pick<ChordMode>(["major", "minor"]) : mode;
  const sevenths = type === "both" ? Math.random() < 0.5 : type === "7ths";
  return `cards:${key}:${m}:${sevenths ? 7 : 3}:${Math.floor(Math.random() * 7)}:${Math.floor(Math.random() * (sevenths ? 4 : 3))}`;
}

function deal(set: Settings, last?: string): Card {
  const keep = (id: string) => {
    const c = parse(id);
    return (!set.k || c.k === set.k) && (set.mode === "both" || c.mode === set.mode)
      && (set.type === "both" || c.sevenths === (set.type === "7ths"));
  };
  const id = chooseItem(weakItems(getState(), "cards", keep), () => freshId(set), last);
  const layout = set.layout === "mixed" ? pick<Layout>(["treble", "bass", "hands"]) : set.layout;
  return { id, layout, rhInv: Math.floor(Math.random() * 3) };
}

export function ChordCards() {
  const [k, setK] = usePref<string>("pianoPath.ccKey", () => "", (v) => v === "" || KEYS.some((o) => o.k === v));
  const [mode, setMode] = usePref<ModePick>("pianoPath.ccMode", () => "both", (v) => MODES.includes(v as ModePick));
  const [type, setType] = usePref<TypePick>("pianoPath.ccType", () => "triads", (v) => TYPES.includes(v as TypePick));
  const [layout, setLayout] = usePref<LayoutPick>("pianoPath.ccLayout", () => "treble", (v) => LAYOUTS.includes(v as LayoutPick));
  const set = { k, mode, type, layout };
  return (
    <section className="card">
      <KeyPicker value={k} onChange={setK} label="Keys to draw from" any />
      <div className="chord-controls">
        <Seg label="Major or minor" options={MODES} value={mode} onChange={setMode} format={cap} />
        <Seg label="Chords" options={TYPES} value={type} onChange={setType} format={(t) => (t === "7ths" ? "7ths" : cap(t))} />
        <Seg label="Staff" options={LAYOUTS} value={layout} onChange={setLayout} format={(l) => LAYOUT_LABEL[l]} />
      </div>
      <Cards key={JSON.stringify(set)} set={set} />
    </section>
  );
}

function Cards({ set }: { set: Settings }) {
  const state = useAppState();
  const [card, setCard] = useState(() => deal(set));
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<[number, number]>([0, 0]);

  const c = parse(card.id);
  const chord = diatonicChords(c.k, c.mode, c.sevenths)[c.degree];
  const notes = invert(chord.notes, c.inv);
  const sig = keySignature(c.k);
  const info = KEYS.find((o) => o.k === c.k)!;
  const keyName = c.mode === "major" ? `${pretty(c.k)} major` : `${info.m} minor`;

  let clefs: Clef[], placed: StaffNote[];
  if (card.layout === "hands") {
    // left hand: the bass note; right hand: the whole chord in close position
    clefs = ["treble", "bass"];
    placed = [...placeChord(invert(chord.notes, card.rhInv), sig, "treble", 0), ...placeChord([notes[0]], sig, "bass", 1)];
  } else {
    clefs = [card.layout];
    placed = placeChord(notes, sig, card.layout);
  }

  const mark = (ok: boolean) => {
    recordAnswer(card.id, ok);
    setScore(([n, r]) => [n + 1, r + (ok ? 1 : 0)]);
    setCard(deal(set, card.id));
    setOpen(false);
  };
  const weak = weakItems(state, "cards").length;
  const [todayN] = todayCount(state, "cards");

  return (
    <div className="drill">
      <div className="drill-progress muted small">
        {score[0] ? `${score[1]} of ${score[0]} right` : "Name the chord, then check"}
        {weak > 0 && ` · ${weak} to review`}
        {todayN > score[0] && ` · ${todayN} today`}
      </div>
      <p className="drill-key">in <b>{keyName}</b></p>
      <Staff clefs={clefs} sig={sig} columns={[{ notes: placed }]} label={`A chord in ${keyName}`} maxScale={1.9} center />
      <div className="drill-feedback" aria-live="polite">
        {open ? (
          <>
            <p className="drill-answer"><b>{figured(chord, c.inv)}</b> <span>{slashName(chord, c.inv)}</span></p>
            <p className="muted small">{notes.join(" ")} · {["root position", "1st inversion", "2nd inversion", "3rd inversion"][c.inv]}</p>
            <div className="mark">
              <button type="button" className="btn ghost" onClick={() => mark(false)}>Missed</button>
              <button type="button" className="btn primary" onClick={() => mark(true)}>Got it</button>
            </div>
          </>
        ) : (
          <button type="button" className="btn primary" onClick={() => setOpen(true)}>Show answer</button>
        )}
      </div>
    </div>
  );
}

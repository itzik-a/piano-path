/* Harmony drills on the grand staff: diminished 7ths and where they resolve, secondary dominants,
   and cadence types. Right hand voiced with nearest voice leading (`voice()`), bass in the left hand. */
import { useEffect, useState, type ReactNode } from "react";
import { KEYS, pretty } from "../data/curriculum";
import { Staff, type StaffColumn } from "../components/Staff";
import { Seg } from "../components/ui";
import { usePref } from "../lib/prefs";
import { diatonicChords, invert, pc, secondaryDim7, secondaryDominant, voice, type Chord, type ChordMode } from "../lib/chords";
import { cadenceOnStaff, keySignature } from "../lib/notation";
import { chooseItem, weakItems } from "../lib/study";
import { recordAnswer } from "../state/actions";
import { getState, useAppState } from "../state/store";
import { KeyPicker, pick } from "./common";

type ModePick = ChordMode | "both";
const MODES: ModePick[] = ["major", "minor", "both"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const keyName = (k: string, mode: ChordMode) => (mode === "major" ? `${pretty(k)} major` : `${KEYS.find((o) => o.k === k)!.m} minor`);
const SEVENTH_FIG = ["⁷", "⁶₅", "⁴₃", "⁴₂"];
const withFig = (numeral: string, inv: number) => numeral.replace("7", SEVENTH_FIG[inv]);
const slash = (c: Chord, inv: number) => (inv ? `${c.name}/${invert(c.notes, inv)[0]}` : c.name);
const randMode = (m: ModePick): ChordMode => (m === "both" ? pick<ChordMode>(["major", "minor"]) : m);

/** Show answer, then Got it / Missed. */
function Reveal({ open, onOpen, onMark, children }: { open: boolean; onOpen: () => void; onMark: (ok: boolean) => void; children: ReactNode }) {
  return (
    <div className="drill-feedback" aria-live="polite">
      {open ? (
        <>
          {children}
          <div className="mark">
            <button type="button" className="btn ghost" onClick={() => onMark(false)}>Missed</button>
            <button type="button" className="btn primary" onClick={() => onMark(true)}>Got it</button>
          </div>
        </>
      ) : <button type="button" className="btn primary" onClick={onOpen}>Show answer</button>}
    </div>
  );
}

function Progress({ drill, score, hint }: { drill: string; score: [number, number]; hint: string }) {
  const weak = weakItems(useAppState(), drill).length;
  return (
    <div className="drill-progress muted small">
      {score[0] ? `${score[1]} of ${score[0]} right` : hint}{weak > 0 && ` · ${weak} to review`}
    </div>
  );
}

/* ---------- Diminished 7ths ---------- */

/** vii°7 of each minor key and its resolution, grouped by the three pitch sets. */
function dim7Groups() {
  const groups = new Map<string, { k: string; c: Chord }[]>();
  for (const o of KEYS) {
    const c = secondaryDim7(o.k, "minor", 0);
    const pcs = c.notes.map(pc).sort((a, b) => a - b).join(",");
    groups.set(pcs, [...(groups.get(pcs) ?? []), { k: o.k, c }]);
  }
  return [...groups.values()];
}

/** Resolution bass for each inversion: leading note → 1, 2 → 3, 4 → 3, ♭6 → 5. */
const DIM7_RES = [{ fig: "", tone: 0 }, { fig: "⁶", tone: 1 }, { fig: "⁶", tone: 1 }, { fig: "⁶₄", tone: 2 }];

export function Dim7Drill() {
  const [sigMode, setSigMode] = usePref<"none" | "key">("pianoPath.d7Sig", () => "none", (v) => v === "none" || v === "key");
  return (
    <>
      <section className="card">
        <h2>The three diminished 7ths</h2>
        <p className="muted small">
          Every diminished 7th is one of three sets of notes. Each set has four spellings, and the spelling tells you the key:
          the root is the leading note, so it resolves up a semitone to that minor tonic (or its major).
        </p>
        <div className="dim7-groups">
          {dim7Groups().map((g, i) => (
            <div key={i} className="dim7-group">
              {g.map(({ k, c }) => (
                <p key={k}><b>{c.name}</b> <span className="muted">{c.notes.join(" ")}</span> → {keyName(k, "minor")}</p>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>Where does it resolve?</h2>
        <div className="chord-controls">
          <Seg label="Key signature" options={["none", "key"] as const} value={sigMode} onChange={setSigMode} format={(v) => (v === "none" ? "No key signature" : "Key signature")} />
        </div>
        <Dim7Cards key={sigMode} withSig={sigMode === "key"} />
      </section>
    </>
  );
}

const dim7Fresh = () => `dim7:${pick(KEYS).k}:${Math.floor(Math.random() * 4)}`;
const dealDim7 = (last?: string) => ({ id: chooseItem(weakItems(getState(), "dim7"), dim7Fresh, last), start: Math.floor(Math.random() * 3) });

function Dim7Cards({ withSig }: { withSig: boolean }) {
  const [{ id, start }, setCard] = useState(() => dealDim7());
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [, k, invS] = id.split(":");
  const inv = +invS;
  const d7 = secondaryDim7(k, "minor", 0);
  const i = diatonicChords(k, "minor")[0];
  const res = DIM7_RES[inv];
  const steps = voice([
    { numeral: withFig("vii°7", inv), notes: d7.notes, bass: invert(d7.notes, inv)[0] },
    { numeral: "i" + res.fig, notes: i.notes, bass: i.notes[res.tone] },
  ], start);
  const sig = keySignature(withSig ? k : "C");
  const placed = cadenceOnStaff(steps, i.notes[0], sig);
  const cols: StaffColumn[] = open
    ? placed.map((notes, j) => ({ notes, below: steps[j].numeral, above: j ? i.name : slash(d7, inv) }))
    : [{ notes: placed[0] }];
  const mark = (ok: boolean) => {
    recordAnswer(id, ok);
    setScore(([n, r]) => [n + 1, r + (ok ? 1 : 0)]);
    setCard(dealDim7(id));
    setOpen(false);
  };
  return (
    <div className="drill">
      <Progress drill="dim7" score={score} hint="Name the chord and where it resolves" />
      <Staff clefs={["treble", "bass"]} sig={sig} columns={cols} label="A diminished 7th chord" maxScale={1.6} center />
      <Reveal open={open} onOpen={() => setOpen(true)} onMark={mark}>
        <p className="drill-answer"><b>{d7.name}</b> <span>→ {keyName(k, "minor")}</span></p>
        <p className="muted small">{withFig("vii°7", inv)} → i{res.fig} · {invert(d7.notes, inv).join(" ")}</p>
      </Reveal>
    </div>
  );
}

/* ---------- Secondary dominants ---------- */

type SecKind = "V" | "D";
const TARGETS: Record<ChordMode, number[]> = { major: [1, 2, 3, 4, 5], minor: [2, 3, 4, 5] };

export function SecondaryDrill() {
  const [k, setK] = usePref<string>("pianoPath.sdKey", () => "", (v) => v === "" || KEYS.some((o) => o.k === v));
  const [mode, setMode] = usePref<ModePick>("pianoPath.sdMode", () => "major", (v) => MODES.includes(v as ModePick));
  const [kind, setKind] = usePref<SecKind | "both">("pianoPath.sdKind", () => "V", (v) => v === "V" || v === "D" || v === "both");
  return (
    <section className="card">
      <KeyPicker value={k} onChange={setK} label="Keys to draw from" any />
      <div className="chord-controls">
        <Seg label="Major or minor" options={MODES} value={mode} onChange={setMode} format={cap} />
        <Seg label="Chord" options={["V", "D", "both"] as const} value={kind} onChange={setKind} format={(v) => (v === "V" ? "V⁷/x" : v === "D" ? "vii°⁷/x" : "Both")} />
      </div>
      <p className="muted small">The tonic, then a chord borrowed from another key, then the chord it points to. Name the last two.</p>
      <SecCards key={[k, mode, kind].join("|")} k={k} mode={mode} kind={kind} />
    </section>
  );
}

function SecCards({ k, mode, kind }: { k: string; mode: ModePick; kind: SecKind | "both" }) {
  const fresh = () => {
    const m = randMode(mode);
    const kk = kind === "both" ? pick<SecKind>(["V", "D"]) : kind;
    return `sec:${k || pick(KEYS).k}:${m}:${pick(TARGETS[m])}:${kk}:${Math.floor(Math.random() * 4)}`;
  };
  const keep = (id: string) => {
    const [, kk, m, , kd] = id.split(":");
    return (!k || kk === k) && (mode === "both" || m === mode) && (kind === "both" || kd === kind);
  };
  const [id, setId] = useState(() => chooseItem(weakItems(getState(), "sec", keep), fresh));
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const [start] = useState(() => Math.floor(Math.random() * 3));

  const [, key, m, tS, kd, invS] = id.split(":");
  const md = m as ChordMode, target = +tS, inv = +invS;
  const triads = diatonicChords(key, md);
  const sec = kd === "V" ? secondaryDominant(key, md, target) : secondaryDim7(key, md, target);
  const steps = voice([
    { numeral: triads[0].numeral, notes: triads[0].notes, bass: triads[0].notes[0] },
    { numeral: withFig(sec.numeral.split("/")[0], inv) + "/" + triads[target].numeral, notes: sec.notes, bass: invert(sec.notes, inv)[0] },
    { numeral: triads[target].numeral, notes: triads[target].notes, bass: triads[target].notes[0] },
  ], start);
  const sig = keySignature(key);
  const placed = cadenceOnStaff(steps, triads[0].notes[0], sig);
  const names = [triads[0].name, slash(sec, inv), triads[target].name];
  const cols: StaffColumn[] = placed.map((notes, j) => ({ notes, below: steps[j].numeral, above: names[j], hidden: j > 0 && !open }));
  const mark = (ok: boolean) => {
    recordAnswer(id, ok);
    setScore(([n, r]) => [n + 1, r + (ok ? 1 : 0)]);
    setId(chooseItem(weakItems(getState(), "sec", keep), fresh, id));
    setOpen(false);
  };
  return (
    <div className="drill">
      <Progress drill="sec" score={score} hint="Name the 2nd and 3rd chords" />
      <p className="drill-key">in <b>{keyName(key, md)}</b></p>
      <Staff clefs={["treble", "bass"]} sig={sig} columns={cols} label={`Three chords in ${keyName(key, md)}`} maxScale={1.5} center />
      <Reveal open={open} onOpen={() => setOpen(true)} onMark={mark}>
        <p className="drill-answer"><b>{steps[1].numeral}</b> <span>→ {steps[2].numeral}</span></p>
        <p className="muted small">{names[1]} → {names[2]}: the {kd === "V" ? "dominant 7th" : "leading-note diminished 7th"} of {names[2]}</p>
      </Reveal>
    </div>
  );
}

/* ---------- Cadence types ---------- */

type CadType = "authentic" | "plagal" | "half" | "deceptive";
const CAD_TYPES: CadType[] = ["authentic", "plagal", "half", "deceptive"];
const CAD_PROG: Record<CadType, number[][]> = {
  authentic: [[3, 4, 0], [1, 4, 0], [5, 4, 0]],
  plagal: [[0, 3, 0], [5, 3, 0]],
  half: [[0, 3, 4], [0, 1, 4], [5, 3, 4]],
  deceptive: [[3, 4, 5], [1, 4, 5], [0, 4, 5]],
};
const CAD_TEXT: Record<CadType, string> = {
  authentic: "V → I: the full stop.",
  plagal: "IV → I (iv → i in minor): the “amen”.",
  half: "Ends on V: a comma, waiting to go on.",
  deceptive: "V → vi (VI in minor): the dominant goes somewhere unexpected.",
};

export function CadenceDrill() {
  const [k, setK] = usePref<string>("pianoPath.ctKey", () => "", (v) => v === "" || KEYS.some((o) => o.k === v));
  const [mode, setMode] = usePref<ModePick>("pianoPath.ctMode", () => "both", (v) => MODES.includes(v as ModePick));
  return (
    <section className="card">
      <KeyPicker value={k} onChange={setK} label="Keys to draw from" any />
      <div className="chord-controls">
        <Seg label="Major or minor" options={MODES} value={mode} onChange={setMode} format={cap} />
      </div>
      <CadCards key={k + mode} k={k} mode={mode} />
    </section>
  );
}

function dealCadence(k: string, mode: ModePick, last?: string) {
  const type = chooseItem(weakItems(getState(), "cad"), () => `cad:${pick(CAD_TYPES)}`, last).split(":")[1] as CadType;
  const key = k || pick(KEYS).k, m = randMode(mode);
  const triads = diatonicChords(key, m), sevenths = diatonicChords(key, m, true);
  const degrees = pick(CAD_PROG[type]);
  const v7 = Math.random() < 0.5;
  const chords = degrees.map((d) => {
    const c = d === 4 && v7 && type !== "half" ? sevenths[4] : triads[d];
    return { numeral: c.numeral.replace(/7$/, "⁷"), notes: c.notes, bass: c.notes[0] };
  });
  return { type, key, m, steps: voice(chords, Math.floor(Math.random() * 3)), tonic: triads[0].notes[0] };
}

function CadCards({ k, mode }: { k: string; mode: ModePick }) {
  const [card, setCard] = useState(() => dealCadence(k, mode));
  const [wrong, setWrong] = useState<CadType[]>([]);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState<[number, number]>([0, 0]);
  const next = () => { setCard(dealCadence(k, mode, `cad:${card.type}`)); setWrong([]); setDone(false); };
  useEffect(() => {
    if (!done || wrong.length) return;
    const t = setTimeout(next, 1400);
    return () => clearTimeout(t);
  }, [done, wrong.length]);
  const answer = (t: CadType) => {
    if (done || wrong.includes(t)) return;
    if (t !== card.type) { setWrong([...wrong, t]); return; }
    const first = wrong.length === 0;
    setDone(true);
    recordAnswer(`cad:${card.type}`, first);
    setScore(([n, r]) => [n + 1, r + (first ? 1 : 0)]);
  };
  const sig = keySignature(card.key);
  const placed = cadenceOnStaff(card.steps, card.tonic, sig);
  const cols: StaffColumn[] = placed.map((notes, j) => ({ notes, below: card.steps[j].numeral, hidden: !done }));
  return (
    <div className="drill">
      <Progress drill="cad" score={score} hint="Which cadence ends this phrase?" />
      <p className="drill-key">in <b>{keyName(card.key, card.m)}</b></p>
      <Staff clefs={["treble", "bass"]} sig={sig} columns={cols} label={`A cadence in ${keyName(card.key, card.m)}`} maxScale={1.5} center />
      <div className="answers cad" role="group" aria-label="Cadence type">
        {CAD_TYPES.map((t) => (
          <button key={t} type="button" className={`answer ${done && t === card.type ? "right" : wrong.includes(t) ? "wrong" : ""}`}
            disabled={wrong.includes(t)} onClick={() => answer(t)}>{cap(t)}</button>
        ))}
      </div>
      <div className="drill-feedback" aria-live="polite">
        {done && (
          <>
            <p><b>{cap(card.type)}</b> · {CAD_TEXT[card.type]}</p>
            {wrong.length > 0 && <button type="button" className="btn primary" onClick={next}>Next</button>}
          </>
        )}
      </div>
    </div>
  );
}

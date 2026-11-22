/* Generated reading passages: 8 bars for two hands in a key, built on a real progression.
   Bars 1–4 end on V (half cadence), bars 5–8 on V–I. One chord per bar, so the passage can be analysed.
   Levels: 1 melody over held chords · 2 bass-and-chord (waltz in 3/4) · 3 Alberti / broken chords with eighths ·
   4 as 3 plus secondary dominants and chromatic notes leading up a step.
   Pitches are diatonic steps (octave × 7 + letter, so C4 = 28) with an accidental; `toAbc()` writes ABC for abcjs. */
import { KEYS } from "../data/curriculum";
import { keyScales } from "./arpeggios";
import { diatonicChords, type ChordMode } from "./chords";
import { keySignature } from "./notation";

export type Level = 1 | 2 | 3 | 4;
export type Meter = "3/4" | "4/4";

const LETTERS = "CDEFGAB";
const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];
const ACC_V: Record<string, number> = { "": 0, "♯": 1, "♭": -1, "𝄪": 2, "𝄫": -2 };
const ACC_OF: Record<number, string> = { 0: "", 1: "♯", [-1]: "♭", 2: "𝄪", [-2]: "𝄫" };

export interface P { d: number; acc: string }
/** one rhythmic event: a note or a chord (several notes), `len` in eighths */
export interface Ev { notes: P[]; len: number }

export interface BarChord {
  /** "V⁷", "ii", "V⁷/V" */
  numeral: string;
  /** "G7", "Dm", "D7" */
  name: string;
  /** root upwards, spelled */
  tones: string[];
}

export interface Passage {
  k: string; mode: ChordMode; level: Level; meter: Meter;
  keyName: string;
  chords: BarChord[];
  rh: Ev[][];
  lh: Ev[][];
}

const midi = (p: P) => (Math.floor(p.d / 7) + 1) * 12 + NATURAL_PC[((p.d % 7) + 7) % 7] + ACC_V[p.acc];
const letter = (d: number) => ((d % 7) + 7) % 7;
const pcOf = (n: string) => (NATURAL_PC[LETTERS.indexOf(n[0])] + ACC_V[n.slice(1)] + 12) % 12;

type R = () => number;
const pickR = <T,>(r: R, xs: T[]): T => xs[Math.floor(r() * xs.length)];

/** The note `steps` letters and `semis` semitones above `note`, spelled. */
function spell(note: string, steps: number, semis: number): string {
  const l = (LETTERS.indexOf(note[0]) + steps) % 7;
  let diff = (pcOf(note) + semis - NATURAL_PC[l]) % 12;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return LETTERS[l] + ACC_OF[diff];
}

/* ---------- Harmony ---------- */

/** a bar's chord: scale degree, with a 7th, or the dominant 7th of degree `sec` */
type Step = { deg: number; seventh?: boolean; sec?: number };
const S = (deg: number): Step => ({ deg });
const SEC = (sec: number): Step => ({ deg: -1, sec });

/** First phrase (ends on V) and second phrase (ends V–I), as scale degrees; the same degrees work in minor. */
const FIRST: Step[][] = [[0, 3, 0, 4], [0, 5, 3, 4], [0, 5, 1, 4], [0, 3, 1, 4], [0, 2, 3, 4], [0, 4, 0, 4]].map((p) => p.map(S));
const SECOND: Step[][] = [[0, 3, 4, 0], [0, 5, 4, 0], [5, 1, 4, 0], [0, 1, 4, 0], [3, 0, 4, 0], [5, 3, 4, 0]].map((p) => p.map(S));
/** Level 4: phrases with a secondary dominant. `major` = only in major (ii° can't be tonicised in minor). */
const FIRST_SEC: { p: Step[]; major?: boolean }[] = [
  { p: [S(0), S(3), SEC(4), S(4)] }, { p: [S(0), SEC(5), S(5), S(4)] }, { p: [S(0), SEC(3), S(3), S(4)] },
];
const SECOND_SEC: { p: Step[]; major?: boolean }[] = [
  { p: [S(0), SEC(4), S(4), S(0)] }, { p: [SEC(1), S(1), S(4), S(0)], major: true }, { p: [SEC(3), S(3), S(4), S(0)] },
];

const sup7 = (numeral: string) => numeral.replace(/7$/, "⁷");

function barChord(k: string, mode: ChordMode, st: Step): BarChord {
  if (st.sec !== undefined) {
    const target = diatonicChords(k, mode)[st.sec];
    const root = spell(target.notes[0], 4, 7);
    const tones = [root, spell(root, 2, 4), spell(root, 4, 7), spell(root, 6, 10)];
    return { numeral: `V⁷/${target.numeral}`, name: root + "7", tones };
  }
  const c = diatonicChords(k, mode, !!st.seventh)[st.deg];
  return { numeral: sup7(c.numeral), name: c.name, tones: c.notes };
}

function progression(r: R, mode: ChordMode, level: Level): Step[] {
  const fits = (x: { major?: boolean }) => !x.major || mode === "major";
  const first = level === 4 && r() < 0.5 ? pickR(r, FIRST_SEC.filter(fits)).p : pickR(r, FIRST);
  const second = level === 4 && r() < 0.6 ? pickR(r, SECOND_SEC.filter(fits)).p : pickR(r, SECOND);
  const out = [...first, ...second].map((s) => ({ ...s }));
  // the dominant before the final tonic often takes its 7th
  if (level >= 2 && out[6].deg === 4 && r() < 0.6) out[6].seventh = true;
  return out;
}

/* ---------- Melody ---------- */

/** Rhythms in eighths per level and metre. */
const RHYTHMS: Record<Meter, Record<"plain" | "eighths", number[][]>> = {
  "4/4": {
    plain: [[4, 4], [2, 2, 4], [4, 2, 2], [2, 2, 2, 2], [6, 2]],
    eighths: [[2, 1, 1, 2, 2], [1, 1, 2, 2, 2], [2, 2, 1, 1, 2], [3, 1, 2, 2], [4, 1, 1, 2], [1, 1, 1, 1, 2, 2], [2, 2, 2, 2]],
  },
  "3/4": {
    plain: [[2, 2, 2], [4, 2], [2, 4], [3, 1, 2]],
    eighths: [[1, 1, 2, 2], [2, 1, 1, 2], [1, 1, 1, 1, 2], [3, 1, 2], [4, 1, 1], [2, 2, 2]],
  },
};
const CADENCE_RHYTHM: Record<Meter, number[][]> = { "4/4": [[2, 2, 4], [4, 4]], "3/4": [[2, 4], [4, 2]] };

/** Letter → accidental for melody notes over a chord: the key's scale, with the chord's own notes on top
    (minor uses the melodic minor's raised 6th and 7th over chords that hold the leading note). */
function chordScale(k: string, mode: ChordMode, ch: BarChord): Record<number, string> {
  const sc = keyScales(k);
  const leading = mode === "minor" && ch.tones.includes(sc[2].notes[6]);
  const base = mode === "major" ? sc[0].notes : leading ? sc[3].notes : sc[1].notes;
  const map: Record<number, string> = {};
  for (const n of base.slice(0, 7)) map[LETTERS.indexOf(n[0])] = n.slice(1);
  for (const n of ch.tones) map[LETTERS.indexOf(n[0])] = n.slice(1);
  return map;
}

const toneLetters = (ch: BarChord) => ch.tones.map((n) => LETTERS.indexOf(n[0]));

/** Weighted towards small moves; no repeats of the same pitch unless nothing else fits. */
function near(r: R, cands: number[], prev: number): number {
  const w = cands.map((c) => { const a = Math.abs(c - prev); return a === 0 ? 0.25 : a > 5 ? 0.02 : 1 / a ** 1.4; });
  let x = r() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cands.length; i++) { x -= w[i]; if (x <= 0) return cands[i]; }
  return cands[cands.length - 1];
}

interface MNote { bar: number; on: number; len: number; strong: boolean; d: number }

function melody(r: R, k: string, mode: ChordMode, level: Level, meter: Meter, chords: BarChord[]): Ev[][] {
  const barLen = meter === "3/4" ? 6 : 8;
  const [lo, hi] = level === 1 ? [30, 38] : [30, 40]; // E4–F5, or up to A5
  const tonicLetter = LETTERS.indexOf(chords[7].tones[0][0]);
  const notes: MNote[] = [];
  chords.forEach((_, b) => {
    const rh = b === 7 ? [barLen] : b === 3 ? pickR(r, CADENCE_RHYTHM[meter]) : pickR(r, RHYTHMS[meter][level >= 3 ? "eighths" : "plain"]);
    let on = 0;
    rh.forEach((len, i) => {
      const last = i === rh.length - 1;
      notes.push({ bar: b, on, len, strong: on === 0 || (meter === "4/4" && on === 4) || ((b === 3 || b === 7) && last), d: 0 });
      on += len;
    });
  });

  // strong beats: chord tones, moving mostly by small steps
  const inRange = (pred: (d: number) => boolean) => Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).filter(pred);
  let prev = 34; // around B4
  notes.forEach((n, i) => {
    if (!n.strong) return;
    const ch = chords[n.bar];
    const final = i === notes.length - 1;
    const tl = toneLetters(ch);
    const cands = inRange((d) => (final ? letter(d) === tonicLetter : tl.includes(letter(d))));
    n.d = final ? cands.reduce((a, b) => (Math.abs(b - prev) < Math.abs(a - prev) ? b : a)) : near(r, cands, prev);
    prev = n.d;
  });

  // weak notes: passing runs when the gap fits, otherwise steps and neighbours, sometimes another chord tone
  for (let i = 0; i < notes.length; i++) {
    if (notes[i].strong) continue;
    const a = notes[i - 1].d;
    let j = i;
    while (j < notes.length && !notes[j].strong) j++;
    const b = j < notes.length ? notes[j].d : a;
    const n = j - i, dist = b - a, dir = Math.sign(dist);
    let cur = a;
    for (let x = 0; x < n; x++) {
      const w = notes[i + x];
      if (Math.abs(dist) === n + 1) cur = a + dir * (x + 1);
      else if (dist === 0 && n === 1) cur = a + (r() < 0.5 ? 1 : -1);
      else if (r() < 0.65) cur = cur + (Math.sign(b - cur) || (r() < 0.5 ? 1 : -1));
      else {
        const tl = toneLetters(chords[w.bar]);
        cur = near(r, inRange((d) => tl.includes(letter(d)) && d !== cur), cur);
      }
      cur = Math.max(lo, Math.min(hi, cur));
      w.d = cur;
    }
    i = j - 1;
  }

  // spell against each bar's chord; level 4 sometimes raises a note that leads up a whole step
  const spelled = notes.map((n) => ({ ...n, p: { d: n.d, acc: chordScale(k, mode, chords[n.bar])[letter(n.d)] ?? "" } as P }));
  if (level === 4) {
    spelled.forEach((n, i) => {
      const nx = spelled[i + 1];
      if (n.strong || !nx || nx.p.d - n.p.d !== 1 || midi(nx.p) - midi(n.p) !== 2 || r() > 0.4) return;
      const up = ACC_OF[ACC_V[n.p.acc] + 1];
      if (up === "" || up === "♯") n.p = { d: n.p.d, acc: up };
    });
  }
  return chords.map((_, b) => spelled.filter((n) => n.bar === b).map((n) => ({ notes: [n.p], len: n.len })));
}

/* ---------- Left hand ---------- */

/** The chord tone with `l`etter nearest to `target`, between lo and hi. */
function placeTone(tone: string, lo: number, hi: number, target: number): P {
  const l = LETTERS.indexOf(tone[0]);
  let best = -1;
  for (let d = lo; d <= hi; d++) if (letter(d) === l && (best < 0 || Math.abs(d - target) < Math.abs(best - target))) best = d;
  return { d: best, acc: tone.slice(1) };
}
/** Notes stacked upwards from `bottom`, each at the next step with its letter. */
function stackFrom(tones: string[], bottom: P): P[] {
  const out = [bottom];
  for (const t of tones.slice(1)) {
    let d = out[out.length - 1].d + 1;
    while (letter(d) !== LETTERS.indexOf(t[0])) d++;
    out.push({ d, acc: t.slice(1) });
  }
  return out;
}
/** Same letter `steps` above a placed note. */
const above = (p: P, tone: string, minGap: number): P => {
  let d = p.d + minGap;
  while (letter(d) !== LETTERS.indexOf(tone[0])) d++;
  return { d, acc: tone.slice(1) };
};

function leftHand(level: Level, meter: Meter, chords: BarChord[]): Ev[][] {
  const barLen = meter === "3/4" ? 6 : 8;
  let bass = 19, upper = 24; // A2, F3: where the last bass note and chord sat
  return chords.map((ch, b) => {
    const t = ch.tones;
    const root = placeTone(t[0], 16, 23, bass); // E2–E3
    bass = root.d;
    if (b === 7 || level === 1) {
      // held chord: root position, close
      const low = placeTone(t[0], 17, 23, bass);
      return [{ notes: stackFrom(t.slice(0, 3), low), len: barLen }];
    }
    if (level === 2) {
      // bass on the beat, the chord after it (the 7th chord drops its root)
      const up = t.length === 4 ? t.slice(1) : t;
      let best: P[] = [];
      for (let inv = 0; inv < up.length; inv++) {
        const order = [...up.slice(inv), ...up.slice(0, inv)];
        for (let d = root.d + 2; d <= 27; d++) {
          if (letter(d) !== LETTERS.indexOf(order[0][0])) continue;
          const v = stackFrom(order, { d, acc: order[0].slice(1) });
          if (v[v.length - 1].d > 30) continue;
          if (!best.length || Math.abs(v[0].d - upper) < Math.abs(best[0].d - upper)) best = v;
        }
      }
      upper = best[0].d;
      const chord = { notes: best, len: 2 };
      if (meter === "3/4") return [{ notes: [root], len: 2 }, chord, { ...chord }];
      // the fifth below the root, or above it when the root is already low
      const fifth = placeTone(t[2], root.d - 4, root.d + 4, root.d >= 19 ? root.d - 3 : root.d + 4);
      return [{ notes: [root], len: 2 }, chord, { notes: [fifth], len: 2 }, { ...chord }];
    }
    // levels 3 and 4: eighths
    if (meter === "4/4") {
      // Alberti: low, high, middle, high on a close chord with the root at the bottom
      const low = placeTone(t[0], 18, 24, bass);
      const [R1, T3, T5] = stackFrom(t.slice(0, 3), low);
      const top = t.length === 4 ? stackFrom(t, low)[3] : T5;
      return [R1, T5, T3, top, R1, T5, T3, top].map((p) => ({ notes: [p], len: 1 }));
    }
    // 3/4: root, 5th, octave, 10th, octave, 5th (the 7th chord swaps the octave for its 7th); root D2–C3 so the 10th stays near the staff
    const low = placeTone(t[0], 15, 21, bass);
    bass = low.d;
    const fifth = above(low, t[2], 3);
    const oct = t.length === 4 ? above(fifth, t[3], 1) : { d: low.d + 7, acc: low.acc };
    const tenth = above(oct, t[1], 1);
    return [low, fifth, oct, tenth, oct, fifth].map((p) => ({ notes: [p], len: 1 }));
  });
}

/* ---------- Passage ---------- */

export function makePassage(k: string, mode: ChordMode, level: Level, meter: Meter, r: R = Math.random): Passage {
  const chords = progression(r, mode, level).map((st) => barChord(k, mode, st));
  const info = KEYS.find((o) => o.k === k)!;
  return {
    k, mode, level, meter, chords,
    keyName: mode === "major" ? `${k.replace("#", "♯").replace(/^([A-G])b$/, "$1♭")} major` : `${info.m} minor`,
    rh: melody(r, k, mode, level, meter, chords),
    lh: leftHand(level, meter, chords),
  };
}

/* ---------- ABC ---------- */

const ABC_ACC: Record<string, string> = { "": "=", "♯": "^", "♭": "_", "𝄪": "^^", "𝄫": "__" };

function abcPitch(p: P): string {
  const l = LETTERS[letter(p.d)], oct = Math.floor(p.d / 7);
  if (oct >= 5) return l.toLowerCase() + "'".repeat(oct - 5);
  return l + ",".repeat(4 - oct);
}
const abcLen = (n: number) => (n === 1 ? "" : String(n));

/** One bar of one hand. Accidentals follow printed-music rules: the key signature, then whatever this bar has
    already changed on that line or space. Beams break on the beat (`beam` = eighths per beamed group). */
function abcBar(evs: Ev[], sigOf: Record<string, string>, beam: number, ann: string[]): string {
  const state = new Map<number, string>();
  let on = 0, out = "";
  evs.forEach((ev, i) => {
    const ps = ev.notes.map((p) => {
      const cur = state.get(p.d) ?? sigOf[LETTERS[letter(p.d)]] ?? "";
      state.set(p.d, p.acc);
      return (p.acc === cur ? "" : ABC_ACC[p.acc]) + abcPitch(p);
    });
    const body = ps.length > 1 ? `[${ps.join("")}]` : ps[0];
    const lead = i > 0 && on % beam === 0 ? " " : "";
    out += lead + (i === 0 ? ann.map((a) => `"${a}"`).join("") : "") + body + abcLen(ev.len);
    on += ev.len;
  });
  return out;
}

const abcKeyName = (s: string) => s.replace("♯", "#").replace("♭", "b");

/** ABC for abcjs. `show(bar)` says whether a bar's chord name (above, as an ABC chord symbol, which abcjs
    prints with proper ♯/♭) and numeral (below, as an annotation) are printed. */
export function toAbc(p: Passage, perLine: number, show: (bar: number) => boolean): string {
  const sig = keySignature(p.k).of;
  const info = KEYS.find((o) => o.k === p.k)!;
  const K = p.mode === "major" ? abcKeyName(p.k) : abcKeyName(info.m) + "m";
  const rhBeam = 2, lhBeam = p.meter === "3/4" ? 6 : 4;
  const lines = [
    "X:1", `M:${p.meter}`, "L:1/8", "%%barnumbers 1", "%%score {RH | LH}",
    "V:RH clef=treble", "V:LH clef=bass", `K:${K}`,
  ];
  for (let b0 = 0; b0 < 8; b0 += perLine) {
    const bars = Array.from({ length: Math.min(perLine, 8 - b0) }, (_, i) => b0 + i);
    const end = (b: number) => (b === 7 ? " |]" : " |");
    lines.push("[V:RH] " + bars.map((b) => abcBar(p.rh[b], sig, rhBeam, show(b) ? [p.chords[b].name.replace("♯", "#").replace("♭", "b")] : []) + end(b)).join(" "));
    lines.push("[V:LH] " + bars.map((b) => abcBar(p.lh[b], sig, lhBeam, show(b) ? [`_${p.chords[b].numeral}`] : []) + end(b)).join(" "));
  }
  return lines.join("\n");
}

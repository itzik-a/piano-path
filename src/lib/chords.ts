/* Diatonic chords for a key: triads and seventh chords on every scale step, in every inversion,
   plus short cadences voiced in close position with smooth voice leading.
   Chords are stacked from the scale notes in `keyScales()`, so spelling is always correct (e.g. C𝄪 in D♯ minor).
   Minor uses the harmonic minor's raised 7th only in the chords on V and vii° (so III stays major). */
import { keyScales } from "./arpeggios";

export type ChordMode = "major" | "minor";

export interface Chord {
  /** scale step, 0 = tonic */
  degree: number;
  /** roman numeral, e.g. "ii", "V7", "vii°" */
  numeral: string;
  /** chord symbol, e.g. "Dm", "G7", "B°" */
  name: string;
  /** root position, root upwards */
  notes: string[];
}

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];
const ACC: Record<string, number> = { "": 0, "♯": 1, "♭": -1, "𝄪": 2, "𝄫": -2 };

/** Pitch class (0–11) of a spelled note like "F♯" or "C𝄪". */
export function pc(note: string): number {
  return (((NATURAL_PC[LETTERS.indexOf(note[0])] + (ACC[note.slice(1)] ?? 0)) % 12) + 12) % 12;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII"];

/** Quality from semitones above the root: [symbol suffix, roman suffix, uppercase numeral?] */
const QUALITY: Record<string, [string, string, boolean]> = {
  "4,7": ["", "", true],
  "3,7": ["m", "", false],
  "3,6": ["°", "°", false],
  "4,8": ["+", "+", true],
  "4,7,11": ["maj7", "maj7", true],
  "4,7,10": ["7", "7", true],
  "3,7,10": ["m7", "7", false],
  "3,6,10": ["ø7", "ø7", false],
  "3,6,9": ["°7", "°7", false],
  "3,7,11": ["m(maj7)", "(maj7)", false],
  "4,8,11": ["+maj7", "+maj7", true],
};

/** The seven scale notes used to build chords on each step (index 0 = tonic). */
function scaleFor(key: string, mode: ChordMode, degree: number): string[] {
  const sc = keyScales(key);
  if (mode === "major") return sc[0].notes.slice(0, 7);
  const nat = sc[1].notes.slice(0, 7);
  // raised 7th (leading note) only in the chords on V and vii°
  if (degree === 4 || degree === 6) nat[6] = sc[2].notes[6];
  return nat;
}

export function diatonicChords(key: string, mode: ChordMode, sevenths = false): Chord[] {
  return Array.from({ length: 7 }, (_, d) => {
    const s = scaleFor(key, mode, d);
    const notes = (sevenths ? [0, 2, 4, 6] : [0, 2, 4]).map((x) => s[(d + x) % 7]);
    const iv = notes.slice(1).map((n) => (pc(n) - pc(notes[0]) + 12) % 12).join(",");
    const [sym, rom, upper] = QUALITY[iv] ?? ["?", "?", true];
    const numeral = (upper ? ROMAN[d] : ROMAN[d].toLowerCase()) + rom;
    return { degree: d, numeral, name: notes[0] + sym, notes };
  });
}

/** Notes from the bottom up for an inversion (0 = root position, 1 = 1st, …). */
export const invert = (notes: string[], inv: number) => [...notes.slice(inv), ...notes.slice(0, inv)];

export const INVERSIONS = ["Root", "1st", "2nd", "3rd"];

const TRIAD_FIG = ["", "⁶", "⁶₄"], SEVENTH_FIG = ["⁷", "⁶₅", "⁴₃", "⁴₂"];
/** Roman numeral with inversion figures: "ii" → "ii⁶", "V7" → "V⁶₅", "viiø7" → "viiø⁴₂". */
export function figured(c: Chord, inv: number): string {
  return c.notes.length === 4 ? c.numeral.replace(/7$/, "") + SEVENTH_FIG[inv] : c.numeral + TRIAD_FIG[inv];
}
/** Chord symbol with its bass: "G7/B" (root position stays "G7"). */
export const slashName = (c: Chord, inv: number) => (inv ? `${c.name}/${invert(c.notes, inv)[0]}` : c.name);

/** Standard fingerings, bottom note first, per inversion. */
export const TRIAD_FINGERS = [
  { rh: "1 3 5", lh: "5 3 1" },
  { rh: "1 2 5", lh: "5 3 1" },
  { rh: "1 3 5", lh: "5 2 1" },
];
export const SEVENTH_FINGERS = [
  { rh: "1 2 3 5", lh: "5 3 2 1" },
  { rh: "1 2 4 5", lh: "5 3 2 1" },
  { rh: "1 2 3 5", lh: "5 3 2 1" },
  { rh: "1 2 3 5", lh: "5 4 2 1" },
];

/* ---------- Cadences ---------- */

export interface CadenceStep {
  numeral: string;
  /** right hand, bottom note first */
  rh: string[];
  /** right hand as MIDI pitches, bottom note first (60 = middle C), for placing it on a staff */
  pitches: number[];
  /** which inversion the right hand is in (for the fingering) */
  inv: number;
  /** left-hand bass note */
  bass: string;
}

export interface Cadence {
  name: string;
  steps: CadenceStep[];
}

/** [degree, bass on the 5th (⁶₄)?] */
type Step = [number, boolean?];
const PROGRESSIONS: Record<ChordMode, { name: string; steps: Step[] }[]> = {
  major: [
    { name: "Cadence I–IV–I⁶₄–V–I", steps: [[0], [3], [0, true], [4], [0]] },
    { name: "I–vi–IV–V–I", steps: [[0], [5], [3], [4], [0]] },
  ],
  minor: [
    { name: "Cadence i–iv–i⁶₄–V–i", steps: [[0], [3], [0, true], [4], [0]] },
    { name: "i–VI–iv–V–i", steps: [[0], [5], [3], [4], [0]] },
  ],
};

/** Absolute pitches, ascending, for notes given bottom-up, with the bottom note at `low`. */
function stack(notes: string[], low: number): number[] {
  const out = [low];
  for (const n of notes.slice(1)) {
    let p = Math.floor(out[out.length - 1] / 12) * 12 + pc(n);
    while (p <= out[out.length - 1]) p += 12;
    out.push(p);
  }
  return out;
}

/** The closest voicing of `notes` to `prev`: least total movement, then least single leap. */
function nearest(notes: string[], prev: number[]) {
  let best: { inv: number; pitches: number[]; cost: number; leap: number } | null = null;
  for (let inv = 0; inv < notes.length; inv++) {
    const bottom = invert(notes, inv);
    const base = pc(bottom[0]);
    for (let low = prev[0] - 12; low <= prev[0] + 12; low++) {
      if (((low % 12) + 12) % 12 !== base) continue;
      const p = stack(bottom, low);
      const moves = p.map((x, i) => Math.abs(x - prev[i]));
      const cost = moves.reduce((a, b) => a + b, 0), leap = Math.max(...moves);
      if (!best || cost < best.cost || (cost === best.cost && leap < best.leap)) best = { inv, pitches: p, cost, leap };
    }
  }
  return best!;
}

/** Each cadence for the key, with the right hand starting on the tonic chord in position `start`. */
export function cadences(key: string, mode: ChordMode, start: number): Cadence[] {
  const triads = diatonicChords(key, mode);
  return PROGRESSIONS[mode].map(({ name, steps }) => {
    const first = invert(triads[0].notes, start);
    const p0 = pc(first[0]);
    let prev = stack(first, 60 + p0 - (p0 > 7 ? 12 : 0)); // start around middle C
    const out: CadenceStep[] = steps.map(([d, six4], i) => {
      const ch = triads[d];
      let inv = start;
      if (i > 0) {
        const v = nearest(ch.notes, prev);
        inv = v.inv;
        prev = v.pitches;
      }
      return {
        numeral: ch.numeral + (six4 ? "⁶₄" : ""),
        rh: invert(ch.notes, inv),
        pitches: prev,
        inv,
        bass: six4 ? ch.notes[2] : ch.notes[0],
      };
    });
    return { name, steps: out };
  });
}

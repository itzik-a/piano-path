/* The 11 Russian arpeggio forms, spelled correctly for any key.
   Notes are built by letter + semitones, so A's #4 is D♯ (not E♭) and
   double flats appear where theory requires them (e.g. D♭ dim7: D♭ F♭ A𝄫 C𝄫). */

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];

/** [letter steps, semitones] above the root */
type Interval = [number, number];
const I: Record<string, Interval> = {
  P1: [0, 0], M2: [1, 2], m3: [2, 3], M3: [2, 4], P4: [3, 5], A4: [3, 6],
  d5: [4, 6], P5: [4, 7], A5: [4, 8], m6: [5, 8], M6: [5, 9], m7: [6, 10], d7: [6, 9], M7: [6, 11],
};

export interface ArpForm {
  n: number;
  /** function and position, e.g. "♭VI major · 1st inversion" */
  label: string;
  intervals: string[];
  /** which interval is the chord's root, for naming the chord */
  root: string;
  /** chord-name suffix: "" major, "m" minor, "7" dominant 7th, "°7" diminished 7th */
  suffix: string;
}

export const FORMS: ArpForm[] = [
  { n: 1, label: "Major · root position", intervals: ["P1", "M3", "P5"], root: "P1", suffix: "" },
  { n: 2, label: "Minor · root position", intervals: ["P1", "m3", "P5"], root: "P1", suffix: "m" },
  { n: 3, label: "♭VI major · 1st inversion", intervals: ["P1", "m3", "m6"], root: "m6", suffix: "" },
  { n: 4, label: "vi minor · 1st inversion", intervals: ["P1", "M3", "M6"], root: "M6", suffix: "m" },
  { n: 5, label: "IV major · 2nd inversion", intervals: ["P1", "P4", "M6"], root: "P4", suffix: "" },
  { n: 6, label: "iv minor · 2nd inversion", intervals: ["P1", "P4", "m6"], root: "P4", suffix: "m" },
  { n: 7, label: "Dominant 7th · root position", intervals: ["P1", "M3", "P5", "m7"], root: "P1", suffix: "7" },
  { n: 8, label: "♭VI dominant 7th · 1st inversion", intervals: ["P1", "m3", "d5", "m6"], root: "m6", suffix: "7" },
  { n: 9, label: "IV dominant 7th · 2nd inversion", intervals: ["P1", "m3", "P4", "M6"], root: "P4", suffix: "7" },
  { n: 10, label: "II dominant 7th · 3rd inversion", intervals: ["P1", "M2", "A4", "M6"], root: "M2", suffix: "7" },
  { n: 11, label: "Diminished 7th · root position", intervals: ["P1", "m3", "d5", "d7"], root: "P1", suffix: "°7" },
];

const ACC: Record<number, string> = { [-2]: "𝄫", [-1]: "♭", 0: "", 1: "♯", 2: "𝄪" };

/** Parse a key name like "F#", "Db", "A". */
function parse(key: string) {
  const li = LETTERS.indexOf(key[0]);
  const acc = key.slice(1) === "#" ? 1 : key.slice(1) === "b" ? -1 : 0;
  return { li, pc: (NATURAL_PC[li] + acc + 12) % 12 };
}

/** Spell the note an interval above `key`. */
export function noteAbove(key: string, interval: string): string {
  const { li, pc } = parse(key);
  const [steps, semis] = I[interval];
  const l = (li + steps) % 7;
  const target = (pc + semis) % 12;
  let diff = target - NATURAL_PC[l];
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return LETTERS[l] + ACC[diff];
}

export function formNotes(key: string, f: ArpForm): string[] {
  return f.intervals.map((iv) => noteAbove(key, iv));
}

export function chordName(key: string, f: ArpForm): string {
  return noteAbove(key, f.root) + f.suffix;
}

const LONG: Record<string, string> = { "": " Major", m: " Minor", "7": "7", "°7": "dim7" };
/** Spelled-out chord name for the quick list: "F♯ Minor", "B7", "Adim7". */
export function chordLongName(key: string, f: ArpForm): string {
  return noteAbove(key, f.root) + LONG[f.suffix];
}

/** Fingerings you've supplied, as "RH : LH". Keyed "<key>:<form number>". */
export const DEFAULT_FINGERINGS: Record<string, string> = {
  "A:1": "1,2,3 : 5,3,2,1",
  "A:2": "1,2,3 : 5,4,2,1",
  "A:3": "1,2,4 : 5,4,2,1",
  "A:5": "1,2,4 : 5,3,2,1",
};

const BLACK = new Set([1, 3, 6, 8, 10]);
const pitch = (note: string) => (NATURAL_PC[LETTERS.indexOf(note[0])] + (ACC_VAL[note.slice(1)] || 0) + 12) % 12;

/** Standard one-octave fingering for a form, ascending from the key note to its octave, one digit per note.
    - Thumbs go on the key note when it's white (or when every note is black), else on a white note:
      the one with the widest crossing (RH: the gap before the thumb, LH: the gap after it).
    - Triads: the finger beside the crossing is 4 across a third and 3 across a fourth (C: 1 2 3 5 / 5 4 2 1,
      E G C: 1 2 4 5, G C E: LH 5 3 2 1). 7ths use 1 2 3 4 (RH) and 1 4 3 2 (LH) from the thumb.
    - The outer 5 (RH top, LH bottom) only when the thumb is on the key note; a black-key start before
      the RH thumb uses 2 (D♭: 2 1 2 4 / 2 1 4 2). */
function standardFingering(notes: string[]): [string[], string[]] {
  const N = notes.length;
  const p = notes.map(pitch);
  const gap = (i: number) => (p[(i + 1) % N] - p[i % N] + 12) % 12 || 12; // semitones from note i up to the next
  const white = notes.map((_, i) => i).filter((i) => !BLACK.has(p[i]));
  const thumbOn = (cross: (t: number) => number) =>
    !BLACK.has(p[0]) || !white.length ? 0 : white.reduce((a, b) => (cross(b) > cross(a) ? b : a));

  const tr = thumbOn((t) => gap((t + N - 1) % N));
  const rhPat: number[] = [];
  for (let j = 0; j < N; j++) rhPat[(tr + j) % N] = j + 1;
  if (N === 3) rhPat[(tr + 2) % N] = gap((tr + 2) % N) <= 4 ? 4 : 3;
  const rh = Array.from({ length: N + 1 }, (_, i) => rhPat[i % N]);
  if (tr === 0) rh[N] = 5;
  else if (!(N === 3 && tr === 2)) for (let i = 0; i < tr; i++) rh[i] = i + 2;

  const tl = thumbOn(gap);
  const seq = N === 3 ? [1, gap(tl) <= 4 ? 4 : 3, 2] : [1, 4, 3, 2];
  const lhPat: number[] = [];
  seq.forEach((d, j) => { lhPat[(tl + j) % N] = d; });
  const lh = Array.from({ length: N + 1 }, (_, i) => lhPat[i % N]);
  if (tl === 0) lh[0] = 5;

  return [rh.map(String), lh.map(String)];
}

/** One octave of a form with its fingering. `custom` ("RH : LH", e.g. "1,2,3 : 5,3,2,1") overrides the standard one;
    an RH without the top note gets the standard top. */
export function arpFingering(key: string, f: ArpForm, custom?: string) {
  const chord = formNotes(key, f);
  const notes = [...chord, chord[0]];
  let [rh, lh] = standardFingering(chord);
  const N = chord.length;
  const [r, l] = (custom || "").split(":").map((s) => s.match(/[1-5]/g) || []);
  if (l && (r.length === N || r.length === N + 1) && l.length === N + 1) {
    rh = r.length === N ? [...r, rh[N]] : r;
    lh = l;
  }
  return { notes, rh, lh };
}

const PLAIN = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const ACC_VAL: Record<string, number> = { "𝄫": -2, "♭": -1, "♯": 1, "𝄪": 2 };

/** Everyday name for an unusual spelling (B𝄫 → A, F♭ → E), else null. */
export function enharmonic(note: string): string | null {
  const letter = note[0], acc = note.slice(1);
  if (!["𝄫", "𝄪"].includes(acc) && !["F♭", "C♭", "E♯", "B♯"].includes(note)) return null;
  const pc = (NATURAL_PC[LETTERS.indexOf(letter)] + (ACC_VAL[acc] || 0) + 12) % 12;
  return PLAIN[pc];
}

/** The major scale and its relative minor's three forms, spelled from the major key
    (so the raised 7th of D♯ minor is C𝄪, not D). Melodic shows the way up; it comes down natural. */
const SCALES: { l: string; minor: boolean; iv: string[] }[] = [
  { l: "Major", minor: false, iv: ["P1", "M2", "M3", "P4", "P5", "M6", "M7", "P1"] },
  { l: "Natural minor", minor: true, iv: ["M6", "M7", "P1", "M2", "M3", "P4", "P5", "M6"] },
  { l: "Harmonic minor", minor: true, iv: ["M6", "M7", "P1", "M2", "M3", "P4", "A5", "M6"] },
  { l: "Melodic minor ↑", minor: true, iv: ["M6", "M7", "P1", "M2", "M3", "A4", "A5", "M6"] },
];
export const SCALE_FORMS = ["maj", "nat", "harm", "mel"] as const;

/** Standard one-octave fingerings, ascending, one digit per note: [RH, LH].
    Thumbs fall on the same notes in every octave; the outer 5 (RH top, LH bottom) is only for the very first/last note.
    Melodic is the way up; it comes down with the natural-minor fingering. */
type Fing = [string, string];
const WHITE: Fing = ["12312345", "54321321"]; // C, G, D, A, E majors; A, E, D, G, C minors
const B_SHAPE: Fing = ["12312345", "43214321"]; // B major, B minor
const F_SHAPE: Fing = ["12341234", "54321321"]; // F major, F minor
const minor = (nat: Fing, harm = nat, mel = harm) => ({ nat, harm, mel });
const SCALE_FINGERINGS: Record<string, Record<(typeof SCALE_FORMS)[number], Fing>> = {
  C: { maj: WHITE, ...minor(WHITE) },
  G: { maj: WHITE, ...minor(WHITE) },
  D: { maj: WHITE, ...minor(B_SHAPE) },
  A: { maj: WHITE, ...minor(["34123123", "43213214"], undefined, ["34123412", "43213214"]) }, // F♯ minor
  E: { maj: WHITE, ...minor(["34123123", "32143213"], undefined, ["34123412", "32143213"]) }, // C♯ minor
  B: { maj: B_SHAPE, ...minor(["34123123", "32132143"], ["34123123", "32143213"]) }, // G♯ minor: LH thumb moves to F𝄪
  "F#": { maj: ["23412312", "43213214"], ...minor(["31234123", "21432132"]) }, // D♯ minor
  Db: { maj: ["23123412", "32143213"], ...minor(["41231234", "21321432"]) }, // B♭ minor
  Ab: { maj: ["34123123", "32143213"], ...minor(F_SHAPE) },
  Eb: { maj: ["31234123", "32143213"], ...minor(WHITE) },
  Bb: { maj: ["41231234", "32143213"], ...minor(WHITE) },
  F: { maj: F_SHAPE, ...minor(WHITE) },
};

export function keyScales(key: string) {
  return SCALES.map((sc, i) => {
    const f = SCALE_FORMS[i];
    const [rh, lh] = SCALE_FINGERINGS[key][f];
    return { f, l: sc.l, minor: sc.minor, notes: sc.iv.map((iv) => noteAbove(key, iv)), rh: [...rh], lh: [...lh] };
  });
}

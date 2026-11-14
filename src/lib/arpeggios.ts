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

export function keyScales(key: string) {
  return SCALES.map((sc, i) => ({ f: SCALE_FORMS[i], l: sc.l, minor: sc.minor, notes: sc.iv.map((iv) => noteAbove(key, iv)) }));
}

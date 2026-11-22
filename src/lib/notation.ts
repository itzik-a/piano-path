/* Placing chords on a staff: key signatures, which accidentals to print, and where each note sits.
   A staff position counts lines and spaces up from the bottom line (0 = bottom line, 8 = top line,
   -2 = first ledger line below). Each chord gets its own bar, so accidentals never carry over. */
import { keyScales } from "./arpeggios";
import { invert, type CadenceStep, type Chord } from "./chords";

export type Clef = "treble" | "bass";

const LETTERS = "CDEFGAB";
const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];
const ACC: Record<string, number> = { "": 0, "♯": 1, "♭": -1, "𝄪": 2, "𝄫": -2 };

/** Absolute step (octave × 7 + letter) of each clef's bottom line: E4 and G2. */
const BOTTOM: Record<Clef, number> = { treble: 4 * 7 + 2, bass: 2 * 7 + 4 };

/** Staff positions of the key-signature accidentals, in the order they are written (treble; bass is 2 lower). */
const SHARP_ORDER = "FCGDAEB", SHARP_POS = [8, 5, 9, 6, 3, 7, 4];
const FLAT_ORDER = "BEADGCF", FLAT_POS = [4, 7, 3, 6, 2, 5, 1];

export interface KeySig { acc: "♯" | "♭" | ""; count: number; of: Record<string, string> }

/** The key signature of a major key (its relative minor shares it). */
export function keySignature(k: string): KeySig {
  const notes = keyScales(k)[0].notes.slice(0, 7);
  const of: Record<string, string> = {};
  for (const n of notes) if (n.length > 1) of[n[0]] = n.slice(1);
  const accs = Object.values(of);
  return { acc: (accs[0] as KeySig["acc"]) ?? "", count: accs.length, of };
}

/** Where to draw each accidental of the signature on a clef. */
export function signaturePositions(sig: KeySig, clef: Clef): number[] {
  const pos = sig.acc === "♯" ? SHARP_POS : FLAT_POS;
  const order = sig.acc === "♯" ? SHARP_ORDER : FLAT_ORDER;
  const shift = clef === "bass" ? -2 : 0;
  return pos.slice(0, sig.count).filter((_, i) => order[i] in sig.of).map((p) => p + shift);
}

export interface StaffNote {
  /** 0 = top staff, 1 = bottom staff (grand staff) */
  staff: number;
  pos: number;
  /** accidental to print beside the note, or null when the key signature already says it */
  acc: string | null;
}

/** The accidental a note needs in a bar that starts fresh: none if the signature covers it, ♮ to cancel it. */
function shown(note: string, sig: KeySig): string | null {
  const acc = note.slice(1), inSig = sig.of[note[0]] ?? "";
  if (acc === inSig) return null;
  return acc === "" ? "♮" : acc;
}

/** Absolute steps going up: the first note at `low`, each next one at the nearest step above with its letter. */
function stackUp(notes: string[], low: number): number[] {
  const out = [low];
  for (const n of notes.slice(1)) {
    let s = out[out.length - 1] + 1;
    while (LETTERS[((s % 7) + 7) % 7] !== n[0]) s++;
    out.push(s);
  }
  return out;
}

/** The seven chords of a key, one inversion, rising by step; the whole run is centred on the staff. */
export function chordsOnStaff(chords: Chord[], inv: number, sig: KeySig, clef: Clef): StaffNote[][] {
  const voiced = chords.map((c) => invert(c.notes, inv));
  const first = LETTERS.indexOf(voiced[0][0][0]);
  const steps = voiced.map((v, i) => stackUp(v, first + i));
  const lo = steps[0][0], hi = Math.max(...steps.map((s) => s[s.length - 1]));
  const middle = BOTTOM[clef] + 4;
  const shift = Math.round((middle - (lo + hi) / 2) / 7) * 7;
  return voiced.map((v, i) => v.map((n, j) => ({ staff: 0, pos: steps[i][j] + shift - BOTTOM[clef], acc: shown(n, sig) })));
}

/** One chord (notes bottom-up) on a staff: the octave with the fewest steps off the staff, then the most central. */
export function placeChord(notes: string[], sig: KeySig, clef: Clef, staff = 0): StaffNote[] {
  const steps = stackUp(notes, LETTERS.indexOf(notes[0][0]));
  const lo = steps[0] - BOTTOM[clef], hi = steps[steps.length - 1] - BOTTOM[clef];
  const near = Math.round((4 - (lo + hi) / 2) / 7) * 7;
  const cost = (sh: number) => Math.max(0, hi + sh - 8) + Math.max(0, -(lo + sh)) + Math.abs(4 - (lo + hi) / 2 - sh) / 100;
  const shift = [near - 7, near, near + 7].reduce((a, b) => (cost(b) < cost(a) ? b : a));
  return notes.map((n, j) => ({ staff, pos: steps[j] + shift - BOTTOM[clef], acc: shown(n, sig) }));
}

/** Absolute step of a spelled note at a MIDI pitch (60 = middle C, C4). */
function stepAt(note: string, midi: number): number {
  const letter = LETTERS.indexOf(note[0]);
  const octave = Math.floor((midi - (ACC[note.slice(1)] ?? 0) - NATURAL_PC[letter]) / 12) - 1;
  return octave * 7 + letter;
}

/** A cadence on a grand staff: the right hand as voiced, the bass a little below the tonic in the bass clef. */
export function cadenceOnStaff(steps: CadenceStep[], tonic: string, sig: KeySig): StaffNote[][] {
  const pcOf = (n: string) => ((NATURAL_PC[LETTERS.indexOf(n[0])] + (ACC[n.slice(1)] ?? 0)) % 12 + 12) % 12;
  const home = 48 + pcOf(tonic); // tonic bass between C3 and B3; the other bass notes sit up to a fifth below it
  return steps.map((s) => {
    let b = 48 + pcOf(s.bass);
    while (b > home) b -= 12;
    while (b < home - 7) b += 12;
    return [
      ...s.rh.map((n, i) => ({ staff: 0, pos: stepAt(n, s.pitches[i]) - BOTTOM.treble, acc: shown(n, sig) })),
      { staff: 1, pos: stepAt(s.bass, b) - BOTTOM.bass, acc: shown(s.bass, sig) },
    ];
  });
}

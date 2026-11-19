/* Builds today's practice plan from the current stage and technique status. */
import { CHORD_ITEMS, KEYS, PIECE_STEPS, STAGES, maintained, pretty, type Stage } from "../data/curriculum";
import { todayStr, type AppState, type Rot } from "../state/store";

export interface Block {
  id: string;
  cat: string;
  ttl: string;
  det: string;
  min: number;
  /** rotation blocks: which rotation, and today's keys (chord items are "C:maj" / "C:min") */
  rot?: Rot;
  keys?: string[];
  /** for the new-piece block: the repertoire item id */
  piece?: string;
}

export function stageProgress(state: AppState, st: Stage) {
  const n = st.items.length;
  const d = st.items.filter((i) => state.checks[i.id]).length;
  return { n, d, p: n ? d / n : 0 };
}

export const arpCount = (state: AppState) => KEYS.filter((o) => state.arps[o.k] === "solid").length;

export function todayDone(state: AppState): Record<string, boolean> {
  if (!state.today || state.today.date !== todayStr()) return {};
  return state.today.done || {};
}

/** Times each key has been ticked before today (today's ticks don't change today's keys). */
function rotCounts(state: AppState, rot: Rot) {
  const n = { ...state.rot.n[rot] };
  const day = state.rot.day;
  if (day && day.d < todayStr()) day[rot].forEach((k) => { n[k] = (n[k] || 0) + 1; });
  return n;
}

/** The least-practised items, in list order; one you don't tick stays first in line, so it comes up again the next day. */
function leastTicked<T>(state: AppState, rot: Rot, list: T[], id: (t: T) => string, count: number) {
  const n = rotCounts(state, rot);
  return list.map((o, i) => ({ o, i, c: n[id(o)] || 0 }))
    .sort((a, b) => a.c - b.c || a.i - b.i)
    .slice(0, count).map((x) => x.o);
}

/** Today's scale or arpeggio keys (one by default), in circle-of-fifths order (C, G, D, … F). */
export const rotationKeys = (state: AppState, rot: "scale" | "arp", count = 1) => leastTicked(state, rot, KEYS, (o) => o.k, count);

/** Today's chord items: major, then its relative minor, around the circle (C major, A minor, G major, …). */
export const chordRotation = (state: AppState, count = 1) => leastTicked(state, "chord", CHORD_ITEMS, (c) => c.id, count);

/** Keys ticked today in a rotation. */
export function ticked(state: AppState, rot: Rot): string[] {
  const day = state.rot.day;
  return day && day.d === todayStr() ? day[rot] : [];
}

/** Blocks left out of Today for now (their time goes to the new piece). Remove an id to bring it back. */
export const HIDDEN_BLOCKS = new Set(["etude"]);

export function todaysPlan(state: AppState) {
  const st = STAGES[(state.settings.stage || 1) - 1] ?? STAGES[0];
  const M = state.settings.minutes || 45;
  const day = Math.floor(new Date(todayStr()).getTime() / 864e5);
  const scaleKeys = rotationKeys(state, "scale", 1); // one major key and its relative minor a day
  const arpKeys = rotationKeys(state, "arp", 1); // one arpeggio key a day
  const chordItems = chordRotation(state, 1); // chords: one major or minor key a day, at their own pace
  const notSolid = arpKeys.filter((o) => state.arps[o.k] !== "solid");

  const open = (c: string) => st.items.filter((i) => i.c === c && !state.checks[i.id]);
  const rep = open("R"), et = open("E");
  // arpeggios and harmonic/melodic minor are covered by the daily rotation
  const techOpen = open("T").filter((i) => !/arpeggio|harmonic minor|melodic minor/i.test(i.t));

  const weights: [string, number][] = [["warm", .18], ["chord", .14], ["arp", .30], ["etude", .10], ["piece", .23], ["keep", .05]];
  const mins: Record<string, number> = {};
  const spare = weights.filter(([k]) => HIDDEN_BLOCKS.has(k)).reduce((a, [, f]) => a + f, 0);
  weights.forEach(([k, f]) => { mins[k] = Math.max(3, Math.round(M * (k === "piece" ? f + spare : f))); });

  const keepList = maintained(state.checks);
  const keep = keepList[day % keepList.length]; // round-robin through every piece you play
  const all: Block[] = [
    {
      id: "warm", cat: "Scales", min: mins.warm, rot: "scale", keys: scaleKeys.map((o) => o.k),
      ttl: scaleKeys.map((o) => `${pretty(o.k)} major / ${o.m} minor`).join(", then "),
      det: `Hands together. Tick a key once you've played all four of its scales; a key you don't tick moves to tomorrow.${techOpen[0] ? " Then a few minutes on: " + techOpen[0].t + "." : ""}`,
    },
    {
      id: "chord", cat: "Chords", min: mins.chord, rot: "chord", keys: chordItems.map((c) => c.id),
      ttl: chordItems.map((c) => c.name).join(", then "),
      det: "Right hand plays the chord, left hand the bass note. Triads up the scale in each position, then the 7ths and the two cadences from each starting position. Tick the key once it's all done; if you don't, it stays for tomorrow.",
    },
    {
      id: "arp", cat: "Russian arpeggios", min: mins.arp, rot: "arp", keys: arpKeys.map((o) => o.k),
      ttl: `11 forms on ${arpKeys.map((o) => pretty(o.k)).join(", then ")}`,
      det: (notSolid.length
        ? `${notSolid.map((o) => pretty(o.k)).join(" and ")} ${notSolid.length > 1 ? "aren't" : "isn't"} solid yet: hands separately and slowly. Mark it Learning, then Solid, on the Technique tab.`
        : "Hands together.") + " Tick a key once all 11 forms are done; a key you don't tick moves to tomorrow.",
    },
    {
      id: "etude", cat: "Étude", min: mins.etude,
      ttl: et[0] ? et[0].t : "Choose an étude from the next stage",
      det: et[0]?.d || "Work in short sections at a slow, steady tempo.",
    },
    {
      id: "piece", cat: "New piece", min: mins.piece,
      ttl: rep[0] ? rep[0].t : "Stage repertoire complete",
      piece: rep[0]?.id,
      det: rep[0]
        ? [PIECE_STEPS[state.pieces[rep[0].id]?.step ?? 0].d, rep[0].d].filter(Boolean).join(" ")
        : "Pick a section of 4–8 bars, hands separately, then together.",
    },
    { id: "keep", cat: "Keep up", ttl: keep.t, det: keep.d, min: mins.keep },
  ];
  const blocks = all.filter((b) => !HIDDEN_BLOCKS.has(b.id));
  return { st, blocks, total: blocks.reduce((a, b) => a + b.min, 0) };
}

export function fmt(sec: number) {
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}

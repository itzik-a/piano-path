/* Builds today's practice plan from the current stage and technique status. */
import { KEYS, PIECE_STEPS, STAGES, maintained, pretty, type Link, type Stage } from "../data/curriculum";
import { todayStr, type AppState, type Rot } from "../state/store";

export interface Block {
  id: string;
  cat: string;
  ttl: string;
  det: string;
  min: number;
  /** scale and arpeggio blocks: which rotation, and today's keys */
  rot?: Rot;
  keys?: string[];
  /** free sheet-music links */
  links?: Link[];
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

/** Today's two keys: the least-practised keys, in circle-of-fifths order (C, G, D, … F).
    A key you don't tick stays first in line, so it comes up again the next day. */
export function rotationKeys(state: AppState, rot: Rot) {
  const n = rotCounts(state, rot);
  return KEYS.map((o, i) => ({ o, i, c: n[o.k] || 0 }))
    .sort((a, b) => a.c - b.c || a.i - b.i)
    .slice(0, 2).map((x) => x.o);
}

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
  const scaleKeys = rotationKeys(state, "scale");
  const arpKeys = rotationKeys(state, "arp");
  const notSolid = arpKeys.filter((o) => state.arps[o.k] !== "solid");

  const open = (c: string) => st.items.filter((i) => i.c === c && !state.checks[i.id]);
  const rep = open("R"), et = open("E"), th = open("H");
  // arpeggios and harmonic/melodic minor are covered by the daily rotation
  const techOpen = open("T").filter((i) => !/arpeggio|harmonic minor|melodic minor/i.test(i.t));

  const weights: [string, number][] = [["warm", .18], ["arp", .44], ["etude", .10], ["piece", .18], ["keep", .05], ["read", .05]];
  const mins: Record<string, number> = {};
  const spare = weights.filter(([k]) => HIDDEN_BLOCKS.has(k)).reduce((a, [, f]) => a + f, 0);
  weights.forEach(([k, f]) => { mins[k] = Math.max(3, Math.round(M * (k === "piece" ? f + spare : f))); });

  const keepList = maintained(state.checks);
  const keep = keepList[day % keepList.length]; // round-robin through every piece you play
  const readItem = st.items.find((i) => i.c === "S" && i.links);
  const all: Block[] = [
    {
      id: "warm", cat: "Scales", min: mins.warm, rot: "scale", keys: scaleKeys.map((o) => o.k),
      ttl: scaleKeys.map((o) => `${pretty(o.k)} major / ${o.m} minor`).join(", then "),
      det: `Hands together. Tick a key once you've played all four of its scales; a key you don't tick moves to tomorrow.${techOpen[0] ? " Then a few minutes on: " + techOpen[0].t + "." : ""}`,
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
    {
      id: "read", cat: "Sight-reading", ttl: "Sight-read something new", min: mins.read, links: readItem?.links,
      det: th[0] ? `Theory to look at this week: ${th[0].t}.` : "Read at a steady tempo without stopping.",
    },
  ];
  const blocks = all.filter((b) => !HIDDEN_BLOCKS.has(b.id));
  return { st, blocks, total: blocks.reduce((a, b) => a + b.min, 0) };
}

export function fmt(sec: number) {
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}

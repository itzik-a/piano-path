/* Builds today's practice plan from the current stage and technique status. */
import { KEYS, NEW_ARP_ORDER, PIECE_STEPS, STAGES, maintained, pretty, type Link, type Stage } from "../data/curriculum";
import { todayStr, type AppState } from "../state/store";

export interface Block {
  id: string;
  cat: string;
  ttl: string;
  det: string;
  min: number;
  /** for the arpeggio block: the key whose forms to show */
  k?: string;
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

export function todaysPlan(state: AppState) {
  const st = STAGES[(state.settings.stage || 1) - 1] ?? STAGES[0];
  const M = state.settings.minutes || 45;
  const day = Math.floor(new Date(todayStr()).getTime() / 864e5);
  const sk = KEYS[day % 12];
  const sc = state.scales[sk.k] || { maj: 95, nat: 95, harm: 0, mel: 0 };
  const minorForms = [sc.harm ? "harmonic" : null, sc.mel ? "melodic" : null].filter(Boolean);

  let arpKey = KEYS.find((o) => state.arps[o.k] === "learning");
  let arpNew = false;
  if (!arpKey) {
    const k = NEW_ARP_ORDER.find((k) => state.arps[k] === "none");
    if (k) { arpKey = KEYS.find((o) => o.k === k); arpNew = true; }
  }
  const solid = KEYS.filter((o) => state.arps[o.k] === "solid");
  const review = solid.length ? solid[day % solid.length] : null;

  const open = (c: string) => st.items.filter((i) => i.c === c && !state.checks[i.id]);
  const rep = open("R"), et = open("E"), th = open("H");
  const techOpen = open("T").filter((i) => !/arpeggio/i.test(i.t));

  const weights: [string, number][] = [["warm", .15], ["arp", .15], ["etude", .15], ["piece", .35], ["keep", .10], ["read", .10]];
  const mins: Record<string, number> = {};
  weights.forEach(([k, f]) => { mins[k] = Math.max(3, Math.round(M * f)); });

  const keepList = maintained(state.checks);
  const keep = keepList[day % keepList.length]; // round-robin through every piece you play
  const readItem = st.items.find((i) => i.c === "S" && i.links);
  const blocks: Block[] = [
    {
      id: "warm", cat: "Scales", ttl: `${pretty(sk.k)} major and ${sk.m} minor`, min: mins.warm,
      det: `Hands together at your current tempo (${sc.maj || 95}). Minor: natural${minorForms.length ? ", " + minorForms.join(", ") : ""}.${techOpen[0] ? " Then a few minutes on: " + techOpen[0].t + "." : ""}`,
    },
    {
      id: "arp", cat: "Russian arpeggios", min: mins.arp, k: arpKey?.k ?? review?.k,
      ttl: arpKey ? `${arpNew ? "Start" : "Keep learning"}: ${pretty(arpKey.k)} major / ${arpKey.m} minor` : "Review a solid key",
      det: (arpKey ? "Hands separately, slowly, all 11 forms. Mark the key as Learning, then Solid, on the Technique tab." : "") + (review ? ` Then one review run in ${pretty(review.k)}.` : ""),
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
  return { st, blocks, total: blocks.reduce((a, b) => a + b.min, 0) };
}

export function fmt(sec: number) {
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
}

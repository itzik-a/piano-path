import { KEYS, LAST_STEP, chordItem, pretty } from "../data/curriculum";
import { todaysPlan } from "../lib/plan";
import { ROTS, update, todayStr, type AppState, type ArpStatus, type Rot, type ScaleForm } from "./store";

export const setStage = (n: number) => update((s) => { s.settings.stage = n; });

export function markBlock(id: string, done: boolean) {
  update((s) => {
    const d = todayStr();
    if (!s.today || s.today.date !== d) s.today = { date: d, done: {} };
    if (done) s.today.done[id] = true;
    else delete s.today.done[id];
    autoLog(s);
  });
}

export function toggleItem(id: string) {
  update((s) => {
    if (s.checks[id]) delete s.checks[id];
    else s.checks[id] = true;
  });
}

const ARP_CYCLE: ArpStatus[] = ["none", "learning", "solid"];
export function cycleArp(k: string) {
  update((s) => {
    s.arps[k] = ARP_CYCLE[(ARP_CYCLE.indexOf(s.arps[k]) + 1) % 3];
  });
}

export function setTempo(k: string, f: ScaleForm, v: number) {
  update((s) => { s.scales[k][f] = Math.max(0, Math.min(240, Math.round(v) || 0)); });
}

export function addLog(entry: { d: string; note: string; items: string }) {
  update((s) => {
    s.log.push({ ...entry, ts: Date.now() });
    if (s.log.length > 1500) s.log = s.log.slice(-1500);
  });
}

export function deleteLog(ts: number) {
  update((s) => {
    s.log = s.log.filter((e) => e.ts !== ts);
    s.logDeleted = [...s.logDeleted, ts].slice(-500);
  });
}

/** Set a piece's learning step; the last step marks it done, going back un-marks it. */
export function setPieceStep(id: string, step: number) {
  update((s) => {
    step = Math.max(0, Math.min(LAST_STEP, step));
    s.pieces[id] = { ...s.pieces[id], step };
    if (step === LAST_STEP) s.checks[id] = true;
    else delete s.checks[id];
  });
}

/** The Path checkbox for a piece: done means the last step, un-done goes back one step. */
export const togglePiece = (id: string, done: boolean) => setPieceStep(id, done ? LAST_STEP - 1 : LAST_STEP);

export function setPieceBars(id: string, bars: string) {
  update((s) => { s.pieces[id] = { step: s.pieces[id]?.step ?? 0, bars: bars.trim() }; });
}

/** Tick or untick keys in today's scale, arpeggio or chord rotation. The block is done when all of today's keys are ticked. */
/** The Today block each rotation belongs to. */
const ROT_BLOCK: Record<Rot, string> = { scale: "warm", arp: "arp", chord: "chord" };

export function setKeysDone(rot: Rot, keys: string[], done: boolean, todayKeys: string[]) {
  update((s) => {
    const d = todayStr();
    rollRotation(s, d);
    const day = s.rot.day!;
    day[rot] = done ? [...new Set([...day[rot], ...keys])] : day[rot].filter((k) => !keys.includes(k));
    if (!s.today || s.today.date !== d) s.today = { date: d, done: {} };
    const id = ROT_BLOCK[rot];
    if (todayKeys.every((k) => day[rot].includes(k))) s.today.done[id] = true;
    else delete s.today.done[id];
    autoLog(s);
  });
}

/** Fold an earlier day's ticks into the counts and start a fresh record for today. */
function rollRotation(s: AppState, d: string) {
  const day = s.rot.day;
  if (day && day.d === d) return;
  if (day && day.d < d) {
    ROTS.forEach((r) => day[r].forEach((k) => { s.rot.n[r][k] = (s.rot.n[r][k] || 0) + 1; }));
  }
  s.rot.day = { d, scale: [], arp: [], chord: [] };
}

/** Keep today's automatic log entry in step with what's ticked on Today: one entry per day,
    with a `ts` fixed by the date so every device updates the same entry when syncing. `n` counts the items ticked:
    each key in a rotation block, plus each other block. */
function autoLog(s: AppState) {
  const d = todayStr();
  const done = s.today?.date === d ? s.today.done : {};
  const day = s.rot.day?.d === d ? s.rot.day : null;
  const { blocks } = todaysPlan(s);
  const parts: string[] = [];
  let n = 0;
  for (const b of blocks) {
    if (b.rot && b.keys) {
      const keys = b.keys.filter((k) => day?.[b.rot!].includes(k));
      if (!keys.length) continue;
      n += keys.length;
      const names = keys.map((k) =>
        b.rot === "chord" ? chordItem(k).name : b.rot === "scale" ? `${pretty(k)} major / ${KEYS.find((o) => o.k === k)!.m} minor` : pretty(k));
      parts.push(`${b.cat}: ${names.join(", ")}`);
    } else if (done[b.id]) {
      n += 1;
      parts.push(`${b.cat}: ${b.ttl}`);
    }
  }
  let ts = Date.parse(d + "T00:00:00Z");
  while (s.logDeleted.includes(ts)) ts++; // deleted earlier today: start a fresh entry
  const entry = { d, n, note: "", items: parts.join(" · "), ts, auto: true };
  const i = s.log.findIndex((e) => e.ts === ts);
  if (i >= 0) s.log[i] = { ...s.log[i], n, items: entry.items, min: undefined };
  else if (parts.length) s.log.push(entry);
}

/** One Study answer: `item` is "<drill>:<…>" (e.g. "keys:D"). A miss makes the item come back more often; a right answer pays one miss off. */
export function recordAnswer(item: string, ok: boolean) {
  update((s) => {
    const drill = item.split(":")[0];
    const m = (s.study.miss[item] || 0) + (ok ? -1 : 1);
    if (m > 0) s.study.miss[item] = Math.min(m, 3);
    else delete s.study.miss[item];
    const d = todayStr();
    const day = (s.study.days[d] ||= {});
    const [n, r] = day[drill] || [0, 0];
    day[drill] = [n + 1, r + (ok ? 1 : 0)];
    const old = new Date(Date.now() - 60 * 864e5).toLocaleDateString("en-CA");
    for (const k of Object.keys(s.study.days)) if (k < old) delete s.study.days[k];
  });
}

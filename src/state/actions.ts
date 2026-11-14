import { LAST_STEP } from "../data/curriculum";
import { update, todayStr, type AppState, type ArpStatus, type Rot, type ScaleForm } from "./store";

export const setMinutes = (m: number) => update((s) => { s.settings.minutes = m; });

export const setStage = (n: number) => update((s) => { s.settings.stage = n; });

export function markBlock(id: string, done: boolean) {
  update((s) => {
    const d = todayStr();
    if (!s.today || s.today.date !== d) s.today = { date: d, done: {} };
    if (done) s.today.done[id] = true;
    else delete s.today.done[id];
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

export function addLog(entry: { d: string; min: number; note: string; items: string }) {
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

export function setFingering(key: string, form: number, v: string) {
  update((s) => { s.fingerings[`${key}:${form}`] = v.trim(); });
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

/** Tick or untick keys in today's scale or arpeggio rotation. The block is done when all of today's keys are ticked. */
export function setKeysDone(rot: Rot, keys: string[], done: boolean, todayKeys: string[]) {
  update((s) => {
    const d = todayStr();
    rollRotation(s, d);
    const day = s.rot.day!;
    day[rot] = done ? [...new Set([...day[rot], ...keys])] : day[rot].filter((k) => !keys.includes(k));
    if (!s.today || s.today.date !== d) s.today = { date: d, done: {} };
    const id = rot === "scale" ? "warm" : "arp";
    if (todayKeys.every((k) => day[rot].includes(k))) s.today.done[id] = true;
    else delete s.today.done[id];
  });
}

/** Fold an earlier day's ticks into the counts and start a fresh record for today. */
function rollRotation(s: AppState, d: string) {
  const day = s.rot.day;
  if (day && day.d === d) return;
  if (day && day.d < d) {
    (["scale", "arp"] as Rot[]).forEach((r) => day[r].forEach((k) => { s.rot.n[r][k] = (s.rot.n[r][k] || 0) + 1; }));
  }
  s.rot.day = { d, scale: [], arp: [] };
}

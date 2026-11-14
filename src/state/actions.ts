import { update, todayStr, type ArpStatus, type ScaleForm } from "./store";

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

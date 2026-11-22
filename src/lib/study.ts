/* Helpers for Study's self-marking: which items to bring back, and today's counts per drill. */
import { todayStr, type AppState } from "../state/store";

/** Items of a drill with misses still outstanding, most-missed first. `keep` narrows them to the current settings. */
export function weakItems(s: AppState, drill: string, keep: (id: string) => boolean = () => true): string[] {
  return Object.entries(s.study.miss)
    .filter(([id]) => id.startsWith(drill + ":") && keep(id))
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

/** Bring a weak item back about every third card, else a fresh one. Never the item just shown. */
export function chooseItem(weak: string[], fresh: () => string, last?: string): string {
  const w = weak.filter((id) => id !== last);
  if (w.length && Math.random() < 0.35) return w[Math.floor(Math.random() * Math.min(w.length, 5))];
  let id = fresh();
  for (let i = 0; i < 5 && id === last; i++) id = fresh();
  return id;
}

/** [answered, right] today for a drill. */
export function todayCount(s: AppState, drill: string): [number, number] {
  return s.study.days[todayStr()]?.[drill] ?? [0, 0];
}

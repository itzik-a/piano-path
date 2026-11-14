/* Block timer for Today's plan. Lives in memory (not saved), and keeps
   running while you switch tabs. */
import { useSyncExternalStore } from "react";
import { chime, ensureCtx } from "./audio";
import { markBlock } from "../state/actions";

export interface TimerState {
  id: string | null;
  left: number;
  total: number;
  running: boolean;
}

const IDLE: TimerState = { id: null, left: 0, total: 0, running: false };
let t: TimerState = IDLE;
let iv: ReturnType<typeof setInterval> | undefined;
let last = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function tick() {
  const now = performance.now();
  const left = t.left - (now - last) / 1000;
  last = now;
  if (left <= 0) {
    const id = t.id!;
    clearInterval(iv);
    t = IDLE;
    emit();
    chime();
    markBlock(id, true);
    return;
  }
  t = { ...t, left };
  emit();
}

/** Start, pause or resume the timer for a block. Call from a tap. */
export function toggleTimer(id: string, min: number) {
  ensureCtx(); // unlock audio now so the end chime can play
  if (t.id !== id) t = { id, left: min * 60, total: min * 60, running: false };
  clearInterval(iv);
  t = { ...t, running: !t.running };
  if (t.running) {
    last = performance.now();
    iv = setInterval(tick, 250);
  }
  emit();
}

/** Stop the timer and return the block to its full time. */
export function clearTimerFor(id: string) {
  if (t.id !== id) return;
  clearInterval(iv);
  t = IDLE;
  emit();
}

export function useTimer() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => t,
  );
}

/* Keep the screen on while `on` (Screen Wake Lock), asking again when the app comes back to the front.
   Returns whether it's on right now. */
import { useEffect, useState } from "react";

export function useWakeLock(on = true): boolean {
  const [awake, setAwake] = useState(false);
  useEffect(() => {
    if (!on) return;
    let lock: WakeLockSentinel | null = null;
    let live = true;
    const get = async () => {
      if (!("wakeLock" in navigator) || document.visibilityState !== "visible" || (lock && !lock.released)) return;
      try {
        lock = await navigator.wakeLock.request("screen");
        if (!live) { void lock.release(); return; }
        setAwake(true);
        lock.addEventListener("release", () => setAwake(false));
      } catch { setAwake(false); }
    };
    void get();
    const vis = () => { if (live) void get(); };
    document.addEventListener("visibilitychange", vis);
    return () => { live = false; document.removeEventListener("visibilitychange", vis); void lock?.release(); setAwake(false); };
  }, [on]);
  return awake;
}

/* Web Audio helpers. iOS only allows audio after a user tap, so every entry
   point that may play sound calls ensureCtx() from inside a tap handler.
   iOS also mutes web audio when the phone is on Silent, unless the page asks
   for a "playback" audio session (Safari 16.4+), as a music app would. */

let ctx: AudioContext | null = null;

export function ensureCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
      if (session) session.type = "playback";
      ctx = new AC();
    }
    // "suspended" before the first tap; "interrupted" on iOS after a call or Siri.
    if (ctx.state !== "running") void ctx.resume();
  } catch {
    return null;
  }
  return ctx;
}

export function click(c: AudioContext, t: number, accent: boolean) {
  const o = c.createOscillator(), g = c.createGain();
  o.frequency.value = accent ? 1568 : 1046;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? 0.7 : 0.4, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 0.06);
}

export function chime() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  [784, 988, 1175].forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    const s = t + i * 0.15;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.3, s + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.4);
    o.connect(g); g.connect(c.destination);
    o.start(s); o.stop(s + 0.45);
  });
}

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

let noise: AudioBuffer | null = null;

/** Woodblock-style click: a short noise tick for the attack plus a band-passed square-wave body,
    pitched at 2–2.6 kHz, where phone speakers are loudest and the ear most sensitive.
    Levels peak at about 0.9 of full scale (about 10 dB louder than the old sine click on a phone). */
export function click(c: AudioContext, t: number, accent: boolean) {
  const o = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain();
  o.type = "square";
  o.frequency.value = accent ? 2600 : 2000;
  bp.type = "bandpass"; bp.frequency.value = o.frequency.value; bp.Q.value = 1.5;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.52, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (accent ? 0.09 : 0.07));
  o.connect(bp); bp.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + 0.1);

  if (!noise) {
    noise = c.createBuffer(1, Math.round(c.sampleRate * 0.01), c.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  }
  const n = c.createBufferSource(), hp = c.createBiquadFilter(), ng = c.createGain();
  n.buffer = noise;
  hp.type = "highpass"; hp.frequency.value = 3000;
  ng.gain.value = 0.42;
  n.connect(hp); hp.connect(ng); ng.connect(c.destination);
  n.start(t);
}

export function chime() {
  const c = ensureCtx();
  if (!c) return;
  const t = c.currentTime;
  // triangle carries more than a sine on a small speaker, and stays soft-sounding
  [784, 988, 1175].forEach((f, i) => {
    const o = c.createOscillator(), g = c.createGain();
    const s = t + i * 0.15;
    o.type = "triangle";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.9, s + 0.01); // notes barely overlap, so the sum stays under 1
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.4);
    o.connect(g); g.connect(c.destination);
    o.start(s); o.stop(s + 0.45);
  });
}

/* Floating metronome (keeps the screen on while playing): a round bubble at the bottom left (tempo, pulses on each beat while playing)
   that opens a panel with play, tempo controls, beats per bar and tap tempo. */
import { useEffect, useRef, useState } from "react";
import { click, ensureCtx } from "../lib/audio";
import { useWakeLock } from "../lib/wakelock";
import { IconMetronome, IconMinus, IconPause, IconPlay, IconPlus } from "./Icons";
import { Seg } from "./ui";

const PREFS = "pianoPath.metronome";
const clampBpm = (v: number) => Math.max(30, Math.min(220, Math.round(v)));

function loadPrefs(): { bpm: number; beats: number } {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS) || "{}");
    return { bpm: clampBpm(p.bpm || 95), beats: [1, 2, 3, 4].includes(p.beats) ? p.beats : 3 };
  } catch {
    return { bpm: 95, beats: 3 };
  }
}

export function Metronome() {
  const [{ bpm, beats }, setPrefs] = useState(loadPrefs);
  const [on, setOn] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [open, setOpen] = useState(false);
  const [noAudio, setNoAudio] = useState(false);
  const [pulse, setPulse] = useState(0);
  useWakeLock(on); // a locked screen throttles the clicks on iPhone, so keep it on while playing
  const box = useRef<HTMLElement>(null);

  // Scheduler state lives in a ref so tempo changes apply without restarting.
  const r = useRef({ bpm, beats, next: 0, beat: 0, iv: 0 as unknown as ReturnType<typeof setInterval>, taps: [] as number[] });
  r.current.bpm = bpm;
  r.current.beats = beats;

  useEffect(() => { localStorage.setItem(PREFS, JSON.stringify({ bpm, beats })); }, [bpm, beats]);
  useEffect(() => () => clearInterval(r.current.iv), []);

  // Close the panel on a tap outside it or on Escape (the metronome keeps playing).
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", down); document.removeEventListener("keydown", key); };
  }, [open]);

  const setBpm = (v: number) => setPrefs((p) => ({ ...p, bpm: clampBpm(v) }));
  const setBeats = (b: number) => { r.current.beat = 0; setPrefs((p) => ({ ...p, beats: b })); };

  function toggle() {
    const s = r.current;
    if (on) {
      clearInterval(s.iv);
      setOn(false);
      setBeat(-1);
      return;
    }
    const c = ensureCtx();
    if (!c) { setNoAudio(true); return; }
    s.beat = 0;
    s.next = c.currentTime + 0.06;
    const schedule = () => {
      while (s.next < c.currentTime + 0.12) {
        const b = s.beat, when = s.next;
        click(c, when, b === 0 && s.beats > 1);
        setTimeout(() => { setBeat(b); setPulse((n) => n + 1); }, Math.max(0, (when - c.currentTime) * 1000));
        s.beat = (s.beat + 1) % s.beats;
        s.next += 60 / s.bpm;
      }
    };
    s.iv = setInterval(schedule, 25);
    schedule();
    setOn(true);
  }

  function tap() {
    const s = r.current, now = performance.now();
    s.taps = s.taps.filter((t) => now - t < 2500);
    s.taps.push(now);
    if (s.taps.length >= 2) {
      const iv: number[] = [];
      for (let i = 1; i < s.taps.length; i++) iv.push(s.taps[i] - s.taps[i - 1]);
      const recent = iv.slice(-4);
      setBpm(60000 / (recent.reduce((a, b) => a + b, 0) / recent.length));
    }
  }

  const dots = (
    <div className="beats" aria-hidden="true">
      {Array.from({ length: beats }, (_, i) => (
        <i key={i} className={`${i === beat ? "on" : ""} ${i === 0 && beats > 1 ? "accent" : ""}`} />
      ))}
    </div>
  );

  const playBtn = (
    <button type="button" className="play-btn" aria-label={on ? "Stop metronome" : noAudio ? "No audio available" : "Start metronome"} onClick={toggle}>
      {on ? <IconPause /> : <IconPlay />}
    </button>
  );

  return (
    <aside ref={box} className={`metro ${open ? "open" : ""} ${on ? "playing" : ""}`} aria-label="Metronome">
      {open && (
        <div className="metro-panel" id="metro-panel">
          <div className="metro-bar">
            {dots}
            {playBtn}
          </div>
          <div className="metro-tempo">
            <button type="button" className="icon-btn" aria-label="Slower" onClick={() => setBpm(bpm - 1)}><IconMinus /></button>
            <div className="metro-bpm"><output aria-live="polite">{bpm}</output><span>bpm</span></div>
            <button type="button" className="icon-btn" aria-label="Faster" onClick={() => setBpm(bpm + 1)}><IconPlus /></button>
          </div>
          <input type="range" min={30} max={220} value={bpm} aria-label="Tempo in beats per minute" onChange={(e) => setBpm(+e.target.value)} />
          <div className="metro-row">
            <Seg label="Beats per bar" options={[1, 2, 3, 4]} value={beats} onChange={setBeats} />
            <button type="button" className="btn ghost" onClick={tap}>Tap tempo</button>
          </div>
        </div>
      )}
      <button
        type="button" className="metro-bubble" aria-expanded={open} aria-controls="metro-panel"
        aria-label={`Metronome, ${bpm} bpm${on ? ", playing" : ""}. ${open ? "Close" : "Open"} controls.`}
        onClick={() => setOpen(!open)}
      >
        {on && <span key={pulse} className={`metro-pulse ${beat === 0 && beats > 1 ? "down" : ""}`} aria-hidden="true" />}
        <IconMetronome width={20} height={20} />
        <b>{bpm}</b>
      </button>
    </aside>
  );
}

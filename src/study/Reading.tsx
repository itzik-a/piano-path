/* Reading passages: a generated 8-bar piece for two hands, drawn by abcjs (loaded only on this page).
   Read it through, then name each bar's chord and tap the bar's chip to check. */
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { KEYS } from "../data/curriculum";
import { Seg } from "../components/ui";
import { usePref } from "../lib/prefs";
import type { ChordMode } from "../lib/chords";
import { makePassage, toAbc, type Level, type Meter, type Passage } from "../lib/passage";
import { KeyPicker, pick } from "./common";

type ModePick = ChordMode | "both";
const MODES: ModePick[] = ["major", "minor", "both"];
const LEVELS: Level[] = [1, 2, 3, 4];
const METERS: Meter[] = ["3/4", "4/4"];
const LEVEL_TEXT: Record<Level, string> = {
  1: "Melody over held chords.",
  2: "Bass note and chord: a waltz left hand in 3/4, bass–chord–fifth–chord in 4/4.",
  3: "Eighths: Alberti bass in 4/4, broken chords over a tenth in 3/4.",
  4: "As level 3, with secondary dominants and chromatic notes leading up a step.",
};
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export function Reading() {
  const [k, setK] = usePref<string>("pianoPath.rdKey", () => "", (v) => v === "" || KEYS.some((o) => o.k === v));
  const [mode, setMode] = usePref<ModePick>("pianoPath.rdMode", () => "both", (v) => MODES.includes(v as ModePick));
  const [level, setLevel] = usePref<Level>("pianoPath.rdLevel", () => 1, (v) => LEVELS.includes(v as Level));
  const [meter, setMeter] = usePref<Meter>("pianoPath.rdMeter", () => "3/4", (v) => METERS.includes(v as Meter));
  return (
    <section className="card">
      <KeyPicker value={k} onChange={setK} label="Key" any />
      <div className="chord-controls">
        <Seg label="Major or minor" options={MODES} value={mode} onChange={setMode} format={cap} />
        <Seg label="Level" options={LEVELS} value={level} onChange={setLevel} format={(l) => `Level ${l}`} />
        <Seg label="Time" options={METERS} value={meter} onChange={setMeter} />
      </div>
      <p className="muted small">{LEVEL_TEXT[level]}</p>
      <Piece key={[k, mode, level, meter].join("|")} k={k} mode={mode} level={level} meter={meter} />
    </section>
  );
}

function deal(k: string, mode: ModePick, level: Level, meter: Meter): Passage {
  return makePassage(k || pick(KEYS).k, mode === "both" ? pick<ChordMode>(["major", "minor"]) : mode, level, meter);
}

function Piece({ k, mode, level, meter }: { k: string; mode: ModePick; level: Level; meter: Meter }) {
  const [p, setP] = useState(() => deal(k, mode, level, meter));
  const [shown, setShown] = useState<Set<number>>(() => new Set());
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = box.current!;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return;
    let live = true;
    import("abcjs").then((abcjs) => {
      if (!live || !box.current) return;
      const perLine = width < 560 ? 2 : 4;
      abcjs.renderAbc(box.current, toAbc(p, perLine, (b) => shown.has(b)), {
        staffwidth: Math.max(260, width - 12), scale: width < 560 ? 1 : 1.1,
        paddingleft: 6, paddingright: 2, paddingtop: 4, paddingbottom: 4,
        foregroundColor: "currentColor", add_classes: true, responsive: "resize",
        ariaLabel: `Reading passage in ${p.keyName}, ${p.meter}`,
      });
      setReady(true);
    }).catch(() => setFailed(true));
    return () => { live = false; };
  }, [p, shown, width]);

  const toggle = (b: number) => setShown((s) => { const t = new Set(s); if (t.has(b)) t.delete(b); else t.add(b); return t; });
  const all = shown.size === 8;

  return (
    <div className="drill">
      <div className="passage-head">
        <p className="drill-key">in <b>{p.keyName}</b> · {p.meter}</p>
        <button type="button" className="btn ghost" onClick={() => { setP(deal(k, mode, level, meter)); setShown(new Set()); }}>New passage</button>
      </div>
      <div ref={box} className="passage" />
      {!ready && !failed && <p className="muted small">Loading the notation…</p>}
      {failed && <p className="muted small">The notation couldn&apos;t load. Check the connection once; after that it works offline.</p>}
      <div className="analysis">
        <p className="muted small">Name each bar&apos;s chord, then tap its number to check.</p>
        <div className="bar-chips" role="group" aria-label="Chord in each bar">
          {p.chords.map((c, b) => (
            <button key={b} type="button" className={`bar-chip ${shown.has(b) ? "open" : ""}`} onClick={() => toggle(b)}
              aria-label={shown.has(b) ? `Bar ${b + 1}: ${c.numeral}, ${c.name}` : `Bar ${b + 1}: show its chord`}>
              <small>{b + 1}</small>
              <span>{shown.has(b) ? c.numeral : "?"}</span>
            </button>
          ))}
        </div>
        <button type="button" className="btn ghost" onClick={() => setShown(all ? new Set() : new Set(p.chords.map((_, b) => b)))}>
          {all ? "Hide all" : "Show all"}
        </button>
      </div>
    </div>
  );
}

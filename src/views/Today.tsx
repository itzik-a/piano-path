import { useState } from "react";
import { useAppState } from "../state/store";
import { markBlock, setKeysDone } from "../state/actions";
import { arpCount, stageProgress, ticked, todayDone, todaysPlan, type Block } from "../lib/plan";
import { Check, Ring } from "../components/ui";
import { IconChevron, IconExternal } from "../components/Icons";
import { ArpForms } from "../components/ArpForms";
import { PieceProgress } from "../components/PieceProgress";
import { KEYS, pretty } from "../data/curriculum";
import { enharmonic, keyScales } from "../lib/arpeggios";
import type { AppState } from "../state/store";

export function Today() {
  const state = useAppState();
  const [showForms, setShowForms] = useState<string | null>(null);
  const { st, blocks } = todaysPlan(state);
  const done = todayDone(state);
  // Ring counts tickable items: each key in the scale and arpeggio rotations, plus every other block.
  const items = blocks.reduce((a, b) => a + (b.keys ? b.keys.length : 1), 0);
  const tickedItems = blocks.reduce(
    (a, b) => a + (b.rot && b.keys ? ticked(state, b.rot).filter((k) => b.keys!.includes(k)).length : done[b.id] ? 1 : 0), 0,
  );
  const sp = stageProgress(state, st);
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const toggleDone = (b: Block) => {
    const val = !done[b.id];
    if (b.rot && b.keys) setKeysDone(b.rot, b.keys, val, b.keys);
    else markBlock(b.id, val);
  };

  return (
    <>
      <section className="hero card">
        <div className="hero-text">
          <p className="eyebrow">{date}</p>
          <h1 className="display">Stage {st.n}<span className="dim"> · </span>{st.name}</h1>
        </div>
        <Ring value={items ? tickedItems / items : 0} size={96} stroke={9}>
          <b>{tickedItems}</b>
          <span>of {items} done</span>
        </Ring>
        <div className="pills">
          <span className="pill">{sp.d}/{sp.n} stage items</span>
          <span className="pill">Arpeggios {arpCount(state)}/12 solid</span>
        </div>
      </section>

      <section className="card">
        <h2>Today's session</h2>

        <ol className="blocks">
          {blocks.map((b) => {
            const isDone = !!done[b.id];
            return (
              <li key={b.id} className={`block ${isDone ? "done" : ""}`}>
                <Check checked={isDone} label={`Mark ${b.cat} done`} onToggle={() => toggleDone(b)} />
                <div className="block-body">
                  <div className="eyebrow">{b.cat}</div>
                  <div className="block-title">{b.ttl}</div>
                  {b.piece && <PieceProgress id={b.piece} title={b.ttl} showBars />}
                  <p className="block-detail">{b.det}</p>
                  {b.links && (
                    <ul className="links">
                      {b.links.map((l) => (
                        <li key={l.url}>
                          <a className="link" href={l.url} target="_blank" rel="noopener">{l.l} <IconExternal /></a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {b.rot && b.keys && (
                    <KeyRows state={state} block={b} showForms={showForms} setShowForms={setShowForms} />
                  )}
                </div>
                {showForms && b.keys?.includes(showForms) && <div className="block-forms"><ArpForms k={showForms} /></div>}
              </li>
            );
          })}
        </ol>

      </section>

      <p className="footnote">
        Scales and arpeggios cover two keys a day around the circle of fifths (C, G, D, … F). Tick each key when you finish it; a key
        you don't tick comes up first the next day, so none is skipped. Melodic minor shows the way up and comes down natural (with the natural-minor fingering). Fingers are one octave, right hand / left hand, with thumbs highlighted: over more octaves, keep the thumbs on the same notes and only the very top (RH) and bottom (LH) note takes the 4 or 5. The étude and new piece are the first unchecked items in your
        current stage, so ticking them off on the Path tab moves today's plan forward. (The étude is hidden for now.) Everything you tick
        is added to today's entry in the Log automatically.
      </p>
    </>
  );
}

/** Notes with the right- and left-hand finger under each one; thumbs are highlighted to show the crossings. */
function ScaleFingering({ notes, rh, lh }: { notes: string[]; rh: string[]; lh: string[] }) {
  const said = notes.map((x, i) => `${x} RH ${rh[i]} LH ${lh[i]}`).join(", ");
  const row = (h: string, fs: string[]) => [
    <span key={h} className="sf-h">{h}</span>,
    ...fs.map((d, i) => <span key={h + i} className={d === "1" ? "sf-f thumb" : "sf-f"}>{d}</span>),
  ];
  return (
    <div className="sf" role="img" aria-label={said}>
      <span className="sf-h" />
      {notes.map((x, i) => {
        const e = enharmonic(x);
        return <span key={i} className="sf-n">{x}{e && <small>={e}</small>}</span>;
      })}
      {row("RH", rh)}
      {row("LH", lh)}
    </div>
  );
}

/** One row per key in the scale or arpeggio block, each with its own tick. */
function KeyRows({ state, block, showForms, setShowForms }: {
  state: AppState; block: Block; showForms: string | null; setShowForms: (k: string | null) => void;
}) {
  const rot = block.rot!, keys = block.keys!;
  const done = ticked(state, rot);
  return (
    <ul className="key-rows">
      {keys.map((k) => {
        const info = KEYS.find((o) => o.k === k)!;
        const isDone = done.includes(k);
        const sc = state.scales[k] || { maj: 95, nat: 95, harm: 0, mel: 0 };
        return (
          <li key={k} className={`key-row ${isDone ? "done" : ""}`}>
            <Check checked={isDone} label={`Mark ${pretty(k)} done`} onToggle={() => setKeysDone(rot, [k], !isDone, keys)} />
            <div className="key-row-body">
              <div className="key-row-title">
                {rot === "scale" ? `${pretty(k)} major / ${info.m} minor` : `${pretty(k)} major`}
                {rot === "arp" && state.arps[k] !== "solid" && <span className="key-row-tag">hands separately</span>}
              </div>
              {rot === "scale" ? (
                <ol className="quick-forms scale-list">
                  {keyScales(k).map((x) => (
                    <li key={x.f}>
                      <span className="qf-name">{x.minor ? `${info.m} ` : `${pretty(k)} `}{x.l.toLowerCase()} <small>{sc[x.f] || 80}</small></span>
                      <ScaleFingering notes={x.notes} rh={x.rh} lh={x.lh} />
                    </li>
                  ))}
                </ol>
              ) : (
                <button type="button" className="disclose" aria-expanded={showForms === k} onClick={() => setShowForms(showForms === k ? null : k)}>
                  {showForms === k ? "Hide" : "Show"} the 11 forms in {pretty(k)}
                  <IconChevron width={16} height={16} />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

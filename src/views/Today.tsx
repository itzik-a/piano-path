import { useState } from "react";
import { useAppState } from "../state/store";
import { markBlock, setKeysDone, setMinutes } from "../state/actions";
import { arpCount, fmt, stageProgress, ticked, todayDone, todaysPlan, type Block } from "../lib/plan";
import { clearTimerFor, toggleTimer, useTimer } from "../lib/timer";
import { Check, Ring, Seg } from "../components/ui";
import { IconChevron, IconExternal, IconPause, IconPlay, IconReset } from "../components/Icons";
import { ArpForms } from "../components/ArpForms";
import { PieceProgress } from "../components/PieceProgress";
import { KEYS, pretty } from "../data/curriculum";
import { enharmonic, keyScales } from "../lib/arpeggios";
import type { AppState } from "../state/store";

export function Today({ onLog }: { onLog: (prefill: { min: number; items: string }) => void }) {
  const state = useAppState();
  const timer = useTimer();
  const [showForms, setShowForms] = useState<string | null>(null);
  const { st, blocks, total } = todaysPlan(state);
  const done = todayDone(state);
  const doneMin = blocks.filter((b) => done[b.id]).reduce((a, b) => a + b.min, 0);
  const sp = stageProgress(state, st);
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const toggleDone = (b: Block) => {
    const val = !done[b.id];
    if (val) clearTimerFor(b.id);
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
        <Ring value={total ? doneMin / total : 0} size={96} stroke={9}>
          <b>{doneMin}</b>
          <span>of {total} min</span>
        </Ring>
        <div className="pills">
          <span className="pill">{sp.d}/{sp.n} stage items</span>
          <span className="pill">Arpeggios {arpCount(state)}/12 solid</span>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Today's session</h2>
          <Seg label="Practice length (minutes)" options={[30, 45, 60, 90]} value={state.settings.minutes} onChange={setMinutes} format={(m) => `${m}′`} />
        </div>

        <ol className="blocks">
          {blocks.map((b) => {
            const active = timer.id === b.id;
            const isDone = !!done[b.id];
            return (
              <li key={b.id} className={`block ${isDone ? "done" : ""} ${active ? "active" : ""}`}>
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
                <div className="block-side">
                  <span className={active ? "timer" : "mins"}>{active ? fmt(timer.left) : `${b.min} min`}</span>
                  {!isDone && (
                    <button
                      type="button"
                      className={`icon-btn ${active && timer.running ? "on" : ""}`}
                      aria-label={`${active && timer.running ? "Pause" : active ? "Resume" : "Start"} ${b.cat} timer`}
                      onClick={() => toggleTimer(b.id, b.min)}
                    >
                      {active && timer.running ? <IconPause width={18} height={18} /> : <IconPlay width={18} height={18} />}
                    </button>
                  )}
                  {active && (
                    <button type="button" className="icon-btn" aria-label={`Reset ${b.cat} timer`} title="Reset timer" onClick={() => clearTimerFor(b.id)}>
                      <IconReset width={18} height={18} />
                    </button>
                  )}
                </div>
                {showForms && b.keys?.includes(showForms) && <div className="block-forms"><ArpForms k={showForms} /></div>}
                {active && <div className="block-progress" style={{ width: `${(1 - timer.left / timer.total) * 100}%` }} />}
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          className="btn primary block-btn"
          onClick={() => onLog({ min: doneMin || total, items: blocks.filter((b) => done[b.id]).map((b) => b.ttl).join(" · ") })}
        >
          Log this session
        </button>
      </section>

      <p className="footnote">
        Scales and arpeggios cover two keys a day around the circle of fifths (C, G, D, … F). Tick each key when you finish it; a key
        you don't tick comes up first the next day, so none is skipped. Melodic minor shows the way up and comes down natural. The étude and new piece are the first unchecked items in your
        current stage, so ticking them off on the Path tab moves today's plan forward. (The étude is hidden for now.)
      </p>
    </>
  );
}

const n = (x: string) => {
  const e = enharmonic(x);
  return e ? `${x} (=${e})` : x;
};

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
                      <span className="qf-notes">{x.notes.map(n).join(" ")}</span>
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

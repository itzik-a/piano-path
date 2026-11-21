import { useState } from "react";
import { useAppState } from "../state/store";
import { markBlock, setKeysDone } from "../state/actions";
import { ticked, todayDone, todaysPlan, type Block } from "../lib/plan";
import { Check } from "../components/ui";
import { IconChevron } from "../components/Icons";
import { ArpForms } from "../components/ArpForms";
import { ChordView } from "../components/ChordView";
import { PieceProgress } from "../components/PieceProgress";
import { KEYS, chordItem, pretty } from "../data/curriculum";
import { keyScales } from "../lib/arpeggios";
import { Fingering } from "../components/Fingering";
import type { AppState, Rot } from "../state/store";

/** Blocks folded shut by tapping their title; kept on this device (not synced) until opened again. */
const COLLAPSED_KEY = "pianoPath.collapsed";
const readCollapsed = (): string[] => {
  try { const v = JSON.parse(localStorage.getItem(COLLAPSED_KEY) || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
};

export function Today() {
  const state = useAppState();
  const [collapsed, setCollapsed] = useState<string[]>(readCollapsed);
  const toggleOpen = (id: string) => {
    const next = collapsed.includes(id) ? collapsed.filter((x) => x !== id) : [...collapsed, id];
    setCollapsed(next);
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify(next));
  };
  const { blocks } = todaysPlan(state);
  const done = todayDone(state);
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const toggleDone = (b: Block) => {
    const val = !done[b.id];
    if (b.rot && b.keys) setKeysDone(b.rot, b.keys, val, b.keys);
    else markBlock(b.id, val);
  };

  return (
    <>
      <header className="page-head">
        <h1 className="display">{date}</h1>
      </header>

      <ol className="blocks">
        {blocks.map((b) => {
          const isDone = !!done[b.id];
          const open = !collapsed.includes(b.id);
          const one = b.rot && b.keys?.length === 1 ? b.keys[0] : null;
          return (
            <li key={b.id} className={`block ${isDone ? "done" : ""} ${open ? "" : "collapsed"}`}>
              <Check checked={isDone} label={`Mark ${b.cat} done`} onToggle={() => toggleDone(b)} />
              <button type="button" className="block-head" aria-expanded={open} aria-controls={`block-${b.id}`} onClick={() => toggleOpen(b.id)}>
                <span className="eyebrow">{b.cat}</span>
                <span className="block-title">{b.ttl}</span>
                <IconChevron className="block-chevron" width={20} height={20} aria-hidden="true" />
              </button>
              {open && (
                <div className="block-more" id={`block-${b.id}`}>
                  {b.piece && <PieceProgress id={b.piece} title={b.ttl} showBars />}
                  <p className="block-detail">{b.det}</p>
                  {/* One key today: the block's tick is the key's tick, so its content sits right here */}
                  {one && <KeyContent rot={b.rot!} k={one} />}
                  {b.rot && b.keys && !one && <KeyRows state={state} block={b} />}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** One row per key in a rotation block (scales, arpeggios, chords), each with its own tick. */
function KeyRows({ state, block }: { state: AppState; block: Block }) {
  const rot = block.rot!, keys = block.keys!;
  const done = ticked(state, rot);
  return (
    <ul className="key-rows">
      {keys.map((k) => {
        const chord = rot === "chord" ? chordItem(k) : null;
        const info = KEYS.find((o) => o.k === (chord ? chord.k : k))!;
        const isDone = done.includes(k);
        return (
          <li key={k} className={`key-row ${isDone ? "done" : ""}`}>
            <Check checked={isDone} label={`Mark ${chord ? chord.name : pretty(k)} done`} onToggle={() => setKeysDone(rot, [k], !isDone, keys)} />
            <div className="key-row-title">
              {chord ? chord.name : rot === "arp" ? `${pretty(k)} major` : `${pretty(k)} major / ${info.m} minor`}
              {rot === "arp" && state.arps[k] !== "solid" && <span className="key-row-tag">hands separately</span>}
            </div>
            <div className="key-row-more">
              <KeyContent rot={rot} k={k} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** A rotation key's content, always shown: the scales with fingering, the day's chords, or the 11 arpeggio forms. */
function KeyContent({ rot, k }: { rot: Rot; k: string }) {
  if (rot === "chord") {
    const c = chordItem(k);
    return <div className="key-forms"><ChordView k={c.k} only={c.mode} /></div>;
  }
  if (rot === "arp") return <div className="key-forms"><ArpForms k={k} /></div>;
  const info = KEYS.find((o) => o.k === k)!;
  return (
    <ol className="quick-forms scale-list">
      {keyScales(k).map((x) => (
        <li key={x.f}>
          <span className="qf-name">{x.minor ? `${info.m} ` : `${pretty(k)} `}{x.l.toLowerCase()}</span>
          <Fingering notes={x.notes} rh={x.rh} lh={x.lh} />
        </li>
      ))}
    </ol>
  );
}

/* Key signatures, timed: name the key from a signature, or pick the signature for a named key.
   A round is the twelve signatures once each, shuffled. A right first answer moves on by itself;
   after a miss the answer stays up until you tap Next. */
import { useEffect, useRef, useState } from "react";
import { KEYS, pretty } from "../data/curriculum";
import { Staff } from "../components/Staff";
import { Seg } from "../components/ui";
import { usePref } from "../lib/prefs";
import { keySignature, type Clef } from "../lib/notation";
import { recordAnswer } from "../state/actions";
import { pick, secs, shuffle } from "./common";

type Ask = "name" | "find";
type ClefPick = Clef | "both";
const ASKS: Ask[] = ["name", "find"];
const CLEF_PICKS: ClefPick[] = ["treble", "bass", "both"];
const ASK_LABEL: Record<Ask, string> = { name: "Name the key", find: "Find the signature" };
const GOAL_MS = 2000;

/** `retry`: a missed key asked again at the end of the round (not counted in the round's score) */
interface Card { k: string; minor: boolean; clef: Clef; retry?: boolean }
interface Result { k: string; minor: boolean; ms: number; first: boolean }

const sigLabel = (k: string) => {
  const s = keySignature(k);
  return s.count ? `${s.count}${s.acc}` : "0";
};
/** "3♭: B♭ E♭ A♭" */
const sigText = (k: string) => {
  const s = keySignature(k);
  if (!s.count) return "no sharps or flats";
  const order = s.acc === "♯" ? "FCGDAEB" : "BEADGCF";
  return `${s.count}${s.acc}: ${[...order.slice(0, s.count)].map((l) => l + s.acc).join(" ")}`;
};
const SIG_OPTIONS = ["0", "1♯", "2♯", "3♯", "4♯", "5♯", "6♯", "1♭", "2♭", "3♭", "4♭", "5♭"];
const keyName = (k: string, minor: boolean) => (minor ? `${KEYS.find((o) => o.k === k)!.m} minor` : `${pretty(k)} major`);
const both = (k: string) => `${pretty(k)} major / ${KEYS.find((o) => o.k === k)!.m} minor`;

function deal(clef: ClefPick): Card[] {
  return shuffle(KEYS).map((o) => ({ k: o.k, minor: Math.random() < 0.5, clef: clef === "both" ? pick<Clef>(["treble", "bass"]) : clef }));
}

export function KeySigDrill() {
  const [ask, setAsk] = usePref<Ask>("pianoPath.ksAsk", () => "name", (v) => ASKS.includes(v as Ask));
  const [clef, setClef] = usePref<ClefPick>("pianoPath.ksClef", () => "both", (v) => CLEF_PICKS.includes(v as ClefPick));
  return (
    <section className="card">
      <div className="chord-controls">
        <Seg label="Question" options={ASKS} value={ask} onChange={setAsk} format={(a) => ASK_LABEL[a]} />
        <Seg label="Clef" options={CLEF_PICKS} value={clef} onChange={setClef} format={(c) => c[0].toUpperCase() + c.slice(1)} />
      </div>
      <Round key={ask + clef} ask={ask} clef={clef} />
    </section>
  );
}

function Round({ ask, clef }: { ask: Ask; clef: ClefPick }) {
  const [cards, setCards] = useState(() => deal(clef));
  const [i, setI] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [answered, setAnswered] = useState<number | null>(null); // ms, once right
  const [results, setResults] = useState<Result[]>([]);
  const start = useRef(performance.now());
  useEffect(() => { start.current = performance.now(); }, [i, cards]);

  const card = cards[i];
  const right = card && (ask === "name" ? card.k : sigLabel(card.k));
  const next = () => { setI((x) => x + 1); setWrong([]); setAnswered(null); };

  // a right first answer moves on by itself
  useEffect(() => {
    if (answered === null || wrong.length) return;
    const t = setTimeout(next, 900);
    return () => clearTimeout(t);
  }, [answered, wrong.length]);

  const answer = (v: string) => {
    if (answered !== null || wrong.includes(v)) return;
    if (v !== right) { setWrong([...wrong, v]); return; }
    const ms = performance.now() - start.current;
    const first = wrong.length === 0;
    setAnswered(ms);
    recordAnswer(`keys:${card.k}`, first);
    if (card.retry) return;
    setResults([...results, { k: card.k, minor: card.minor, ms, first }]);
    if (!first) setCards([...cards, { ...card, minor: !card.minor, retry: true }]);
  };

  if (!card) {
    const first = results.filter((r) => r.first).length;
    const fast = results.filter((r) => r.first && r.ms < GOAL_MS).length;
    const avg = results.reduce((a, r) => a + r.ms, 0) / results.length;
    const slow = [...results].sort((a, b) => b.ms - a.ms).slice(0, 3);
    const missed = results.filter((r) => !r.first);
    return (
      <div className="drill-done">
        <p className="drill-score"><b>{first}</b> of 12 right first time · <b>{fast}</b> under 2 s · average {secs(avg)}</p>
        {missed.length > 0 && <p className="muted small">Missed: {missed.map((r) => both(r.k)).join(", ")}</p>}
        <p className="muted small">Slowest: {slow.map((r) => `${ask === "name" ? both(r.k) : keyName(r.k, r.minor)} (${secs(r.ms)})`).join(", ")}</p>
        <button type="button" className="btn primary" onClick={() => { setCards(deal(clef)); setI(0); setResults([]); setWrong([]); setAnswered(null); }}>Another round</button>
      </div>
    );
  }

  const sig = keySignature(card.k);
  const options = ask === "name" ? KEYS.map((o) => o.k) : SIG_OPTIONS;
  return (
    <div className="drill">
      <div className="drill-progress muted small">{card.retry ? "Again" : `${i + 1} of 12`}</div>
      <div className="drill-prompt">
        {ask === "name"
          ? <Staff clefs={[card.clef]} sig={sig} columns={[]} label={`A key signature on the ${card.clef} staff`} maxScale={2.2} center />
          : <p className="drill-question">{keyName(card.k, card.minor)}</p>}
      </div>
      <div className={`answers ${ask}`} role="group" aria-label={ask === "name" ? "Which key?" : "How many sharps or flats?"}>
        {options.map((o) => {
          const state = answered !== null && o === right ? "right" : wrong.includes(o) ? "wrong" : "";
          const info = KEYS.find((x) => x.k === o);
          return (
            <button
              key={o} type="button" className={`answer ${state}`} disabled={wrong.includes(o)} onClick={() => answer(o)}
              aria-label={ask === "name" ? both(o) : o === "0" ? "No sharps or flats" : `${o[0]} ${o[1] === "♯" ? "sharp" : "flat"}${o[0] === "1" ? "" : "s"}`}
            >
              {ask === "name" ? <>{pretty(o)}<small>{info!.m}m</small></> : o}
            </button>
          );
        })}
      </div>
      <div className="drill-feedback" aria-live="polite">
        {answered !== null && (
          <>
            {ask === "find" && <Staff clefs={[card.clef]} sig={sig} columns={[]} label={`The signature of ${keyName(card.k, card.minor)}`} maxScale={1.6} center />}
            <p><b>{both(card.k)}</b> · {sigText(card.k)} · <span className={answered < GOAL_MS && !wrong.length ? "good-text nowrap" : "nowrap"}>{secs(answered)}</span></p>
            {wrong.length > 0 && <button type="button" className="btn primary" onClick={next}>Next</button>}
          </>
        )}
      </div>
    </div>
  );
}

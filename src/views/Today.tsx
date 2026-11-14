import { useAppState } from "../state/store";
import { markBlock, setMinutes } from "../state/actions";
import { arpCount, fmt, stageProgress, todayDone, todaysPlan } from "../lib/plan";
import { clearTimerFor, toggleTimer, useTimer } from "../lib/timer";
import { Check, Ring, Seg } from "../components/ui";
import { IconPause, IconPlay } from "../components/Icons";

export function Today({ onLog }: { onLog: (prefill: { min: number; items: string }) => void }) {
  const state = useAppState();
  const timer = useTimer();
  const { st, blocks, total } = todaysPlan(state);
  const done = todayDone(state);
  const doneMin = blocks.filter((b) => done[b.id]).reduce((a, b) => a + b.min, 0);
  const sp = stageProgress(state, st);
  const date = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const toggleDone = (id: string) => {
    const val = !done[id];
    if (val) clearTimerFor(id);
    markBlock(id, val);
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
                <Check checked={isDone} label={`Mark ${b.cat} done`} onToggle={() => toggleDone(b.id)} />
                <div className="block-body">
                  <div className="eyebrow">{b.cat}</div>
                  <div className="block-title">{b.ttl}</div>
                  <p className="block-detail">{b.det}</p>
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
                </div>
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
        The scale key rotates daily around the circle of fifths. The étude and new piece are the first unchecked items in your
        current stage, so ticking them off on the Path tab moves today's plan forward.
      </p>
    </>
  );
}

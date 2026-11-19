import { useState, type FormEvent } from "react";
import { todayStr, useAppState, type LogEntry } from "../state/store";
import { addLog, deleteLog } from "../state/actions";
import { IconTrash } from "../components/Icons";

const ROT_CATS = ["Scales", "Chords", "Russian arpeggios"];

/** Items in an entry: `n` when saved; older auto entries are counted from their text
    (each key in a rotation, one per other block); an entry added by hand counts as one. */
export function itemCount(e: LogEntry): number {
  if (typeof e.n === "number") return e.n;
  if (!e.auto || !e.items) return e.auto ? 0 : 1;
  return e.items.split(" · ").reduce((a, part) => {
    const i = part.indexOf(": ");
    return a + (ROT_CATS.includes(part.slice(0, i)) ? part.slice(i + 2).split(", ").length : 1);
  }, 0);
}

function Chart({ days }: { days: { k: string; v: number; l: string }[] }) {
  const max = Math.max(4, ...days.map((d) => d.v));
  const CW = 420, CH = 140, GUTTER = 26, bw = (CW - GUTTER) / days.length;
  return (
    <svg className="chart" viewBox={`0 0 ${CW} ${CH + 22}`} role="img" aria-label="Items practised, last 14 days">
      {[0, 0.5, 1].map((f) => {
        const y = CH - f * (CH - 16);
        return (
          <g key={f}>
            <line x1={0} x2={CW} y1={y} y2={y} stroke="var(--line)" strokeDasharray={f ? "3 4" : undefined} />
            {f > 0 && <text x={CW} y={y - 4} textAnchor="end" fontSize={10} fill="var(--muted)">{Math.round(max * f)}</text>}
          </g>
        );
      })}
      {days.map((d, i) => {
        const h = d.v ? Math.max(4, (d.v / max) * (CH - 16)) : 0;
        const last = i === days.length - 1;
        return (
          <g key={d.k}>
            <title>{`${d.k}: ${d.v} ${d.v === 1 ? "item" : "items"}`}</title>
            <rect x={i * bw + bw * 0.22} y={CH - h} width={bw * 0.56} height={h} rx={5} fill="var(--accent)" opacity={last ? 1 : 0.38} />
            <text x={i * bw + bw / 2} y={CH + 16} textAnchor="middle" fontSize={10} fontWeight={last ? 700 : 400} fill={last ? "var(--ink)" : "var(--muted)"}>{d.l}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Log() {
  const state = useAppState();
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState("");

  const byDay: Record<string, number> = {};
  state.log.forEach((e) => { byDay[e.d] = (byDay[e.d] || 0) + itemCount(e); });

  const days = [];
  for (let i = 13; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i);
    const k = dt.toLocaleDateString("en-CA");
    days.push({ k, v: byDay[k] || 0, l: dt.toLocaleDateString(undefined, { weekday: "narrow" }) });
  }
  let streak = 0;
  {
    const dt = new Date();
    if (!byDay[todayStr()]) dt.setDate(dt.getDate() - 1);
    while (byDay[dt.toLocaleDateString("en-CA")]) { streak++; dt.setDate(dt.getDate() - 1); }
  }
  const week = days.slice(7).reduce((a, b) => a + b.v, 0);
  const practised = Object.values(byDay).filter((v) => v > 0).length;
  const sorted = state.log.filter((e) => !e.auto || e.items).slice().sort((a, b) => b.d.localeCompare(a.d) || (b.ts || 0) - (a.ts || 0));

  function submit(ev: FormEvent) {
    ev.preventDefault();
    if (!note.trim()) return;
    addLog({ d: date || todayStr(), note: note.trim(), items: "" });
    setNote("");
  }

  return (
    <>
      <header className="page-head">
        <h1 className="display">Practice log</h1>
      </header>

      <section className="stats">
        <div className="stat"><b>{streak}</b><span>day streak</span></div>
        <div className="stat"><b>{week}</b><span>items this week</span></div>
        <div className="stat"><b>{practised}</b><span>days practised</span></div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Last 14 days</h2></div>
        <Chart days={days} />
      </section>

      <section className="card">
        <h2>Add a session</h2>
        <p className="muted small">Ticks on Today are logged automatically. Use this for practice outside the plan; it counts as one item.</p>
        <form className="form" onSubmit={submit}>
          <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          <label>What you practised, what went well, what to fix next time
            <textarea value={note} onChange={(e) => setNote(e.target.value)} required placeholder="e.g. Op. 69 No. 2 bars 17–24 cleaner; F♯ arpeggio left hand still uneven" />
          </label>
          <button className="btn primary block-btn" type="submit">Save session</button>
        </form>
      </section>

      <section className="card">
        <h2>Sessions</h2>
        {sorted.length ? (
          <ul className="entries">
            {sorted.slice(0, 60).map((e) => (
              <li key={e.ts} className="entry">
                <div className="entry-head">
                  <span className="entry-date">{new Date(e.d + "T12:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span className="tag">{e.auto ? `${itemCount(e)} ${itemCount(e) === 1 ? "item" : "items"}` : "Extra"}</span>
                  <button type="button" className="icon-btn subtle" aria-label="Delete this session" onClick={() => { if (confirm("Delete this session?")) deleteLog(e.ts); }}>
                    <IconTrash />
                  </button>
                </div>
                {e.items && <p className="entry-items">{e.items}</p>}
                {e.note && <p className="entry-note">{e.note}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">No sessions yet. Tick items on Today and they appear here, or add one above.</p>
        )}
      </section>
    </>
  );
}

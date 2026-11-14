import { useState, type FormEvent } from "react";
import { todayStr, useAppState } from "../state/store";
import { addLog, deleteLog } from "../state/actions";
import { IconTrash } from "../components/Icons";

function Chart({ days }: { days: { k: string; v: number; l: string }[] }) {
  const max = Math.max(60, ...days.map((d) => d.v));
  const CW = 420, CH = 140, GUTTER = 26, bw = (CW - GUTTER) / days.length;
  return (
    <svg className="chart" viewBox={`0 0 ${CW} ${CH + 22}`} role="img" aria-label="Minutes practised, last 14 days">
      {[0, 0.5, 1].map((f) => {
        const y = CH - f * (CH - 16);
        return (
          <g key={f}>
            <line x1={0} x2={CW} y1={y} y2={y} stroke="var(--line)" strokeDasharray={f ? "3 4" : undefined} />
            {f > 0 && <text x={CW} y={y - 4} textAnchor="end" fontSize={10} fill="var(--muted)">{Math.round(max * f)}′</text>}
          </g>
        );
      })}
      {days.map((d, i) => {
        const h = d.v ? Math.max(4, (d.v / max) * (CH - 16)) : 0;
        const last = i === days.length - 1;
        return (
          <g key={d.k}>
            <title>{`${d.k}: ${d.v} min`}</title>
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
  const [min, setMin] = useState(String(state.settings.minutes));
  const [note, setNote] = useState("");

  const byDay: Record<string, number> = {};
  state.log.forEach((e) => { byDay[e.d] = (byDay[e.d] || 0) + (+e.min || 0); });

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
  const total = state.log.reduce((a, e) => a + (+e.min || 0), 0);
  const sorted = state.log.filter((e) => !e.auto || e.min || e.items).slice().sort((a, b) => b.d.localeCompare(a.d) || (b.ts || 0) - (a.ts || 0));

  function submit(ev: FormEvent) {
    ev.preventDefault();
    addLog({ d: date || todayStr(), min: Math.max(1, parseInt(min, 10) || 0), note: note.trim(), items: "" });
    setNote("");
    setMin(String(state.settings.minutes));
  }

  return (
    <>
      <header className="page-head">
        <h1 className="display">Practice log</h1>
      </header>

      <section className="stats">
        <div className="stat"><b>{streak}</b><span>day streak</span></div>
        <div className="stat"><b>{week}</b><span>min this week</span></div>
        <div className="stat"><b>{(total / 60).toFixed(1)}</b><span>hours total</span></div>
      </section>

      <section className="card">
        <div className="card-head"><h2>Last 14 days</h2></div>
        <Chart days={days} />
      </section>

      <section className="card">
        <h2>Add a session</h2>
        <p className="muted small">Ticks on Today are logged automatically. Use this for practice outside the plan.</p>
        <form className="form" onSubmit={submit}>
          <div className="form-row">
            <label>Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
            <label>Minutes<input type="number" inputMode="numeric" min={1} max={600} value={min} onChange={(e) => setMin(e.target.value)} required /></label>
          </div>
          <label>What went well, what to fix next time
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Op. 69 No. 2 bars 17–24 cleaner; F♯ arpeggio left hand still uneven" />
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
                  <span className="tag">{e.min} min</span>
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

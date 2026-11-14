import { useState } from "react";
import { CAT, STAGES, imslp, maintained, type Category } from "../data/curriculum";
import { useAppState } from "../state/store";
import { setStage, toggleItem, togglePiece } from "../state/actions";
import { PieceProgress } from "../components/PieceProgress";
import { stageProgress } from "../lib/plan";
import { Bar, Check } from "../components/ui";
import { IconChevron, IconExternal } from "../components/Icons";

const ORDER: Category[] = ["T", "E", "R", "H", "S"];

export function Path({ go }: { go: (v: string) => void }) {
  const state = useAppState();
  const cur = state.settings.stage;
  const keep = maintained(state.checks);
  const [open, setOpen] = useState<Record<number, boolean>>({ [cur]: true });

  return (
    <>
      <header className="page-head">
        <h1 className="display">Your path</h1>
        <p className="muted">Four stages from late beginner toward advanced repertoire.</p>
      </header>

      <ol className="stages">
        {STAGES.map((st) => {
          const sp = stageProgress(state, st);
          const isCur = st.n === cur;
          const isOpen = !!open[st.n];
          return (
            <li key={st.n} className={`card stage ${isCur ? "current" : ""}`}>
              <button type="button" className="stage-toggle" aria-expanded={isOpen} onClick={() => setOpen({ ...open, [st.n]: !isOpen })}>
                <span className={`stage-num ${sp.p === 1 ? "complete" : ""}`}>{st.n}</span>
                <span className="stage-title">
                  <span className="stage-name">{st.name}</span>
                  <span className="stage-meta">
                    {isCur && <span className="tag accent">Current</span>}
                    {!isCur && sp.p === 1 && <span className="tag good">Complete</span>}
                    <span>{st.span}</span>
                    <span>·</span>
                    <span>{sp.d}/{sp.n}</span>
                  </span>
                </span>
                <IconChevron className="chev" />
              </button>
              <Bar value={sp.p} label={`Stage ${st.n}: ${Math.round(sp.p * 100)}% complete`} />

              {isOpen && (
                <div className="stage-body">
                  <p className="muted">{st.focus}</p>
                  <div className="criteria">
                    <div className="eyebrow">Ready to move on when</div>
                    <ul>{st.criteria.map((c) => <li key={c}>{c}</li>)}</ul>
                  </div>

                  {ORDER.map((c) => {
                    const its = st.items.filter((i) => i.c === c);
                    if (!its.length) return null;
                    return (
                      <div key={c} className="group">
                        <div className="eyebrow">{CAT[c]}</div>
                        <ul className="items">
                          {its.map((i) => (
                            <li key={i.id} className={`item ${state.checks[i.id] ? "on" : ""}`}>
                              <Check checked={!!state.checks[i.id]} label={`Done: ${i.t}`} onToggle={() => (i.c === "R" ? togglePiece(i.id, !!state.checks[i.id]) : toggleItem(i.id))} />
                              <div>
                                <div className="item-title">{i.t}</div>
                                {i.d && <p className="item-detail">{i.d}</p>}
                                {i.c === "R" && <PieceProgress id={i.id} title={i.t} />}
                                {i.q && (
                                  <a className="link" href={imslp(i.q)} target="_blank" rel="noopener">
                                    Free score on IMSLP <IconExternal />
                                  </a>
                                )}
                                {i.links && (
                                  <ul className="links">
                                    {i.links.map((l) => (
                                      <li key={l.url}>
                                        <a className="link" href={l.url} target="_blank" rel="noopener">{l.l} <IconExternal /></a>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}

                  <div className="stage-actions">
                    {isCur
                      ? st.n < STAGES.length && (
                        <button type="button" className="btn" onClick={() => { setStage(st.n + 1); go("today"); }}>Move to Stage {st.n + 1}</button>
                      )
                      : <button type="button" className="btn" onClick={() => { setStage(st.n); go("today"); }}>Make this my current stage</button>}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <section className="card">
        <h2>Always in your hands</h2>
        <ul className="items">
          {keep.map((m) => (
            <li key={m.t} className="item plain">
              <div>
                <div className="item-title">{m.t}</div>
                <p className="item-detail">{keep.length > 1 ? `One of ${keep.length} pieces that take turns, a different one each day,` : "Played every day"} in the Keep up block.</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

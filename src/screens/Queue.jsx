import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { RiskBadge, Why } from "../lib/ui.jsx";
import { queueAction } from "./actions.js";

export default function Queue() {
  const store = useStore();
  const { db } = store;
  const q = db.queue;
  const [filter, setFilter] = useState("All");
  return (
    <div className="view view--wide">
      <header className="view__head"><h1 className="view__title">Action Queue</h1>
        <div className="segmented">{q.filters.map((f) => (
          <button key={f} className={"seg" + (filter === f ? " is-active" : "")} onClick={() => setFilter(f)}>{f}</button>))}</div>
      </header>
      <div className="kanban">{q.columns.map((col) => {
        const cards = filter === "All" ? col.cards : col.cards.filter((c) => c.lane === filter);
        return (
          <div className="kcol" key={col.id} data-col={col.id}>
            <h3 className="kcol__title"><RiskBadge r={col.risk} /> {col.title} <span className="badge">{cards.length}</span></h3>
            {cards.map((c) => (
              <article className={"kcard" + (col.id === "done" ? " kcard--done" : "")} key={c.id}>
                <p className="kcard__title">{c.title}</p>
                <p className="kcard__meta">
                  {c.agent && c.agent + " · "}
                  {c.sla && <span className="sla">{c.sla}</span>}
                  {c.meta && <span className="muted">{c.meta}</span>}
                  {c.why && <Why text={c.why} />}
                </p>
                {c.preview && <p className="kcard__preview">{c.preview}</p>}
                {c.actions && (
                  <div className="kcard__actions">{c.actions.map((a) => (
                    <button key={a} className={"btn btn--sm " + (a.length > 2 ? "btn--primary" : "btn--ghost")}
                      onClick={() => queueAction(store, a, c.id)}>{a}</button>))}</div>
                )}
              </article>
            ))}
          </div>
        );
      })}</div>
    </div>
  );
}

import { useStore } from "../store/store.jsx";
import { openMinionBuilder } from "./minionBuilder.jsx";
import { openSupervisorBuilder } from "./supervisorBuilder.jsx";

/** All minions across the team — browse, edit, or add a new one. */
export default function MinionsHub() {
  const store = useStore();
  const { db } = store;
  const hub = db.minionHub || {};
  const supervisors = db.supervisors || [];
  const total = Object.values(hub).reduce((s, l) => s + l.length, 0);

  return (
    <div className="view view--wide">
      <header className="view__head">
        <div><h1 className="view__title">🤖 Minions</h1>
          <p className="muted">{total} minions · {supervisors.length} supervisor AIs · each runs an editable logic flow you can inspect and tune.</p></div>
        <div className="view__actions">
          <button className="btn btn--ghost" onClick={() => openSupervisorBuilder(store)}>＋ Supervisor AI</button>
          <button className="btn btn--primary" onClick={() => openMinionBuilder(store)}>＋ New minion</button>
        </div>
      </header>

      {supervisors.length > 0 && (
        <section className="hubdept">
          <h3 className="sub">🛰 Supervisor AIs <span className="badge">{supervisors.length}</span></h3>
          <div className="cardgrid">{supervisors.map((s) => (
            <article className="minioncard minioncard--click" key={s.name} onClick={() => openSupervisorBuilder(store, s.name)}>
              <div className="agentcard__top"><strong>🛰 {s.name}</strong><span className="deptpill deptpill--sales">supervisor</span></div>
              <p className="small">{s.role}</p>
              <p className="muted small">{s.mode === "manual" ? "manual" : "auto orchestrator"} · directs {s.manages?.length || 0} minions</p>
            </article>))}</div>
        </section>)}

      {Object.entries(hub).map(([cat, list]) => (
        <section key={cat} className="hubdept">
          <h3 className="sub">{cat} <span className="badge">{list.length}</span></h3>
          <div className="cardgrid">{list.map((m) => (
            <article className="minioncard minioncard--click" key={m.name} onClick={() => openMinionBuilder(store, cat, m.name)}>
              <div className="agentcard__top"><strong>{m.name}</strong><span className={"deptpill deptpill--" + cat.toLowerCase()}>{cat}</span></div>
              <p className="small">{m.skills}</p>
              <p className="muted small">rule: {m.rules} · by {m.by}</p>
              <div className="row gap" style={{ marginTop: 6 }}>
                {m.framework && <span className="wfchip">📚 {m.framework.name}</span>}
                {m.logic?.nodes?.length ? <span className="wfchip">⑂ {m.logic.nodes.length}-node logic</span> : <span className="muted small">no logic yet</span>}
              </div>
            </article>))}</div>
        </section>))}
    </div>
  );
}

import { useStore } from "../store/store.jsx";
import { navigate, CircleBadge } from "../lib/ui.jsx";

const STATE = { done: "✓ artifact", review: "🟡 review", pending: "⏳ pending", fail: "🔴 failed" };

export default function FlowBuilder({ id }) {
  const { db, showToast } = useStore();
  const f = db.flows[id] || db.flows["flow-outreach"];
  return (
    <div className="view view--wide">
      <header className="view__head">
        <div><h1 className="view__title">⚙ {f.name}</h1>
          <p className="muted">Schedule: {f.schedule} · {f.agent} <CircleBadge c={f.circle} /></p></div>
        <div className="view__actions"><button className="btn btn--ghost" onClick={() => showToast("Dry run started…")}>Dry run</button>
          <button className="btn btn--primary">Save</button></div>
      </header>
      <div className="milestones">{f.steps.map((s, i) => (
        <span key={s.id} style={{ display: "contents" }}>
          <div className={"mile " + s.state}>
            <div className="mile__num">{i + 1}</div><div className="mile__name">{s.name}</div>
            <div className="mile__state">{STATE[s.state] || s.state}</div>
          </div>{i < f.steps.length - 1 && <div className="mile__arrow">→</div>}
        </span>))}</div>
      <div className="flow__toolbar"><button className="btn btn--ghost">+ add milestone</button>
        <button className="btn btn--ghost" onClick={() => navigate("#/run/142")}>View past runs</button></div>
      {f.paths.length > 0 && (
        <section className="card card--ai"><h2 className="card__title"><span>✦</span> Recommendation Minions — pick a path</h2>
          <div className="paths">{f.paths.map((p, i) => (
            <button className="pathcard" key={i} onClick={() => showToast("Path selected: " + p.name)}>
              <strong>{p.name}</strong><span className="muted">✔ {p.pros}</span><span className="muted">✘ {p.cons}</span>
              <span className="chip">effort: {p.effort}</span></button>))}</div></section>
      )}
    </div>
  );
}

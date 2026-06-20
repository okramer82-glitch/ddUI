import { useStore } from "../store/store.jsx";

export default function FlowRun() {
  const { db, showToast } = useStore();
  const r = db.run;
  return (
    <div className="view view--wide">
      <header className="view__head">
        <div><h1 className="view__title">⚙ Run #{r.id} · {r.flow}</h1>
          <p className="muted">{r.when} · {r.dur} · <span className="ok">✓ {r.result}</span></p></div>
        <button className="btn btn--primary" onClick={() => showToast("Replaying run…")}>Replay run</button>
      </header>
      <div className="timeline">{r.timeline.map((t, i) => (
        <span key={i} style={{ display: "contents" }}>
          <span className={"tl__node " + (t.ok ? "ok" : "fail")}>● {t.name}</span>
          {i < r.timeline.length - 1 && <span className="tl__line" />}
        </span>))}</div>
      {r.steps.map((s, i) => (
        <section className="card" key={i}><h2 className="card__title">Step · {s.name}</h2>
          <div className="kv"><span>input: {s.input}</span><span>tool: {s.tool}</span><span>cost: {s.cost}</span></div>
          <p>output: <strong>{s.artifact}</strong> <button className="btn btn--ghost btn--sm" onClick={() => showToast("Replaying step…")}>replay step</button></p>
        </section>))}
      <div className="kv kv--foot"><span>Artifacts ▾</span><span>Logs ▾</span><span>Cost {r.cost}</span><span>Model tiers: {r.tiers}</span></div>
    </div>
  );
}

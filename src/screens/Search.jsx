import { useStore } from "../store/store.jsx";
import { navigate } from "../lib/router.js";

export default function Search() {
  const { db } = useStore();
  const s = db.search;
  return (
    <div className="view">
      <div className="searchbar"><span>🔎</span>
        <input className="cmd__input" defaultValue={s.query} />
        <button className="btn btn--primary">Ask</button></div>
      <section className="card card--ai">
        <p className="answer">{s.answer} <span className="confidence confidence--high">conf: {s.confidence}</span></p>
        <p className="muted small">Sources: {s.sources.map((x, i) => <span className="src" key={i}>▸ {x} </span>)}</p></section>
      <h3 className="sub">Results <span className="muted small">(hybrid: vector · keyword · graph · SQL)</span></h3>
      <ul className="itemrows">{s.results.map((r, i) => (
        <li className="itemrow" key={i}><span className="pill pill--violet">{r.type}</span><span>{r.text}</span></li>))}</ul>
      <button className="btn btn--ghost" onClick={() => navigate("#/skills")}>Switch to 🕸 Graph view</button>
    </div>
  );
}

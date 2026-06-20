import { useStore } from "../store/store.jsx";
import { navigate, RiskBadge, Why, Html } from "../lib/ui.jsx";
import { runOneTap } from "./actions.js";

export default function Pulse() {
  const store = useStore();
  const { db, showToast } = store;
  const p = db.pulse;
  return (
    <div className="view">
      <header className="pulse__head">
        <div><h1 className="pulse__greeting">Good morning, {db.user.name}</h1>
          <p className="pulse__date">{db.today}</p></div>
        <button className="onetap" onClick={() => runOneTap(store)}><span className="onetap__orb">⦿</span> One-Tap</button>
      </header>

      <section className="card card--risk">
        <h2 className="card__title"><span>🔴</span> At risk <span className="count">{p.atRisk.length}</span></h2>
        <ul className="risklist">{p.atRisk.map((r) => (
          <li className="risklist__item" key={r.id}>
            <Html className="risklist__text" html={r.text} />
            <button className="btn btn--ghost" onClick={() => navigate(r.route)}>{r.action}</button>
          </li>))}</ul>
      </section>

      <section className="card">
        <h2 className="card__title"><span>⚡</span> Suggested — one tap each</h2>
        <ul className="suggest">{p.suggested.map((s) => (
          <li className="suggest__item" key={s.id}>
            <label className="check"><input type="checkbox" onChange={(e) => e.target.checked && showToast("Staged for approval — review in Action Queue")} /><span className="check__box" /></label>
            <span className="suggest__text">{s.text}</span><RiskBadge r={s.risk} /><Why text={s.why} />
          </li>))}</ul>
      </section>

      <section className="card card--quiet"><h2 className="card__title"><span>🌙</span> While you were away</h2>
        <Html as="p" className="card__body muted" html={p.overnight} /></section>

      <section className="card"><h2 className="card__title"><span>📅</span> Today</h2>
        <ul className="agenda">{p.agenda.map((a, i) => (
          <li className="agenda__item" key={i}><span className="agenda__time">{a.time}</span><span>{a.title}</span>
            {a.chip && <span className="chip chip--ready">{a.chip}</span>}</li>))}</ul></section>

      <section className="card card--cold"><h2 className="card__title"><span>🚀</span> Finish setup</h2>
        <ul className="suggest">{p.setup.map((s, i) => (
          <li className="suggest__item" key={i}>
            <label className="check"><input type="checkbox" defaultChecked={s.done} disabled={s.done} /><span className="check__box" /></label>
            <span className={"suggest__text" + (s.done ? " muted strike" : "")}>{s.text}</span>
          </li>))}</ul></section>
    </div>
  );
}

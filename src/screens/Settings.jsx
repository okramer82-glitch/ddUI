import { useState } from "react";
import { useStore } from "../store/store.jsx";

export default function Settings() {
  const { db } = useStore();
  const s = db.settings;
  const [tab, setTab] = useState(s.tabs[3]);
  return (
    <div className="view view--wide">
      <header className="view__head"><h1 className="view__title">⚙ Settings</h1></header>
      <div className="segmented seg--wrap">{s.tabs.map((t) => (
        <button key={t} className={"seg" + (tab === t ? " is-active" : "")} onClick={() => setTab(t)}>{t}</button>))}</div>

      <section className="card"><h2 className="card__title">Privacy & Models</h2>
        <div className="setrow"><span>Routing</span><select className="sel"><option>cheap-first</option><option>frontier-first</option></select></div>
        <div className="setrow"><span>Frontier on hard cases</span><label className="switch"><input type="checkbox" defaultChecked={s.privacy.frontierHard} /><span /></label></div>
        <div className="setrow"><span>Sensitive data → secure tier</span><select className="sel"><option>{s.privacy.secureTier}</option><option>Local model</option></select></div>
        <div className="setrow"><span>PII redaction before 3rd-party</span><label className="switch"><input type="checkbox" defaultChecked={s.privacy.redact} /><span /></label></div>
        <div className="setrow"><span>Local masking</span><label className="switch"><input type="checkbox" defaultChecked={s.privacy.localMask} /><span /></label></div>
        <div className="setrow"><span>Cost cap ($/day)</span><span className="cost"><span className="cost__bar wide"><span className="cost__fill" style={{ width: s.privacy.costPct + "%" }} /></span> {s.privacy.costPct}% used</span></div>
      </section>

      <section className="card"><h2 className="card__title">Integrations / MCPs</h2>
        <ul className="itemrows">{s.integrations.map((i, k) => (
          <li className="itemrow" key={k}><span className="itemrow__name">{i.name}</span>
            <span className={"health health--" + i.health}>{i.health === "ok" ? "● connected" : i.health === "warn" ? "● needs attention" : "○ off"}</span></li>))}</ul></section>

      <section className="card"><h2 className="card__title">Members & Roles</h2>
        <p>{s.members.roles} roles · {s.members.principals} principals</p>
        <div className="view__actions"><button className="btn btn--ghost">Add</button><button className="btn btn--ghost">Break-glass</button></div></section>
    </div>
  );
}

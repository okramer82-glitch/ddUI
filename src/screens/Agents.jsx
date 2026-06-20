import { useState } from "react";
import { useStore } from "../store/store.jsx";

export default function Agents() {
  const { db, update, showToast } = useStore();
  const [tab, setTab] = useState("My team");
  const a = db.agents;
  return (
    <div className="view view--wide">
      <header className="view__head"><h1 className="view__title">🤖 Agents</h1>
        <div className="segmented">{["My team", "Marketplace", "Build new +"].map((t) => (
          <button key={t} className={"seg" + (tab === t ? " is-active" : "")} onClick={() => setTab(t)}>{t}</button>))}</div>
      </header>

      {tab !== "Marketplace" && (<>
        <h3 className="sub">My team</h3>
        <div className="cardgrid">{a.mine.map((ag) => (
          <article className="agentcard" key={ag.id}>
            <div className="agentcard__top"><span className={"presence presence--" + (ag.on ? "thinking" : "idle")} /><strong>{ag.name}</strong></div>
            <p className="muted">{ag.role}</p><p className="agentcard__doing">{ag.doing}</p>
            <label className="switch"><input type="checkbox" checked={ag.on}
              onChange={() => update((d) => { const m = d.agents.mine.find((x) => x.id === ag.id); m.on = !m.on; m.doing = m.on ? "idle" : "off"; })} />
              <span /> {ag.on ? "on" : "off"}</label>
            <p className="muted small">skills · tools/MCPs · circle · cost cap</p></article>))}</div>
      </>)}

      {tab !== "My team" && (<>
        <h3 className="sub">Marketplace</h3>
        <div className="cardgrid">{a.market.map((ag) => (
          <article className="agentcard agentcard--market" key={ag.id}>
            <strong>{ag.name}</strong><p className="muted">{ag.role}</p>
            <p className="agentcard__rate">⭐ {ag.rating} · {ag.installs} installs</p>
            <button className="btn btn--primary btn--sm" onClick={() => showToast("Installing " + ag.name + "…")}>+ Install</button></article>))}</div>
      </>)}
    </div>
  );
}

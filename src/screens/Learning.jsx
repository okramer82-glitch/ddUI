import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { navigate } from "../lib/router.js";

const TABS = ["My tracks", "Assigned", "Team"];

export default function Learning() {
  const { db } = useStore();
  const l = db.learning;
  const [tab, setTab] = useState("My tracks");

  const boxes = tab === "Assigned"
    ? l.boxes.filter((b) => b.assignedBy)
    : tab === "Team"
    ? l.boxes.filter((b) => b.team)
    : l.boxes.filter((b) => !b.assignedBy && !b.team);

  return (
    <div className="view view--wide">
      <header className="view__head">
        <h1 className="view__title">🎓 Learning</h1>
        <div className="segmented">
          {TABS.map((t) => (
            <button key={t} className={"seg" + (tab === t ? " is-active" : "")} onClick={() => setTab(t)}>
              {t}
              {t === "Assigned" && l.boxes.filter((b) => b.assignedBy).length > 0 &&
                <span className="badge" style={{ marginLeft: 5 }}>{l.boxes.filter((b) => b.assignedBy).length}</span>}
            </button>
          ))}
        </div>
      </header>

      {tab === "My tracks" && (
        <div className="row gap" style={{ marginBottom: 20 }}>
          <section className="card flex1">
            <h2 className="card__title">Continue</h2>
            <p>{l.continue.name} <strong>{l.continue.pct}%</strong></p>
            <div className="cost__bar wide"><span className="cost__fill" style={{ width: l.continue.pct + "%" }} /></div>
            <button className="btn btn--primary" style={{ marginTop: 12 }} onClick={() => navigate("#/box/" + l.continue.box)}>▶ Resume Box</button>
          </section>
          <section className="card flex1">
            <h2 className="card__title">Diagnostic</h2>
            <p className="muted">"Find my gaps" (5 min)</p>
            <button className="btn btn--ghost" style={{ marginTop: 12 }} onClick={() => navigate("#/skills")}>Start cold-assess</button>
          </section>
        </div>
      )}

      <h3 className="sub">
        {tab === "Assigned" ? "Assigned to me" : tab === "Team" ? "Team boxes" : "Learning Boxes"}
        <span className="muted small"> — simulations &amp; sandboxes · 🧭 guided or 🎯 test</span>
      </h3>

      {boxes.length === 0 ? (
        <p className="muted" style={{ padding: "24px 0" }}>
          {tab === "Assigned" ? "No boxes assigned to you yet — your team lead will assign boxes here." : "No team boxes yet."}
        </p>
      ) : (
        <div className="cardgrid">
          {boxes.map((b) => (
            <article className="boxcard" key={b.id} onClick={() => navigate("#/box/" + b.id)}>
              <div className="boxcard__glyph">{b.glyph}</div>
              <strong>{b.name}</strong>
              {b.kind === "sandbox" && <span className="wfchip">sandbox</span>}
              {b.assignedBy && (
                <div style={{ marginTop: 6 }}>
                  <span className="wfchip" style={{ background: "var(--violet-dim, #2e1f5e)", color: "var(--violet)" }}>
                    👤 {b.assignedBy}
                  </span>
                  {b.assignedNote && <p className="muted small" style={{ marginTop: 4 }}>{b.assignedNote}</p>}
                </div>
              )}
              <p className="muted small">{b.skills}</p>
            </article>
          ))}
        </div>
      )}

      <div className="gamify">
        <span>SRS due today <strong>{l.srsDue}</strong></span>
        <span>Streak 🔥 {l.streak}</span>
        <span>Points {l.points.toLocaleString()}</span>
      </div>
    </div>
  );
}

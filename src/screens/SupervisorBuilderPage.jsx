import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { useHashRoute, navigate } from "../lib/router.js";
import { saveSupervisor, minionsInScope } from "./supervisorBuilder.jsx";

const initials = (n) => n.replace("@", "").slice(0, 2).toUpperCase();

export default function SupervisorBuilderPage() {
  const store = useStore();
  const { db, showToast } = store;
  const { id } = useHashRoute();
  const isNew = id === "new";
  const editName = isNew ? null : decodeURIComponent(id || "");
  const existing = editName ? (db.supervisors || []).find((s) => s.name === editName) : null;

  const [name, setName] = useState(existing?.name || "@");
  const [role, setRole] = useState(existing?.role || "");
  const [desc, setDesc] = useState(existing?.desc || "");
  const [mode, setMode] = useState(existing?.mode || "auto");
  const [scope, setScope] = useState(existing?.scope || "all");
  const [manual, setManual] = useState(existing?.manages || []);

  const cats = Object.keys(db.minionHub || {});
  const autoTeam = minionsInScope(db, scope);
  const toggle = (n) => setManual((a) => (a.includes(n) ? a.filter((x) => x !== n) : [...a, n]));

  const save = () => {
    if (!name.replace("@", "").trim()) { showToast("Give the supervisor a name"); return; }
    const manages = mode === "auto" ? autoTeam : manual;
    if (!manages.length) { showToast("Assign at least one minion"); return; }
    saveSupervisor(store, existing?.name, { name: name.startsWith("@") ? name : "@" + name, role, desc, mode, scope, manages });
    navigate("#/minions");
  };

  return (
    <div className="mbpage">
      <header className="mbpage__bar">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate("#/minions")}>← Minions</button>
        <h1 className="mbpage__title">{existing ? "✎ Edit " + existing.name : "🛰 New supervisor AI"}</h1>
        <div className="row gap">
          <button className="btn btn--ghost" onClick={() => navigate("#/minions")}>Cancel</button>
          <button className="btn btn--primary" onClick={save}>{existing ? "Save supervisor" : "✓ Add supervisor"}</button>
        </div>
      </header>

      <div className="mbpage__main" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="card">
          <div className="row gap">
            <label className="fld flex1"><span>Name</span><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="@Atlas" /></label>
            <label className="fld flex1"><span>Role</span><input className="inp" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Revenue supervisor AI" /></label>
          </div>
          <label className="fld"><span>What complex goals does it own?</span>
            <textarea className="ta" rows="2" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Breaks revenue goals into tasks and coordinates the sales & finance minions." /></label>
        </div>

        <h4 className="sub">How should it pick its minions?</h4>
        <div className="accesscards">
          <button className={"accesscard" + (mode === "auto" ? " is-active" : "")} onClick={() => setMode("auto")}>
            <span className="accesscard__ico">✨</span><strong>Automatic orchestrator</strong>
            <span className="muted small">Doty assigns the right minions to each goal dynamically.</span></button>
          <button className={"accesscard" + (mode === "manual" ? " is-active" : "")} onClick={() => setMode("manual")}>
            <span className="accesscard__ico">🖐</span><strong>Manual</strong>
            <span className="muted small">You choose exactly which minions work under it.</span></button>
        </div>

        {mode === "auto" ? (
          <div className="card" style={{ marginTop: 12 }}>
            <label className="fld"><span>Scope Doty can orchestrate</span>
              <select className="sel" value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="all">All teams</option>
                {cats.map((c) => <option key={c} value={c}>{c} team</option>)}</select></label>
            <p className="muted small">Doty will dynamically draft &amp; assign these {autoTeam.length} minions per goal:</p>
            <div className="chippick__sel">{autoTeam.map((m) => <span className="selchip" key={m}><span className="avatar avatar--xs">{initials(m)}</span> {m}</span>)}</div>
          </div>
        ) : (
          <div className="card" style={{ marginTop: 12 }}>
            <p className="muted small">Pick the minions that report to {name} ({manual.length} selected):</p>
            {cats.map((c) => (
              <div className="suvcat" key={c}><div className="suvcat__h">{c}</div>
                <div className="recfields">{(db.minionHub[c] || []).map((m) => (
                  <label className={"recfield" + (manual.includes(m.name) ? " is-on" : "")} key={m.name}>
                    <input type="checkbox" checked={manual.includes(m.name)} onChange={() => toggle(m.name)} /> {m.name}</label>))}</div>
              </div>))}
          </div>
        )}
      </div>
    </div>
  );
}

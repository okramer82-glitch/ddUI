import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { navigate } from "../lib/router.js";
import { ModalFrame } from "../shell/Modal.jsx";
import { openMinionBuilder } from "./minionBuilder.jsx";
import { openSupervisorBuilder } from "./supervisorBuilder.jsx";

const HEALTH = { "on-track": ["🟢", "On track"], "at-risk": ["🟡", "At risk"], blocked: ["🔴", "Blocked"] };
const TLST = { done: "✓", active: "●", scheduled: "○", blocked: "✕" };
const initials = (n) => n.replace("@", "").slice(0, 2).toUpperCase();
const PTABS = [["projects", "🗂 Projects"], ["timeline", "🕒 Timeline"], ["goals", "🎯 Goals & milestones"], ["team", "🛰 Team"]];

/** Projects the AI works on — projects, per-project timeline, goals list, team architecture. */
export default function ProjectsHub() {
  const store = useStore();
  const { db } = store;
  const projects = db.projects || [];
  const supervisors = db.supervisors || [];
  const active = projects.filter((p) => p.status === "in-progress").length;
  const [tab, setTab] = useState("projects");
  const [sel, setSel] = useState(null);
  const selected = projects.find((p) => p.id === sel);

  return (
    <div className="view view--wide">
      <header className="view__head">
        <div><h1 className="view__title">🛰 Projects &amp; Team</h1>
          <p className="muted">{active} active project{active === 1 ? "" : "s"} · {supervisors.length} supervisor AIs coordinating the minions.</p></div>
        <div className="view__actions">
          <button className="btn btn--ghost" onClick={() => openSupervisorBuilder(store)}>＋ New supervisor AI</button>
          <button className="btn btn--primary" onClick={() => openMinionBuilder(store)}>＋ New minion</button>
        </div>
      </header>

      <div className="ftabs">{PTABS.map(([k, l]) => (
        <button key={k} className={"ftab" + (tab === k ? " is-active" : "")} onClick={() => { setTab(k); setSel(null); }}>{l}</button>))}</div>

      {tab === "projects" && (selected
        ? <ProjectDetail p={selected} store={store} onBack={() => setSel(null)} />
        : <Projects projects={projects} onOpen={setSel} />)}
      {tab === "timeline" && <Timeline projects={projects} />}
      {tab === "goals" && <Goals projects={projects} store={store} />}
      {tab === "team" && <Team supervisors={supervisors} projects={projects} store={store} db={db} />}
    </div>
  );
}

function Projects({ projects, onOpen }) {
  return (
    <div className="projgrid">{projects.map((p) => (
      <article className={"projcard projcard--" + p.health} key={p.id} onClick={() => onOpen(p.id)} style={{ cursor: "pointer" }}>
        <div className="projcard__top"><span className={"badge badge--" + p.status}>{p.status}</span>
          <span className="projhealth">{HEALTH[p.health][0]} {HEALTH[p.health][1]}</span></div>
        <strong className="projcard__name">{p.name}</strong>
        <p className="muted small">{p.goal}</p>
        <div className="projbar"><span className="projbar__fill" style={{ width: p.progress + "%" }} /></div>
        <p className="muted small">{p.progress}% · {p.milestones.done}/{p.milestones.total} milestones · updated {p.updated}</p>
        <div className="projcard__foot"><span className="projsup" title="Supervisor AI">🛰 {p.supervisor}</span>
          <span className="projteam">{p.minions.map((m) => <span className="avatar avatar--xs" key={m} title={m}>{initials(m)}</span>)}</span></div>
      </article>))}</div>
  );
}

function ProjectDetail({ p, store, onBack }) {
  const allMs = (p.goals || []).flatMap((g) => g.milestones.map((m) => ({ ...m, goal: g.name })));
  const done = allMs.filter((m) => m.status === "done");
  const notYet = allMs.filter((m) => m.status !== "done");
  const openMs = (m) => openProjectMilestone(store, p, { name: m.goal }, m);
  return (
    <div className="pdetail">
      <div className="pdetail__bar">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>← Projects</button>
        <span className="pdetail__name"><strong>{p.name}</strong> <span className={"badge badge--" + p.status}>{p.status}</span>
          <span className="projhealth">{HEALTH[p.health][0]} {HEALTH[p.health][1]}</span></span>
        {p.folder && <button className="btn btn--ghost btn--sm" onClick={() => navigate("#/folder/" + p.folder)}>Open folder ↗</button>}
      </div>
      <div className="projbar" style={{ margin: "0 0 12px" }}><span className="projbar__fill" style={{ width: p.progress + "%" }} /></div>

      <div className="pdetail__body">
        <div className="pdetail__main">
          <h3 className="sub" style={{ marginTop: 0 }}>Updates — 🛰 {p.supervisor} ↔ minions</h3>
          <div className="convo">{(p.conversation || []).map((c, i) => (
            <div className={"convo__row convo__row--" + (c.role || "minion")} key={i}>
              <span className="avatar avatar--xs">{initials(c.who)}</span>
              <div className="convo__bubble" onClick={() => openMessage(store, p, c)} title="Click for details">
                <div className="convo__head"><strong>{c.who}</strong>{c.role === "supervisor" && <span className="deptpill deptpill--sales">supervisor</span>}<span className="muted small">{c.when}</span></div>
                <p className="convo__text">{c.text}</p>
                {c.draft && <span className="draftchip">📄 {c.draft.name}</span>}
              </div>
            </div>))}{!p.conversation?.length && <p className="muted">No updates yet.</p>}</div>
          <CommentBox p={p} store={store} />
        </div>

        <aside className="pdetail__side">
          <div className="todo card">
            <div className="todo__h">✅ Achieved <span className="badge">{done.length}</span></div>
            <ul className="todo__list">{done.length ? done.map((m) => (
              <li className="todo__item todo__item--done" key={m.id} onClick={() => openMs(m)}><span className="todo__chk">✓</span><span className="todo__name">{m.name}</span></li>
            )) : <li className="muted small">Nothing yet.</li>}</ul>
            <div className="todo__h" style={{ marginTop: 12 }}>🕒 Not yet <span className="badge">{notYet.length}</span></div>
            <ul className="todo__list">{notYet.length ? notYet.map((m) => (
              <li className={"todo__item ms--" + m.status} key={m.id} onClick={() => openMs(m)}>
                <span className="ms__dot" /><span className="todo__name">{m.name}</span><span className="muted small">{m.status}</span></li>
            )) : <li className="muted small">All done!</li>}</ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Timeline({ projects }) {
  return (
    <div className="ptl">{projects.map((p) => (
      <div className="ptl__proj" key={p.id}>
        <div className="ptl__head"><strong>{p.name}</strong><span className="projhealth">{HEALTH[p.health][0]} {HEALTH[p.health][1]}</span>
          <span className="muted small">🛰 {p.supervisor}</span></div>
        <ol className="ptl__line">{(p.timeline || []).map((e, i) => (
          <li className={"ptl__ev ptl__ev--" + e.status} key={i}>
            <span className="ptl__dot">{TLST[e.status] || "•"}</span>
            <div className="ptl__main"><span className="ptl__when">{e.when}</span>
              <span className="ptl__label">{e.label}{e.by && <span className="muted small"> · {e.by}</span>}</span></div>
          </li>))}</ol>
      </div>))}</div>
  );
}

function Goals({ projects, store }) {
  return (
    <div className="pgoals">{projects.map((p) => (
      <section className="pgoals__proj" key={p.id}>
        <h3 className="sub">{p.name} <span className="muted small">· 🛰 {p.supervisor}</span></h3>
        {(p.goals || []).map((g) => (
          <details className="goal" key={g.id} open>
            <summary><span className="goal__name">{g.name}</span><span className={"badge badge--" + g.status}>{g.status}</span></summary>
            <ul className="milestones-list">{g.milestones.map((m) => (
              <li className={"ms ms--" + m.status} key={m.id} onClick={() => openProjectMilestone(store, p, g, m)}>
                <span className="ms__dot" /><span className="ms__name">{m.name}</span>
                <span className="ms__facts">{m.depends?.length ? <span className="depchip">⛔ {m.depends.join(", ")}</span> : null}
                  <span className="ms__sched muted small">🕘 {m.due}</span></span>
                <span className="ms__minions">{m.owner && <span className="minipill minipill--xs">{m.owner}</span>}</span>
                <span className="ms__status">{m.status}</span></li>))}</ul>
          </details>))}
      </section>))}</div>
  );
}

const TEAM_VIEWS = [["org", "🛰 Org"], ["agents", "🤖 Agents"], ["market", "🛍 Marketplace"]];

function Team({ supervisors, projects, store, db }) {
  const [view, setView] = useState("org");
  const agents = db.agents?.mine || [];
  const market = db.agents?.market || [];

  return (
    <>
      <div className="teambar">
        <div className="segmented">{TEAM_VIEWS.map(([k, l]) => (
          <button key={k} className={"seg" + (view === k ? " is-active" : "")} onClick={() => setView(k)}>{l}</button>))}</div>
        {view === "org" && <button className="btn btn--ghost btn--sm" onClick={() => openSupervisorBuilder(store)}>＋ New supervisor AI</button>}
        {view === "agents" && <button className="btn btn--ghost btn--sm" onClick={() => openMinionBuilder(store)}>＋ Build new</button>}
      </div>

      {view === "org" && (<>
        <p className="muted small">The Brain orchestrates supervisor AIs; each supervisor owns complex goals and directs its minions.</p>
        <div className="org">
          <div className="org__root">🧠 Doty Brain<span className="muted small">orchestrates every supervisor</span></div>
          <div className="org__bus" />
          <div className="org__pods">
            {supervisors.map((s) => {
              const load = projects.filter((p) => p.supervisor === s.name).length;
              return (
                <div className="org__pod" key={s.name}>
                  <div className="org__sup" onClick={() => openSupervisorBuilder(store, s.name)} style={{ cursor: "pointer" }} title="Edit supervisor AI">
                    <div className="org__sup-top"><strong>🛰 {s.name}</strong><span className="deptpill deptpill--sales">supervisor AI</span></div>
                    <p className="muted small">{s.role} · {load} project{load === 1 ? "" : "s"}</p><p className="small">{s.desc}</p></div>
                  <div className="org__members">{s.manages.map((m) => (
                    <button className="org__minion" key={m} onClick={() => openMinionBuilder(store, catOf(db, m), m)} title="Open minion">
                      <span className="avatar avatar--xs">{initials(m)}</span> {m}</button>))}</div>
                </div>);
            })}
            <button className="org__pod org__pod--add" onClick={() => openSupervisorBuilder(store)} title="Add a supervisor AI">
              <span className="org__add-plus">＋</span><span>New supervisor AI</span></button>
          </div>
        </div>
      </>)}

      {view === "agents" && <AgentsPanel agents={agents} store={store} />}
      {view === "market" && <MarketPanel market={market} store={store} />}
    </>
  );
}

/* ---- agents on/off (presence) ---- */
function AgentsPanel({ agents, store }) {
  const toggle = (id) => store.update((d) => {
    const m = d.agents.mine.find((x) => x.id === id); if (!m) return;
    m.on = !m.on; m.doing = m.on ? "idle" : "off";
  });
  if (!agents.length) return <p className="muted">No agents on your team yet — install from the Marketplace or build a new one.</p>;
  return (<>
    <p className="muted small">Agents working under your supervisors. Toggle one off to pause its automation across every project.</p>
    <div className="cardgrid">{agents.map((ag) => (
      <article className="agentcard" key={ag.id}>
        <div className="agentcard__top"><span className={"presence presence--" + (ag.on ? "thinking" : "idle")} /><strong>{ag.name}</strong></div>
        <p className="muted">{ag.role}</p>
        <p className="agentcard__doing">{ag.on ? ag.doing : "paused"}</p>
        <label className="switch"><input type="checkbox" checked={ag.on} onChange={() => toggle(ag.id)} /><span /> {ag.on ? "on" : "off"}</label>
      </article>))}</div>
  </>);
}

/* ---- marketplace (install agents) ---- */
function MarketPanel({ market, store }) {
  const install = (ag) => {
    let already = false;
    store.update((d) => {
      d.agents = d.agents || { mine: [], market: [] };
      if (d.agents.mine.some((x) => x.id === ag.id)) { already = true; return; }
      const handle = "@" + ag.name.replace(/\s*Agent$/i, "").trim().replace(/\s+/g, "");
      d.agents.mine.push({ id: ag.id, name: handle, role: ag.role, on: true, doing: "idle", color: "violet" });
    });
    store.showToast(already ? ag.name + " is already on your team" : "✓ " + ag.name + " installed — permissions granted");
  };
  if (!market.length) return <p className="muted">No marketplace agents available right now.</p>;
  return (<>
    <p className="muted small">Install ready-made agents. Installing reviews and grants the permissions the agent's role needs.</p>
    <div className="cardgrid">{market.map((ag) => (
      <article className="agentcard agentcard--market" key={ag.id}>
        <strong>{ag.name}</strong><p className="muted">{ag.role}</p>
        <p className="agentcard__rate">⭐ {ag.rating} · {ag.installs} installs</p>
        <button className="btn btn--primary btn--sm" onClick={() => install(ag)}>+ Install</button>
      </article>))}</div>
  </>);
}

/* ---- comment to supervisor ---- */
function postComment(store, pid, text, supervisor) {
  store.update((d) => {
    const p = d.projects.find((x) => x.id === pid); if (!p) return;
    p.conversation = p.conversation || [];
    p.conversation.push({ who: "You", role: "you", when: "just now", text });
    p.conversation.push({ who: supervisor, role: "supervisor", when: "just now", text: "Got it — I'll factor that into the plan and adjust the minions' tasks." });
  });
  store.showToast("Comment sent to " + supervisor);
}
function CommentBox({ p, store }) {
  const [val, setVal] = useState("");
  const send = () => { if (!val.trim()) return; postComment(store, p.id, val.trim(), p.supervisor); setVal(""); };
  return (
    <div className="commentbox">
      <span className="muted small">💬 Comment to {p.supervisor} — it re-plans based on your input:</span>
      <div className="boxsim__input"><input className="cmd__input" placeholder={`Tell ${p.supervisor} what to do…`} value={val}
        onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="btn btn--primary" onClick={send}>Send</button></div>
    </div>
  );
}

/* ---- markdown viewer (drafts) ---- */
function mdToHtml(md) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let html = "", inList = false;
  for (const raw of (md || "").split("\n")) {
    let line = esc(raw).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    const close = () => { if (inList) { html += "</ul>"; inList = false; } };
    if (/^### /.test(line)) { close(); html += "<h4>" + line.slice(4) + "</h4>"; }
    else if (/^## /.test(line)) { close(); html += "<h3>" + line.slice(3) + "</h3>"; }
    else if (/^# /.test(line)) { close(); html += "<h2>" + line.slice(2) + "</h2>"; }
    else if (/^[-*] /.test(line)) { if (!inList) { html += "<ul>"; inList = true; } html += "<li>" + line.slice(2) + "</li>"; }
    else if (line.trim() === "") { close(); }
    else { close(); html += "<p>" + line + "</p>"; }
  }
  if (inList) html += "</ul>";
  return html;
}
const openMarkdown = (store, name, md) => store.openModal(<MarkdownModal name={name} md={md} />);
function MarkdownModal({ name, md }) {
  const { closeModal } = useStore();
  return (
    <ModalFrame title={`📄 ${name}`} footer={<button className="btn btn--ghost" onClick={closeModal}>Close</button>}>
      <div className="mdbody" dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />
    </ModalFrame>
  );
}

/* ---- message details ---- */
const openMessage = (store, p, c) => store.openModal(<MessageModal p={p} c={c} />);
function MessageModal({ p, c }) {
  const store = useStore();
  const { closeModal } = store;
  return (
    <ModalFrame title={`💬 ${c.who}`} footer={<button className="btn btn--ghost" onClick={closeModal}>Close</button>}>
      <div className="msmeta">{c.role === "supervisor" && <span className="deptpill deptpill--sales">supervisor</span>}
        {c.role === "you" && <span className="deptpill deptpill--finance">you</span>}
        <span className="muted small">{c.when} · {p.name}</span></div>
      <p className="msdesc">{c.text}</p>
      {c.detail && <p className="small">{c.detail}</p>}
      {c.draft && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="formcard__foot" style={{ marginTop: 0, paddingTop: 0, borderTop: 0 }}>
            <span>📄 {c.draft.name} <span className="dynbadge">draft</span></span>
            <button className="btn btn--primary btn--sm" onClick={() => openMarkdown(store, c.draft.name, c.draft.md)}>View .md ↗</button>
          </div></div>)}
    </ModalFrame>
  );
}

const openProjectMilestone = (store, p, g, m) => store.openModal(<MilestoneModal p={p} g={g} m={m} />);
function MilestoneModal({ p, g, m }) {
  const { closeModal } = useStore();
  return (
    <ModalFrame title={`◇ ${m.name}`} footer={<button className="btn btn--ghost" onClick={closeModal}>Close</button>}>
      <div className="msmeta"><span className={"badge badge--" + m.status}>{m.status}</span>
        {m.owner && <span className="minipill minipill--xs">{m.owner}</span>}
        <span className="muted small">{p.name} · {g.name}</span></div>
      <p className="msdesc">{m.description}</p>
      <div className="msfacts">
        <div className="msfact"><span className="muted small">Due</span><strong>{m.due || "—"}</strong></div>
        <div className="msfact"><span className="muted small">Owner</span><strong>{m.owner || "—"}</strong></div>
        <div className="msfact"><span className="muted small">Depends on</span>
          <strong>{m.depends?.length ? m.depends.map((d) => <span className="depchip" key={d}>⛔ {d}</span>) : "None"}</strong></div>
      </div>
      {m.files?.length > 0 && <>
        <h4 className="sub" style={{ margin: "14px 0 6px" }}>Files</h4>
        <ul className="filelist">{m.files.map((fl, i) => (
          <li className={"filerow filerow--" + (fl.dynamic ? "dynamic" : "static")} key={i}>
            <span className="filerow__ico">{fl.dynamic ? "🔁" : "📄"}</span>
            <span className="filerow__name">{fl.name} {fl.dynamic ? <span className="dynbadge">dynamic</span> : <span className="statbadge">static</span>}</span>
          </li>))}</ul>
      </>}
      <h4 className="sub" style={{ margin: "14px 0 6px" }}>Updates — what the minions did</h4>
      <ul className="msupdates">{m.updates?.length ? m.updates.map((u, i) => (
        <li className="msu msu--work" key={i}><span className="msu__ico">⚙</span>
          <div className="msu__main"><p className="msu__text">{u.text}</p><p className="muted small">{u.by} · {u.when}</p></div></li>))
        : <li className="muted">No updates yet.</li>}</ul>
    </ModalFrame>
  );
}

function catOf(db, name) {
  for (const [cat, list] of Object.entries(db.minionHub || {})) if (list.some((m) => m.name === name)) return cat;
  return null;
}

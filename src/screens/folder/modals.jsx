import { useState } from "react";
import { useStore } from "../../store/store.jsx";
import { ModalFrame } from "../../shell/Modal.jsx";
import { addMinion, toggleConnect, createGoal, toggleParallel } from "./folderActions.js";
import FormWizard from "./FormWizard.jsx";

/* ---------- open helpers (called from screens) ---------- */
export const openCloneShare = (store, name) => store.openModal(<CloneShareModal name={name} />);
export const openWorkflowModal = (store, fid, setTab) => store.openModal(<WorkflowModal fid={fid} setTab={setTab} />);
export const openNodeEditor = (store, fid, nid) => store.openModal(<NodeEditorModal fid={fid} nid={nid} />);
export const openFormShare = (store, fid, setTab) => store.openModal(<FormWizard fid={fid} setTab={setTab} />);
export const openFormSettings = (store, fid, formId) => store.openModal(<FormWizard fid={fid} formId={formId} />);
export const openMinionHub = (store, fid, setTab) => store.openModal(<MinionHubModal fid={fid} setTab={setTab} />);
export const openConnect = (store, fid) => store.openModal(<ConnectModal fid={fid} />);
export const openVersions = (store, fid, did) => store.openModal(<VersionsModal fid={fid} did={did} />);
export const openGoalChat = (store, fid, setTab) => store.openModal(<GoalChatModal fid={fid} setTab={setTab} />);
export const openMilestone = (store, fid, gid, mid) => store.openModal(<MilestoneModal fid={fid} gid={gid} mid={mid} />);
export const openGoalReport = (store, fid, gid) => store.openModal(<GoalReportModal fid={fid} gid={gid} />);
export const openCronTimeline = (store, fid, gid, mid) => store.openModal(<CronTimelineModal fid={fid} gid={gid} mid={mid} />);

const Foot = ({ children }) => <>{children}</>;

function CloneShareModal({ name }) {
  const { closeModal, showToast } = useStore();
  return (
    <ModalFrame title={`Share "${name}"`} lg={false} footer={
      <Foot><button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
        <button className="btn btn--primary" onClick={() => { showToast("Shared with embedded AI"); closeModal(); }}>Publish</button></Foot>}>
      <div className="setrow"><span>Audience</span><div className="segmented"><button className="seg">Team</button><button className="seg is-active">External link</button></div></div>
      <div className="setrow"><span>Access</span><select className="sel"><option>view-only</option><option>comment</option></select></div>
      <div className="setrow"><span>Expires</span><select className="sel"><option>7 days</option><option>30 days</option><option>never</option></select></div>
      <label className="setrow check inline"><input type="checkbox" defaultChecked /><span className="check__box" /> Embed AI assistant (answers questions about this doc)</label>
      <label className="setrow check inline"><input type="checkbox" defaultChecked /><span className="check__box" /> Table of contents</label>
      <div className="linkrow"><code>doty.app/r/share-x7</code><button className="btn btn--primary btn--sm" onClick={() => showToast("Link copied")}>Copy</button></div>
    </ModalFrame>
  );
}

function WorkflowModal({ fid, setTab }) {
  const store = useStore();
  const { db, closeModal, showToast } = store;
  const f = db.folders[fid];
  const [built, setBuilt] = useState(false);
  return (
    <ModalFrame title={`⚙ Workflow for 📁 ${f.name}`} footer={
      <Foot><button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
        <button className="btn btn--primary" onClick={() => { showToast("Workflow saved — minions reconfigured"); closeModal(); }}>Save workflow</button></Foot>}>
      <label className="fld"><span>Describe the workflow in plain language</span>
        <textarea className="ta" rows="3" defaultValue={f.workflowText} /></label>
      <button className="btn btn--primary" onClick={() => { setBuilt(true); showToast("Workflow structure generated"); }}>✦ Build with Doty</button>
      {built && (
        <div className="card card--ai" style={{ margin: "12px 0" }}>
          <h4 className="card__title"><span>✦</span> Doty built {f.workflow.nodes.length} nodes & {f.minions.length} minions</h4>
          <div className="wfgraph">{f.workflow.nodes.map((n, i) => (
            <span key={n.id} style={{ display: "contents" }}>
              <div className={"wfnode " + n.status}><div className="wfnode__head"><span className="wfnode__n">{i + 1}</span><strong>{n.name}</strong><span className="wfnode__minion">{n.minion}</span></div></div>
              {i < f.workflow.nodes.length - 1 && <div className="wfarrow">→</div>}
            </span>))}</div>
        </div>)}
      <h4 className="sub">Minions <span className="muted small">(job · rule · schedule · MCPs)</span></h4>
      <div className="minioneditors">{f.minions.map((m) => (
        <div className="card minioned" key={m.id}>
          <div className="row gap"><label className="fld flex1"><span>Name</span><input className="inp" defaultValue={m.name} /></label>
            <label className="fld flex1"><span>Department</span><input className="inp" defaultValue={m.dept} /></label></div>
          <label className="fld"><span>Job</span><input className="inp" defaultValue={m.job} /></label>
          <label className="fld"><span>Rule</span><input className="inp" defaultValue={m.rules} /></label>
          <div className="row gap"><label className="fld flex1"><span>Schedule</span><input className="inp" defaultValue={m.schedule} /></label>
            <label className="fld flex1"><span>Check MCPs</span><input className="inp" defaultValue={m.mcps.join(", ")} /></label></div>
        </div>))}
        <button className="btn btn--ghost btn--sm" onClick={() => openMinionHub(store, fid, setTab)}>+ Add minion from team Hub</button></div>
      <label className="fld"><span>Output style</span><input className="inp" defaultValue={f.outputStyle} /></label>
      <label className="fld"><span>How they work together</span><input className="inp" defaultValue={f.teamwork} /></label>
    </ModalFrame>
  );
}

function NodeEditorModal({ fid, nid }) {
  const store = useStore();
  const { db, closeModal, showToast } = store;
  const f = db.folders[fid];
  const n = f?.workflow.nodes.find((x) => x.id === nid);
  const nodeIdx = f?.workflow.nodes.findIndex((x) => x.id === nid) ?? -1;
  const prevNode = nodeIdx > 0 ? f.workflow.nodes[nodeIdx - 1] : null;
  const isParallel = !!(n?.group && prevNode && n.group === prevNode.group);
  const catalog = db.mcpCatalog || [];
  const hub = db.minionHub || {};
  const cats = Object.keys(hub);
  const mcpTriggers = (src) => catalog.find((c) => c.name === src)?.triggers || [];
  const catOf = (name) => cats.find((c) => hub[c].some((m) => m.name === name)) || cats[0];

  const [mode, setMode] = useState("build"); // "describe" | "build"
  const [desc, setDesc] = useState(n?.prompt || "");
  const [cat, setCat] = useState(catOf(n?.minion));
  const [minion, setMinion] = useState(n?.minion || hub[cats[0]]?.[0]?.name || "");
  const [inputs, setInputs] = useState(() => (n?.inputs || []).map((i) => ({ type: i.type, source: i.source, note: i.note || "" })));
  const [chans, setChans] = useState(() => (n?.inputs || []).filter((i) => i.type === "mcp").map((i) => i.source));
  const [output, setOutput] = useState(n?.output || "");
  if (!n) return null;
  const toggleChan = (name) => setChans((c) => (c.includes(name) ? c.filter((x) => x !== name) : [...c, name]));
  const buildFromDescribe = () => {
    const mcpInputs = chans.map((name) => ({ type: "mcp", source: name, note: mcpTriggers(name)[0] || "" }));
    const kept = inputs.filter((i) => i.type !== "mcp");
    setInputs([...mcpInputs, ...kept]);
    setMode("build");
    showToast(chans.length ? `Doty wired ${chans.length} channel${chans.length > 1 ? "s" : ""} — review the step` : "Doty built the step — review inputs, minion & output");
  };

  const minionList = hub[cat] || [];
  const minionInfo = minionList.find((m) => m.name === minion) || Object.values(hub).flat().find((m) => m.name === minion);
  const prevNodes = f.workflow.nodes.filter((x) => x.id !== nid);
  const connFolders = (f.connectedFolders || []).map((cid) => db.folders[cid]).filter(Boolean);
  const folderForms = f.forms || [];

  const setInput = (k, patch) => setInputs((arr) => arr.map((it, i) => (i === k ? { ...it, ...patch } : it)));
  const removeInput = (k) => setInputs((arr) => arr.filter((_, i) => i !== k));
  const addInput = () => setInputs((arr) => [...arr, { type: "mcp", source: catalog[0]?.name || "", note: mcpTriggers(catalog[0]?.name)[0] || "" }]);
  const changeType = (k, type) => setInput(k, {
    type,
    source: type === "mcp" ? (catalog[0]?.name || "") : type === "form" ? (folderForms[0]?.name || "") : type === "node" ? (prevNodes[0]?.id || "") : (connFolders[0]?.id || ""),
    note: type === "mcp" ? (mcpTriggers(catalog[0]?.name)[0] || "") : type === "form" ? "on submit" : "",
  });

  return (
    <ModalFrame title={`✎ Edit node · ${n.name}`} footer={
      <Foot><button className="btn btn--ghost" onClick={closeModal}>Cancel</button>
        <button className="btn btn--primary" onClick={() => { showToast("Node updated"); closeModal(); }}>Save node</button></Foot>}>
      <div className="segmented" style={{ marginBottom: 12 }}>
        <button className={"seg" + (mode === "describe" ? " is-active" : "")} onClick={() => setMode("describe")}>✦ Describe it</button>
        <button className={"seg" + (mode === "build" ? " is-active" : "")} onClick={() => setMode("build")}>🔧 Build manually</button>
      </div>

      {mode === "describe" ? (
        <div className="card card--ai">
          <h4 className="card__title"><span>✦</span> Tell Doty what this step should do</h4>
          <p className="muted small">Pick the channels this step should use, then describe the work. Doty wires the trigger, the minion and the output.</p>
          <div className="fld"><span>Channels to use {chans.length ? <span className="muted">({chans.length} selected)</span> : null}</span>
            <div className="chanpick">{catalog.map((c) => (
              <button key={c.name} className={"chanchip" + (chans.includes(c.name) ? " is-active" : "")} onClick={() => toggleChan(c.name)}>
                {c.icon} {c.name}{chans.includes(c.name) && <span className="chanchip__x">✓</span>}</button>))}</div>
          </div>
          <label className="fld"><span>Describe the work &amp; result</span>
            <textarea className="ta" rows="3" value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. When a new email arrives in Gmail labeled 'leads', pull the sender + company and output a clean lead record." /></label>
          <button className="btn btn--primary" onClick={buildFromDescribe}>✦ Build with Doty</button>
        </div>
      ) : (
        <>
          <label className="fld"><span>Step name</span><input className="inp" defaultValue={n.name} /></label>
          {prevNode && <label className="setrow check inline">
            <input type="checkbox" checked={isParallel} onChange={() => toggleParallel(store, fid, nid)} />
            <span className="check__box" /> ⑂ Run in parallel with “{prevNode.name}”</label>}
          <label className="fld"><span>What this step does (prompt)</span>
            <textarea className="ta" rows="2" value={desc} onChange={(e) => setDesc(e.target.value)} /></label>

          <div className="fld"><span>Inputs — MCP source (with trigger), a previous node, or a connected folder</span>
            <div className="ineditor">
              {inputs.map((it, k) => (
                <div className="inrow inrow--multi" key={k}>
                  <select className="sel" value={it.type} onChange={(e) => changeType(k, e.target.value)}>
                    <option value="mcp">🔌 MCP source</option>
                    <option value="form">📨 Form submission</option>
                    <option value="node">↳ Previous node</option>
                    <option value="folder">📁 Connected folder</option>
                  </select>
                  {it.type === "form" && <select className="sel flex1" value={it.source} onChange={(e) => setInput(k, { source: e.target.value })}>
                    {folderForms.length ? folderForms.map((fm) => <option key={fm.id} value={fm.name}>📨 {fm.name}</option>) : <option value="">No forms yet — build one in the Forms tab</option>}
                  </select>}
                  {it.type === "mcp" && <>
                    <select className="sel" value={it.source} onChange={(e) => setInput(k, { source: e.target.value, note: mcpTriggers(e.target.value)[0] || "" })}>
                      {catalog.map((c) => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                    </select>
                    <select className="sel" value={it.note} onChange={(e) => setInput(k, { note: e.target.value })} title="Trigger">
                      {mcpTriggers(it.source).map((t) => <option key={t} value={t}>⚡ {t}</option>)}
                    </select>
                  </>}
                  {it.type === "node" && <select className="sel flex1" value={it.source} onChange={(e) => setInput(k, { source: e.target.value })}>
                    {prevNodes.length ? prevNodes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>) : <option value="">No earlier nodes</option>}
                  </select>}
                  {it.type === "folder" && <select className="sel flex1" value={it.source} onChange={(e) => setInput(k, { source: e.target.value })}>
                    {connFolders.length ? connFolders.map((cf) => <option key={cf.id} value={cf.id}>📁 {cf.name}</option>) : <option value="">No connected folders</option>}
                  </select>}
                  <button className="iconbtn" onClick={() => removeInput(k)} title="Remove input">✕</button>
                </div>
              ))}
              <button className="btn btn--ghost btn--sm" onClick={addInput}>+ Add input</button>
            </div>
          </div>

          <div className="fld"><span>Assign minion — pick a category, then a minion</span>
            <div className="minionpick">
              <select className="sel" value={cat} onChange={(e) => { const c = e.target.value; setCat(c); setMinion(hub[c]?.[0]?.name || ""); }}>
                {cats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="sel flex1" value={minion} onChange={(e) => setMinion(e.target.value)}>
                {minionList.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            {minionInfo && <div className="minioninfo">
              <div className="minioninfo__top"><strong>{minionInfo.name}</strong><span className={"deptpill deptpill--" + cat.toLowerCase()}>{cat}</span></div>
              <p className="small">{minionInfo.skills}</p>
              <p className="muted small">Rule: {minionInfo.rules} · published by {minionInfo.by}</p>
            </div>}
          </div>

          <label className="fld"><span>Output — the result this step produces</span>
            <input className="inp" value={output} onChange={(e) => setOutput(e.target.value)} /></label>
        </>
      )}
    </ModalFrame>
  );
}

function MinionHubModal({ fid, setTab }) {
  const store = useStore();
  const { db } = store;
  return (
    <ModalFrame title="🤖 Team Minion Hub" footer={<button className="btn btn--ghost" onClick={store.closeModal}>Done</button>}>
      <p className="muted small">Anyone can publish a minion with skills + rules. Browse by department and drop one into this folder.</p>
      {Object.entries(db.minionHub).map(([dept, list]) => (
        <section className="hubdept" key={dept}>
          <h4 className="sub" style={{ margin: "12px 0 6px" }}>{dept}</h4>
          <div className="cardgrid">{list.map((m) => (
            <article className="hubcard" key={m.name}>
              <div className="agentcard__top"><strong>{m.name}</strong><span className={"deptpill deptpill--" + dept.toLowerCase()}>{dept}</span></div>
              <p className="small">{m.skills}</p><p className="muted small">rule: {m.rules} · by {m.by}</p>
              <button className="btn btn--primary btn--sm" onClick={() => addMinion(store, fid, m.name, dept.toLowerCase(), setTab)}>+ Add to folder</button></article>))}</div>
        </section>))}
    </ModalFrame>
  );
}

function ConnectModal({ fid }) {
  const store = useStore();
  const { db } = store;
  const f = db.folders[fid];
  const others = Object.values(db.folders).filter((o) => o.id !== fid);
  return (
    <ModalFrame title={`🔗 Connect 📁 ${f.name} to another folder`} footer={<button className="btn btn--ghost" onClick={store.closeModal}>Done</button>}>
      <p className="muted small">Connected folders share minions and file access — their workflows can collaborate.</p>
      <ul className="connlist">{others.map((o) => {
        const on = f.connectedFolders.includes(o.id);
        return (
          <li className="connrow" key={o.id}><span>📁 {o.name}</span>
            <button className={"btn btn--sm " + (on ? "btn--ghost" : "btn--primary")} onClick={() => toggleConnect(store, fid, o.id)}>{on ? "Disconnect" : "Connect"}</button></li>);
      })}</ul>
    </ModalFrame>
  );
}

function VersionsModal({ fid, did }) {
  const { db, closeModal, showToast } = useStore();
  const d = db.folders[fid]?.dynamicFiles.find((x) => x.id === did);
  if (!d) return null;
  return (
    <ModalFrame title={`🔁 ${d.name} — version history`} footer={<button className="btn btn--ghost" onClick={closeModal}>Close</button>}>
      <p className="muted small">Dynamic file · auto-updates on new info · every change stored as a commit. Restore or view any version.</p>
      <ol className="vtimeline">{d.versions.map((v, i) => (
        <li className={"vrow" + (i === 0 ? " is-current" : "")} key={v.v}>
          <span className="vrow__v">{v.v}</span>
          <div className="vrow__main"><p className="vrow__commit">{v.commit}</p><p className="muted small">{v.by} · {v.when}{i === 0 ? " · current" : ""}</p></div>
          <div className="vrow__act"><button className="btn btn--ghost btn--sm" onClick={() => showToast("Viewing " + v.v)}>View</button>
            {i > 0 && <button className="btn btn--ghost btn--sm" onClick={() => showToast("Restored " + v.v)}>Restore</button>}</div>
        </li>))}</ol>
    </ModalFrame>
  );
}

function GoalChatModal({ fid, setTab }) {
  const store = useStore();
  const [chat, setChat] = useState([
    { who: "coach", text: "What outcome do you want, and by when?" },
    { who: "you", text: "Get the Acme renewal signed before Friday." },
    { who: "coach", text: "What's blocking it today — pricing, legal, or champion buy-in?" },
  ]);
  const [val, setVal] = useState("");
  const send = () => {
    if (!val.trim()) return;
    setChat((c) => [...c, { who: "you", text: val }, { who: "coach", text: "Got it — I'll set milestones for that and assign the right minions." }]);
    setVal("");
  };
  return (
    <ModalFrame title="🎙 New goal — PR interview" footer={
      <Foot><button className="btn btn--ghost" onClick={store.closeModal}>Cancel</button>
        <button className="btn btn--primary" onClick={() => createGoal(store, fid, setTab)}>Create goal & assign minions</button></Foot>}>
      <p className="muted small">Tell Doty the goal. It interviews you (SPIN-style), then breaks it into milestones, assigns minions, and adds it to the board.</p>
      <div className="prchat">{chat.map((b, i) => (
        <div className={"bubble bubble--" + (b.who === "you" ? "buyer" : "coach")} key={i}>{b.who === "you" ? "You: " : "🤖 Doty: "}{b.text}</div>))}</div>
      <div className="boxsim__input"><input className="cmd__input" placeholder="Answer Doty…" value={val}
        onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} /><button className="btn btn--primary" onClick={send}>Send</button></div>
    </ModalFrame>
  );
}

const UKIND = { think: ["🧠", "reasoning"], comment: ["💬", "comment"], work: ["⚙", "did"] };
function MilestoneModal({ fid, gid, mid }) {
  const store = useStore();
  const { db, closeModal, showToast } = store;
  const g = db.folders[fid]?.board.goals.find((x) => x.id === gid);
  const m = g?.milestones.find((x) => x.id === mid);
  const [val, setVal] = useState("");
  if (!m) return null;
  const post = () => { if (!val.trim()) return; showToast("Comment posted to " + m.name); setVal(""); };
  return (
    <ModalFrame title={`◇ ${m.name}`} footer={<button className="btn btn--ghost" onClick={closeModal}>Close</button>}>
      <div className="msmeta">
        <span className={"badge badge--" + m.status}>{m.status}</span>
        <span className="ms__minions">{m.minions.map((x) => <span className="minipill minipill--xs" key={x}>{x}</span>)}</span>
      </div>
      <p className="msdesc">{m.description}</p>
      <div className="msfacts">
        <div className="msfact"><span className="muted small">Scheduled</span><strong>{m.scheduled || "—"}</strong></div>
        <div className="msfact"><span className="muted small">Dependencies</span>
          <strong>{m.depends?.length ? m.depends.map((d) => <span className="depchip" key={d}>⛔ {d}</span>) : "None"}</strong></div>
        {m.cron && <div className="msfact"><span className="muted small">Cron</span>
          <strong>{m.cron.label} <button className="btn btn--ghost btn--sm" onClick={() => openCronTimeline(store, fid, gid, mid)}>⏱ Timeline</button></strong></div>}
      </div>
      <h4 className="sub" style={{ margin: "14px 0 6px" }}>Updates — what the minions did & how they think</h4>
      <ul className="msupdates">{m.updates?.length ? m.updates.map((u, i) => (
        <li className={"msu msu--" + u.kind} key={i}>
          <span className="msu__ico" title={UKIND[u.kind]?.[1]}>{UKIND[u.kind]?.[0] || "•"}</span>
          <div className="msu__main"><p className="msu__text">{u.text}</p>
            <p className="muted small">{u.by} · {u.when} · {UKIND[u.kind]?.[1]}</p></div>
        </li>)) : <li className="muted">No updates yet — minions will log work and reasoning here as they go.</li>}</ul>
      <div className="boxsim__input"><input className="cmd__input" placeholder="Add a comment for the minions…" value={val}
        onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && post()} /><button className="btn btn--primary" onClick={post}>Post</button></div>
    </ModalFrame>
  );
}

function GoalReportModal({ fid, gid }) {
  const { db, closeModal } = useStore();
  const g = db.folders[fid]?.board.goals.find((x) => x.id === gid);
  const r = g?.report;
  if (!g) return null;
  return (
    <ModalFrame title={`📊 Report · ${g.name}`} footer={<button className="btn btn--ghost" onClick={closeModal}>Close</button>}>
      {r ? <>
        <p className="msdesc">{r.summary}</p>
        <div className="repmetrics">{(r.metrics || []).map((mt, i) => (
          <div className="repmetric" key={i}><span className="repmetric__v">{mt.value}</span><span className="muted small">{mt.label}</span></div>))}</div>
        <div className="card card--ai" style={{ marginTop: 12 }}>
          <h4 className="card__title"><span>✦</span> How it's going</h4>
          <p className="small">{r.narrative}</p>
          <p className="muted small">Last updated by {r.updatedBy} · {r.updated}</p></div>
        <h4 className="sub" style={{ margin: "14px 0 6px" }}>Milestone roll-up</h4>
        <ul className="repmilestones">{g.milestones.map((m) => (
          <li key={m.id}><span className={"ms__dot ms--" + m.status} /><span className="flex1">{m.name}</span>
            <span className="muted small">{m.status}</span></li>))}</ul>
      </> : <p className="muted">No report yet.</p>}
    </ModalFrame>
  );
}

const RUNST = { done: "✓", scheduled: "○", fail: "✕", run: "●" };
function CronTimelineModal({ fid, gid, mid }) {
  const { db, closeModal } = useStore();
  const m = db.folders[fid]?.board.goals.find((x) => x.id === gid)?.milestones.find((x) => x.id === mid);
  if (!m?.cron) return null;
  return (
    <ModalFrame title={`⏱ Cron timeline · ${m.name}`} footer={<button className="btn btn--ghost" onClick={closeModal}>Close</button>}>
      <p className="muted small">{m.cron.label} · <code>{m.cron.expr}</code> — every scheduled run of this task.</p>
      <ol className="crontl">{(m.cron.runs || []).map((run, i) => (
        <li className={"cronrun cronrun--" + run.status} key={i}>
          <span className="cronrun__st">{RUNST[run.status] || "•"}</span>
          <div className="cronrun__main"><p className="cronrun__when">{run.when}</p>
            {run.note && <p className="muted small">{run.note}</p>}</div>
          <span className="cronrun__badge">{run.status}</span>
        </li>))}</ol>
    </ModalFrame>
  );
}

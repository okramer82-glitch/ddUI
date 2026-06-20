import { useEffect, useState } from "react";
import { useStore } from "../../store/store.jsx";
import { navigate } from "../../lib/router.js";
import { findNode, findParentFolder, childFolders } from "../../lib/tree.js";
import { CircleBadge, Link } from "../../lib/ui.jsx";
import { getFolder, ensureFolder, runWorkflow, toggleParallel, setAccess, addPerson, removePerson } from "./folderActions.js";
import { typeMeta } from "./formMeta.js";
import { openWorkflowModal, openNodeEditor, openFormShare, openFormSettings, openMinionHub, openConnect, openVersions, openGoalChat, openMilestone, openGoalReport, openCronTimeline } from "./modals.jsx";

/** Hash route + real localhost URL for a folder's public form page. */
const formRoute = (fid, formId) => "#/form/" + fid + "/" + formId;
const formUrl = (fid, formId) => location.host + location.pathname + formRoute(fid, formId);

const TABS = [
  ["contents", "📂 Contents"], ["workflow", "⚙ Workflow"], ["board", "🗂 Board"],
  ["archive", "🗄 Archive"], ["forms", "📨 Forms"], ["minions", "🤖 Minions"], ["settings", "⚙ Settings"],
];
const ACCESS = { private: ["🔒", "Private — only you"], team: ["👥", "Shared with the whole team"], people: ["🔗", "Shared with specific people"] };
const NSTATE = { done: "✓ done", review: "🟡 review", pending: "⏳ pending", idle: "◦ idle", run: "● running", fail: "🔴 failed" };

export default function FolderView({ id }) {
  const store = useStore();
  const { db } = store;
  const [tab, setTab] = useState("contents");
  const [filter, setFilter] = useState(null);
  const [q, setQ] = useState("");

  useEffect(() => { ensureFolder(store, id); }, [id]); // eslint-disable-line

  const f = getFolder(db, id);
  if (!f) return <div className="view"><p className="muted">Folder not found.</p></div>;
  const conn = f.connectedFolders;
  const parent = findParentFolder(db.tree, id);

  const Body = { contents: Contents, workflow: Workflow, board: Board, archive: Archive, forms: Forms, minions: Minions, settings: FolderSettings }[tab];
  const access = f.access?.mode || "private";

  return (
    <div className="view view--wide">
      <header className="view__head">
        <div><h1 className="view__title">📁 {f.name} <CircleBadge c={f.circle} /> <span className="wfchip">workflow folder</span>
          <button className="accesschip" title={ACCESS[access][1]} onClick={() => setTab("settings")}>{ACCESS[access][0]} {access === "people" ? `${f.access.people.length} people` : access}</button>
          {parent && <Link to={"#/folder/" + parent.id} className="wfchip wfchip--sub">⛓ sub-workflow of {parent.name}</Link>}</h1>
          <p className="muted">{conn.length
            ? <>Connected: {conn.map((c) => <Link key={c} to={"#/folder/" + c} className="connpill">🔗 {db.folders[c]?.name} </Link>)}</>
            : parent
              ? <>This sub-folder runs its own chained workflow on the output of <Link to={"#/folder/" + parent.id} className="link">📁 {parent.name}</Link>.</>
              : "One main workflow per folder · hand off to sub-folders, each with its own chained workflow."}</p></div>
        <div className="view__actions">
          <button className="btn btn--ghost" onClick={() => openConnect(store, id)}>🔗 Connect folder</button>
          <button className="btn btn--ghost" onClick={() => openFormShare(store, id, setTab)}>📨 Share as form</button>
          <button className="btn btn--primary" onClick={() => runWorkflow(store, id, setTab)}>▶ Run with data</button>
        </div>
      </header>
      <div className="ftabs">{TABS.map(([k, l]) => (
        <button key={k} className={"ftab" + (tab === k ? " is-active" : "")} onClick={() => setTab(k)}>{l}</button>))}</div>
      <div className="ftab-body"><Body f={f} store={store} setTab={setTab} id={id} filter={filter} setFilter={setFilter} q={q} setQ={setQ} /></div>
    </div>
  );
}

/* ---- Contents ---- */
function Contents({ f }) {
  const { db } = useStore();
  const node = findNode(db.tree, f.id) || { children: [] };
  const kids = node.children || [];
  const out = f.workflow.outputTo;
  return (
    <div className="contentswrap">
      <div className="board__head"><h3 className="sub" style={{ margin: 0 }}>Items in 📁 {f.name}</h3>
        <button className="btn btn--primary btn--sm">+ New ▾</button></div>
      <p className="muted small">A folder holds your items <em>and</em> runs one workflow. Sub-folders can have their own workflows that chain from this one.</p>
      <ul className="itemrows">{kids.length ? kids.map((n) => {
        const route = n.type === "report" ? "#/report/" + n.id : n.type === "board" ? "#/canvas/" + n.id
          : n.type === "learn" ? "#/box/" + n.id : n.type === "flow" ? "#/flow/" + n.id : "#/folder/" + n.id;
        const isWf = n.type === "folder";
        const dyn = n.type === "dynfile" || n.dyn;
        const ico = isWf ? "📁" : dyn ? "🔁" : "📄";
        const meta = isWf ? "workflow sub-folder · chains from this folder"
          : { report: "updated 9:01", board: "12 deals · 2 stalled", learn: "62% mastered", doc: "edited yesterday" }[n.type] || "";
        return (
          <li className="itemrow" key={n.id} onClick={() => navigate(route)}>
            <span className={"tree__ico " + (isWf ? "" : dyn ? "g-dyn" : "g-static")}>{ico}</span>
            <span className="itemrow__name">{n.name}</span>
            {isWf && <span className="wfchip">workflow</span>}{!isWf && <span className={dyn ? "dynbadge" : "statbadge"}>{dyn ? "dynamic" : "static"}</span>}
            <span className="muted">{meta}</span></li>);
      }) : <li className="muted">No sub-items yet. This folder's workflow output and generated files live in the <strong>Archive</strong> tab.</li>}</ul>
      {out.subfolder && <p className="muted small" style={{ marginTop: 12 }}>⛓ Output routes to 📁 <Link to={"#/folder/" + out.subfolder} className="link">{db.folders[out.subfolder]?.name}</Link> — opening it runs its own workflow on this folder's output.</p>}
    </div>
  );
}

/* ---- Workflow ---- */
function InputChip({ i }) {
  if (i.type === "mcp") return <span className="ichip ichip--mcp" title="MCP source">🔌 {i.source}{i.note && <span className="muted"> ({i.note})</span>}</span>;
  if (i.type === "form") return <span className="ichip ichip--form" title="Form submission">📨 {i.source}{i.note && <span className="muted"> ({i.note})</span>}</span>;
  if (i.type === "folder") return <span className="ichip ichip--folder">📁 {i.source}</span>;
  return <span className="ichip ichip--node">↳ from {i.source}</span>;
}
/** Group consecutive nodes that share a non-null `group` into one parallel stage. */
function stagesOf(nodes) {
  const stages = [];
  for (const n of nodes) {
    const last = stages[stages.length - 1];
    if (n.group && last && last.group === n.group) last.nodes.push(n);
    else stages.push({ group: n.group || null, nodes: [n] });
  }
  return stages;
}
function WfNode({ n, num, parallel, store, id, subName }) {
  const onPar = (e) => { e.stopPropagation(); toggleParallel(store, id, n.id); };
  return (
    <div className={"wfnode " + n.status + (n.routeTo ? " wfnode--routes" : "")} onClick={() => openNodeEditor(store, id, n.id)}>
      <div className="wfnode__head"><span className="wfnode__n">{num}</span><strong>{n.name}</strong><span className="wfnode__minion">{n.minion}</span></div>
      <p className="wfnode__prompt">"{n.prompt}"</p>
      <div className="wfnode__io"><div className="wfnode__in">{n.inputs.map((inp, k) => <InputChip i={inp} key={k} />)}</div>
        <div className="wfnode__out">▶ <strong>{n.output}</strong></div></div>
      {n.routeTo && <div className="wfnode__route" title="Routed to a sub-folder">⤵ stored in 📁 {subName(n.routeTo.subfolder)}</div>}
      <div className="wfnode__foot">
        <span className="wfnode__state">{NSTATE[n.status] || n.status}</span>
        <button className={"wfnode__par" + (parallel ? " is-on" : "")} title="Run in parallel with the previous step" onClick={onPar}>⑂ {parallel ? "parallel" : "make parallel"}</button>
      </div>
    </div>
  );
}
function SubBranch({ c, sf, feeder, what, grand, store }) {
  const nodes = sf?.workflow.nodes || [];
  return (
    <div className="subbranch">
      <div className="subbranch__from">↳ {feeder ? <>from <strong>{feeder.name}</strong></> : "from workflow output"}</div>
      <div className="subbranch__card">
        <div className="subbranch__head">
          <span className="subbranch__title">📁 {c.name} <span className="wfchip">analysed &amp; stored here</span></span>
          <span className="subbranch__act">
            <Link to={"#/folder/" + c.id} className="link">open ↗</Link>
            <button className="btn btn--ghost btn--sm" onClick={() => { ensureFolder(store, c.id); openWorkflowModal(store, c.id); }}>⚙ {nodes.length ? "Edit" : "Set"} workflow</button>
          </span>
        </div>
        {what && <p className="subbranch__what">{what}</p>}
        {nodes.length
          ? <div className="wfminigraph">{nodes.map((mn, i) => (
            <span key={mn.id} className="wfmini">
              <span className="wfmininode"><b>{i + 1}</b> {mn.name} <em>{mn.minion}</em></span>
              {i < nodes.length - 1 && <span className="wfminiarrow">→</span>}
            </span>))}</div>
          : <p className="muted small">No sub-workflow yet — set one so this folder analyses what it receives.</p>}
        {grand.length > 0 && <p className="subbranch__chain">⛓ then chains to {grand.map((g, i) => <span key={g.id}>{i > 0 && ", "}<Link to={"#/folder/" + g.id} className="link">📁 {g.name}</Link></span>)}</p>}
      </div>
    </div>
  );
}
function Workflow({ f, store, setTab, id }) {
  const { db } = store;
  const subs = childFolders(db.tree, id);
  const parent = findParentFolder(db.tree, id);
  const subName = (sid) => db.folders[sid]?.name || findNode(db.tree, sid)?.name || "sub-folder";
  // which node feeds which sub-folder (node.routeTo.subfolder)
  const feedBy = {};
  f.workflow.nodes.forEach((n) => { if (n.routeTo?.subfolder) feedBy[n.routeTo.subfolder] = n; });
  if (!f.workflow.nodes.length) {
    return (
      <div className="wfwrap"><div className="wfdef card card--ai emptystate">
        <div className="emptystate__ico">✦</div><h3>No workflow defined yet</h3>
        <p className="muted">Describe in plain language what this folder should do — Doty builds the minions and the step-by-step flow. e.g. <em>"When a client uploads a file, summarize it, extract action items, and store a report here."</em></p>
        <button className="btn btn--primary" onClick={() => openWorkflowModal(store, id, setTab)}>✦ Define workflow with Doty</button>
      </div></div>);
  }
  return (
    <div className="wfwrap">
      {parent && <p className="muted small">⛓ This is a <strong>chained sub-workflow</strong> — it runs automatically on the output of <Link to={"#/folder/" + parent.id} className="link">📁 {parent.name}</Link>.</p>}
      <div className="wfdef card card--ai">
        <div className="wfdef__top"><h3 className="card__title"><span>✦</span> Main workflow (defined in plain text → built by Doty)</h3>
          <button className="btn btn--ghost btn--sm" onClick={() => openWorkflowModal(store, id, setTab)}>Edit / rebuild</button></div>
        <p className="wfdef__text">"{f.workflowText}"</p>
        <p className="muted small">Schedule: {f.workflow.schedule} · Output style: {f.outputStyle || "—"}</p>
      </div>
      <div className="wfgraph">{stagesOf(f.workflow.nodes).map((st, si, arr) => {
        const isPar = st.nodes.length > 1;
        return (
          <span key={si} style={{ display: "contents" }}>
            {isPar
              ? <div className="wfstage wfstage--parallel">
                <span className="wfstage__tag">⑂ parallel · runs together</span>
                <div className="wfstage__nodes">{st.nodes.map((n) => (
                  <WfNode key={n.id} n={n} num={si + 1} parallel store={store} id={id} subName={subName} />))}</div>
              </div>
              : <WfNode n={st.nodes[0]} num={si + 1} parallel={false} store={store} id={id} subName={subName} />}
            {si < arr.length - 1 && <div className="wfarrow">→</div>}
          </span>);
      })}</div>

      <div className="wfchain card"><h4 className="card__title"><span>⛓</span> Where it routes — sub-folders ({subs.length})</h4>
        <p className="muted small">The one main workflow above hands data off to these sub-folders. Each <strong>analyses &amp; stores</strong> what it receives, then runs its own chained workflow — so you can track the whole pipeline end-to-end.</p>
        {subs.length ? <div className="subbranches">{subs.map((c) => (
          <SubBranch key={c.id} c={c} sf={getFolder(db, c.id)} feeder={feedBy[c.id]}
            what={feedBy[c.id]?.routeTo?.what} grand={childFolders(db.tree, c.id)} store={store} />
        ))}</div> : <p className="muted small">No sub-folders yet. Add a sub-folder to chain another workflow from this one.</p>}
      </div>

      <div className="wfteam card"><h4 className="card__title">How the minions work together</h4>
        <p className="small">{f.teamwork || "—"}</p>
        <div className="row gap" style={{ marginTop: 8 }}>{f.minions.map((m) => <span className="minipill" key={m.id}>{m.name} <span className="muted">· {m.job}</span></span>)}</div></div>
    </div>
  );
}

/* ---- Board (goals → milestones, no ticket kanban) ---- */
function Board({ f, store, setTab, id }) {
  const goals = f.board.goals || [];
  return (
    <div className="boardwrap">
      <div className="board__head"><h3 className="sub" style={{ margin: 0 }}>Goals → milestones</h3>
        <button className="btn btn--primary btn--sm" onClick={() => openGoalChat(store, id, setTab)}>+ New goal (PR-interview)</button></div>
      <p className="muted small">Each goal has a live report (📊 on the right). Click a milestone to see its description and what the minions did & thought.</p>
      <div className="goals">{goals.length ? goals.map((g) => (
        <details className="goal" key={g.id} open={g.status === "in-progress"}>
          <summary><span className="goal__name">{g.name}</span>
            <span className="goal__right"><span className={"badge badge--" + g.status}>{g.status}</span>
              <button className="reportsign" title="View goal report" onClick={(e) => { e.preventDefault(); e.stopPropagation(); openGoalReport(store, id, g.id); }}>📊</button></span>
          </summary>
          <ul className="milestones-list">{g.milestones.map((m) => (
            <li className={"ms ms--" + m.status} key={m.id} onClick={() => openMilestone(store, id, g.id, m.id)}>
              <span className="ms__dot" />
              <span className="ms__name">{m.name}{m.cron && <span className="cronpill" title="Recurring (cron)">⏱ cron</span>}</span>
              <span className="ms__facts">
                {m.depends?.length ? <span className="depchip" title="Depends on">⛔ {m.depends.join(", ")}</span> : null}
                <span className="ms__sched muted small">🕘 {m.scheduled}</span>
              </span>
              <span className="ms__minions">{m.minions.map((x) => <span className="minipill minipill--xs" key={x}>{x}</span>)}</span>
              {m.cron && <button className="btn btn--ghost btn--sm ms__cronbtn" onClick={(e) => { e.stopPropagation(); openCronTimeline(store, id, g.id, m.id); }}>⏱ timeline</button>}
              <span className="ms__status">{m.status}</span>
            </li>))}</ul>
        </details>)) : <p className="muted">No goals yet — create one with the PR-interview.</p>}</div>
    </div>
  );
}

/* ---- Archive (folders → files; search · tag + analysis filters · dynamic inline) ---- */
const analysisOf = (x) => x.analysis || "analysed";
const ASTAT = { analysed: ["✅", "Analysed"], pending: ["⏳", "Not analysed"], scheduled: ["🕒", "Scheduled"] };
function flattenFiles(folders) {
  return (folders || []).flatMap((fl) => [...(fl.files || []), ...flattenFiles(fl.subfolders)]);
}
function filterFolders(folders, q, tag, astat) {
  const ql = q.trim().toLowerCase();
  return (folders || []).map((fl) => {
    const subfolders = filterFolders(fl.subfolders, q, tag, astat);
    const files = (fl.files || []).filter((x) =>
      (!ql || x.name.toLowerCase().includes(ql)) && (!tag || (x.tags || []).includes(tag)) && (!astat || analysisOf(x) === astat));
    if (!files.length && !subfolders.length) return null;
    return { ...fl, files, subfolders };
  }).filter(Boolean);
}
function AnPill({ x }) {
  const an = analysisOf(x);
  const extra = an === "scheduled" ? x.analyzeAt : an === "analysed" ? (x.analyzedAt || "").split(" · ")[0] : "";
  return <span className={"anpill anpill--" + an} title={x.analyzeNote || ""}>{ASTAT[an][0]} {ASTAT[an][1]}{extra ? " · " + extra : ""}</span>;
}
function FileRow({ x, store, id }) {
  const dyn = !!x.dynamic;
  return (
    <li className={"filerow filerow--" + (dyn ? "dynamic" : "static")} onClick={dyn ? () => openVersions(store, id, x.id) : undefined}
      title={dyn ? "Dynamic — connected to a workflow · auto-updates, keeps version history" : "Static — generated, not connected to any workflow"}>
      <span className="filerow__ico">{dyn ? "🔁" : "📄"}</span>
      <span className="filerow__name">{x.name} {dyn ? <span className="dynbadge">dynamic</span> : <span className="statbadge">static</span>} <AnPill x={x} /></span>
      <span className="filerow__tags">{(x.tags || []).map((t) => <span className="tag" key={t}>#{t}</span>)}</span>
      <span className="filerow__meta muted small">{dyn
        ? `${x.current} · updated ${x.updated} · ${x.versions?.length || 0} versions`
        : `${x.from ? "⟵ " + x.from : ""}${x.uploaded ? " · " + x.uploaded : x.created ? " · " + x.created : ""}${x.analyzeNote ? " · " + x.analyzeNote : ""}`}</span>
      {!dyn && x.path && <span className="filerow__ref muted small" title="Reference path">{x.path}</span>}
    </li>);
}
function ArFolder({ fl, store, id, depth, openAll }) {
  const count = (fl.files?.length || 0) + (fl.subfolders?.length || 0);
  return (
    <details className="arfolder" open={openAll || depth === 0}>
      <summary className="arfolder__sum"><span className="arfolder__name">📁 {fl.name}</span><span className="badge">{count}</span></summary>
      <div className="arfolder__body">
        {(fl.subfolders || []).map((s) => <ArFolder key={s.id} fl={s} store={store} id={id} depth={depth + 1} openAll={openAll} />)}
        <ul className="filelist">{(fl.files || []).map((x) => <FileRow key={x.id} x={x} store={store} id={id} />)}</ul>
      </div>
    </details>
  );
}
function Archive({ f, store, id, filter, setFilter, q, setQ }) {
  const a = f.archive;
  const [astat, setAstat] = useState(null);
  const all = flattenFiles(a.folders);
  const counts = { analysed: 0, pending: 0, scheduled: 0 };
  all.forEach((x) => { counts[analysisOf(x)]++; });
  const scheduled = all.filter((x) => analysisOf(x) === "scheduled");
  const folders = filterFolders(a.folders, q, filter, astat);
  const searching = !!(q.trim() || filter || astat);
  const Chip = (k) => <button className={"fchip fchip--" + k + (astat === k ? " is-active" : "")} onClick={() => setAstat(astat === k ? null : k)}>{ASTAT[k][0]} {ASTAT[k][1]} <span className="fchip__n">{counts[k]}</span></button>;
  return (
    <div className="archwrap">
      <p className="muted small">Two file types: <strong>📄 static</strong> (generated, not connected to a workflow) and <strong>🔁 dynamic</strong> (wired into a workflow — auto-updates, keeps version history). The pill also shows whether the workflow has <strong>analysed</strong> a file, hasn't <strong>yet</strong>, or it's <strong>scheduled</strong>.</p>
      <div className="archtools">
        <div className="searchbar"><span className="searchbar__ico">🔎</span>
          <input className="searchbar__inp" placeholder="Search files in this folder…" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && <button className="iconbtn" onClick={() => setQ("")}>✕</button>}</div>
        <div className="dropzone dropzone--sm" onClick={() => runWorkflow(store, id)}>⬆ Drop files</div>
      </div>
      <div className="filterbar"><span className="muted small">Analysis:</span>
        <button className={"fchip" + (!astat ? " is-active" : "")} onClick={() => setAstat(null)}>All <span className="fchip__n">{all.length}</span></button>
        {Chip("analysed")}{Chip("pending")}{Chip("scheduled")}</div>
      {scheduled.length > 0 && (
        <div className="schedtl card"><h4 className="card__title"><span>🕒</span> Scheduled for analysis ({scheduled.length})</h4>
          <ul className="schedtl__list">{scheduled.map((x) => (
            <li key={x.id} className="schedtl__row"><span className="schedtl__when">{x.analyzeAt || "soon"}</span>
              <span className="schedtl__name">📄 {x.name}</span><span className="muted small">{x.analyzeNote || ""}</span></li>))}</ul></div>)}
      <div className="filterbar"><span className="muted small">Tags:</span>
        <button className={"fchip" + (!filter ? " is-active" : "")} onClick={() => setFilter(null)}>All</button>
        {(a.filters || []).map((t) => <button key={t} className={"fchip" + (filter === t ? " is-active" : "")} onClick={() => setFilter(filter === t ? null : t)}>{t}</button>)}</div>
      <div className="arftree">{folders.length ? folders.map((fl) => (
        <ArFolder key={fl.id} fl={fl} store={store} id={id} depth={0} openAll={searching} />)) : <p className="muted small">No files match.</p>}</div>
    </div>
  );
}

/* ---- Forms ---- */
function Forms({ f, store, id, setTab }) {
  return (
    <div className="formswrap">
      <div className="card card--ai"><h4 className="card__title"><span>✦</span> Recommended form inputs <span className="muted small">— derived from your workflow</span></h4>
        <div className="recfields">{f.recommendedFormFields?.length ? f.recommendedFormFields.map((x, i) => <span className="recfield" key={i}>{x}</span>) : <span className="muted">Define a workflow to get suggestions.</span>}</div>
        <button className="btn btn--primary btn--sm" style={{ marginTop: 12 }} onClick={() => openFormShare(store, id, setTab)}>+ Build & share a form</button></div>
      <h3 className="sub">Published forms</h3>
      <div className="cardgrid">{f.forms.length ? f.forms.map((fm) => (
        <article className="formcard" key={fm.id} onClick={() => openFormSettings(store, id, fm.id)} title="Edit form settings">
          <div className="formcard__top"><div className="formcard__ico">{typeMeta(fm.type).ico}</div>
            {fm.live !== false && <span className="livedot" title="Live">● live</span>}</div>
          <strong>{fm.name}</strong>
          <p className="muted small">{fm.desc}</p><p className="formtype">{typeMeta(fm.type).name} · {fm.gate !== false ? "🪪 2-step" : "⚡ direct"}{fm.framework ? " · " + fm.framework.name : ""}{fm.output?.fileName ? " · 🔁 " + fm.output.fileName : ""}</p>
          <code className="formlink">{formUrl(id, fm.id)}</code>
          <div className="formcard__foot">
            <span className="link">⚙ Edit settings</span>
            <button className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); window.open(location.origin + location.pathname + formRoute(id, fm.id), "_blank", "noopener"); }}>See live ↗</button>
          </div>
        </article>)) : <p className="muted">No forms yet — build one above. The link goes live instantly on this localhost.</p>}</div>
      <p className="muted small" style={{ marginTop: 16 }}>Click a form to edit its settings &amp; copy its share link. “See live” opens the real public form in a new tab. A form can also feed the workflow directly: add it as a <strong>📨 Form submission</strong> input on any node.</p>
    </div>
  );
}

/* ---- Settings (privacy / sharing) ---- */
function FolderSettings({ f, store, id, setTab }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const access = f.access || { mode: "private", people: [] };
  const modes = [["private", "🔒", "Private", "Only you can open this folder."],
    ["team", "👥", "Whole team", "Everyone in this workspace can open it."],
    ["people", "🔗", "Specific people", "Only people you invite below."]];
  const invite = () => { if (!name.trim() || !email.trim()) { store.showToast("Add a name and email"); return; } addPerson(store, id, { name: name.trim(), email: email.trim(), role: "viewer" }); setName(""); setEmail(""); };
  return (
    <div className="setwrap">
      <h3 className="sub" style={{ marginTop: 0 }}>Who can access 📁 {f.name}</h3>
      <div className="accesscards">{modes.map(([m, ico, title, desc]) => (
        <button key={m} className={"accesscard" + (access.mode === m ? " is-active" : "")} onClick={() => setAccess(store, id, { mode: m })}>
          <span className="accesscard__ico">{ico}</span><strong>{title}</strong><span className="muted small">{desc}</span></button>))}</div>

      {access.mode === "people" && (
        <div className="card" style={{ marginTop: 16 }}>
          <h4 className="card__title">People with access</h4>
          <ul className="peoplelist">{access.people.length ? access.people.map((p) => (
            <li className="personrow" key={p.email}>
              <span className="avatar">{p.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}</span>
              <span className="personrow__main"><strong>{p.name}</strong><span className="muted small">{p.email}</span></span>
              <select className="sel" defaultValue={p.role}><option value="viewer">viewer</option><option value="editor">editor</option></select>
              <button className="iconbtn" title="Remove" onClick={() => removePerson(store, id, p.email)}>✕</button>
            </li>)) : <li className="muted small">No one invited yet.</li>}</ul>
          <div className="inviterow">
            <input className="inp" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="inp" placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && invite()} />
            <button className="btn btn--primary" onClick={invite}>+ Invite</button></div>
        </div>)}
    </div>
  );
}

/* ---- Minions ---- */
function Minions({ f, store, setTab, id }) {
  return (
    <div className="minionswrap">
      <div className="board__head"><h3 className="sub" style={{ margin: 0 }}>This folder's minions</h3>
        <div><button className="btn btn--ghost btn--sm" onClick={() => openMinionHub(store, id, setTab)}>+ From team Hub</button>{" "}
          <button className="btn btn--primary btn--sm" onClick={() => openWorkflowModal(store, id, setTab)}>+ Define minion</button></div></div>
      <div className="cardgrid">{f.minions.length ? f.minions.map((m) => (
        <article className="minioncard" key={m.id}>
          <div className="agentcard__top"><span className={"presence presence--" + (f.workflow.nodes.some((n) => n.minion === m.name && n.status === "review") ? "thinking" : "idle")} /><strong>{m.name}</strong>
            <span className={"deptpill deptpill--" + m.dept}>{m.dept}</span></div>
          <dl className="insp"><dt>Job</dt><dd>{m.job}</dd><dt>Rules</dt><dd>{m.rules}</dd><dt>Schedule</dt><dd>{m.schedule}</dd>
            <dt>MCPs</dt><dd>{m.mcps.map((x) => <span className="ichip ichip--mcp" key={x}>🔌 {x} </span>)}</dd></dl>
        </article>)) : <p className="muted">No minions yet — define your workflow or add from the Hub.</p>}</div>
      <div className="card" style={{ marginTop: 16 }}><h4 className="card__title">Output style & teamwork</h4>
        <p className="small"><strong>Style:</strong> {f.outputStyle || "—"}</p><p className="small"><strong>Teamwork:</strong> {f.teamwork || "—"}</p></div>
    </div>
  );
}

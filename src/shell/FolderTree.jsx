import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { useHashRoute, navigate } from "../lib/router.js";
import { findNode } from "../lib/tree.js";
import { CircleBadge } from "../lib/ui.jsx";

function WorkspaceMenu({ db, update }) {
  const [open, setOpen] = useState(false);
  const [nw, setNw] = useState("");
  const ws = db.workspaces.find((w) => w.id === db.activeWorkspace) || db.workspaces[0];
  const pick = (id) => { update((d) => { d.activeWorkspace = id; }); setOpen(false); };
  const create = () => {
    const name = nw.trim(); if (!name) return;
    const id = "ws-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 18) + "-" + db.workspaces.length;
    update((d) => { d.workspaces.push({ id, icon: "🗂", name, kind: "shared" }); d.activeWorkspace = id; });
    setNw(""); setOpen(false);
  };
  return (
    <div className="wsmenu">
      <button className="wsmenu__btn" onClick={() => setOpen((o) => !o)} title="Switch workspace">
        <span>{ws.icon}</span><span className="wsmenu__name">{ws.name}</span><span className="wsmenu__chev">▾</span>
      </button>
      {open && <>
        <div className="wsmenu__scrim" onClick={() => setOpen(false)} />
        <div className="wsmenu__pop">
          {db.workspaces.map((w) => (
            <button key={w.id} className={"wsmenu__item" + (w.id === db.activeWorkspace ? " is-active" : "")} onClick={() => pick(w.id)}>
              <span>{w.icon}</span><span className="wsmenu__iname">{w.name}</span>{w.id === db.activeWorkspace && <span className="wsmenu__check">✓</span>}</button>))}
          <div className="wsmenu__create">
            <input className="inp" placeholder="New workspace…" value={nw} onChange={(e) => setNw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} autoFocus />
            <button className="btn btn--primary btn--sm" onClick={create}>＋</button>
          </div>
        </div>
      </>}
    </div>
  );
}

const LEARN_BASES = ["upskilling", "srs", "tutor", "skills", "gaps", "learning", "box"];

export default function FolderTree() {
  const { db, update } = useStore();
  const { full, base, id } = useHashRoute();
  // A document (#/doc/:id) can belong to either tree — keep the right sidebar open.
  const docInLearn = base === "doc" && id && !!findNode(db.learnTree || [], id);
  const learn = LEARN_BASES.includes(base) || docInLearn;
  const tree = learn ? (db.learnTree || []) : db.tree;
  const treeKey = learn ? "learnTree" : "tree";

  const toggle = (id) => update((d) => { const n = findNode(d[treeKey], id); if (n) n.open = !n.open; });

  const Row = (n, depth) => {
    const pad = { paddingLeft: 8 + depth * 14 };
    if (n.type === "folder") {
      const kids = n.children || [];
      return (
        <div key={n.id}>
          <div className={"tree__row tree__row--folder" + (!learn && full === "#/folder/" + n.id ? " is-active" : "")}
            style={pad} aria-expanded={n.open} onClick={() => toggle(n.id)}>
            <span className="tree__chev tree__chev--folder">{n.open ? "▾" : "▸"}</span>
            <span className="tree__ico">📁</span>
            <span className="tree__label" onClick={learn ? undefined : (e) => { e.stopPropagation(); navigate("#/folder/" + n.id); }}>{n.name}</span>
            {!learn && <span className="wfdot" title="workflow folder">⚙</span>}
            {!learn && n.circle && <CircleBadge c={n.circle} />}
          </div>
          {n.open && kids.map((c) => Row(c, depth + 1))}
        </div>
      );
    }
    if (n.type === "lesson") {
      // Learning files open the HTML/CSS document editor too.
      const route = "#/doc/" + n.id;
      return (
        <button key={n.id} className={"tree__row" + (full === route ? " is-active" : "")} style={pad} onClick={() => navigate(route)}>
          <span className="tree__chev" />
          <span className="tree__ico g-lesson">📘</span>
          <span className="tree__label">{n.name}</span>
        </button>
      );
    }
    // Every file (workspace or learning) opens the HTML/CSS document editor.
    const route = "#/doc/" + n.id;
    const dyn = n.type === "dynfile" || n.dyn;
    return (
      <button key={n.id} className={"tree__row" + (full === route ? " is-active" : "")} style={pad} onClick={() => navigate(route)}>
        <span className="tree__chev" />
        <span className={"tree__ico " + (dyn ? "g-dyn" : "g-static")}>{dyn ? "🔁" : "📄"}</span>
        <span className="tree__label">{n.name}{dyn && <span className="dynbadge" style={{ marginLeft: 6 }}>dynamic</span>}</span>
      </button>
    );
  };

  return (
    <aside className="folders" aria-label="Folder tree">
      <header className="folders__head">
        {learn
          ? <span className="folders__ws">🎓 Learning</span>
          : <WorkspaceMenu db={db} update={update} />}
        <button className="iconbtn" title={learn ? "New topic" : "New folder"}>＋</button>
      </header>
      <div className="tree" role="tree">{tree.map((n) => Row(n, 0))}</div>
      <div className="folders__pinned">{learn ? <>
        <button className={"pinned__row" + (base === "srs" ? " is-active" : "")} onClick={() => navigate("#/srs")}>
          <span>🧠</span> Review SRS<span className="badge">{db.upskilling?.srs?.dueToday || 0}</span></button>
        <button className={"pinned__row" + (base === "tutor" ? " is-active" : "")} onClick={() => navigate("#/tutor")}>
          <span>👨‍🏫</span> Ask Tutor</button>
      </> : <>
        <button className={"pinned__row pinned__row--minions" + (full === "#/minions" ? " is-active" : "")} onClick={() => navigate("#/minions")}>
          <span>🤖</span> Minions<span className="badge">{Object.values(db.minionHub || {}).reduce((s, l) => s + l.length, 0)}</span></button>
        <button className={"pinned__row pinned__row--minions" + (full === "#/projects" ? " is-active" : "")} onClick={() => navigate("#/projects")}>
          <span>🛰</span> Projects &amp; Team<span className="badge">{(db.projects || []).length}</span></button>
      </>}</div>
    </aside>
  );
}

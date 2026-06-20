import { useEffect, useState, useCallback } from "react";
import { StoreProvider, useStore } from "./store/store.jsx";
import { useHashRoute, navigate } from "./lib/router.js";
import { findNode } from "./lib/tree.js";
import Rail from "./shell/Rail.jsx";
import FolderTree from "./shell/FolderTree.jsx";
import Tabs from "./shell/Tabs.jsx";
import Dock from "./shell/Dock.jsx";
import StatusBar from "./shell/StatusBar.jsx";
import CommandBar from "./shell/CommandBar.jsx";
import Modal from "./shell/Modal.jsx";
import Toast from "./shell/Toast.jsx";
import { SCREENS, FOCUS_SCREENS } from "./screens/index.js";

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

export function tabLabel(base, id, db) {
  switch (base) {
    case "pulse": return "🏠 Pulse";
    case "queue": return "✅ Action Queue";
    case "folder": return "📁 " + (findNode(db.tree, id)?.name || "Folder");
    case "flow": return "⚙ " + (db.flows[id]?.name || "Flow");
    case "run": return "⚙ Run #" + db.run.id;
    case "report": return "📊 " + (db.reports[id]?.name || "Report");
    case "doc": return "📄 " + (findNode(db.tree, id)?.name || "Document");
    case "canvas": return "🧩 " + (db.canvas[id]?.name || "Canvas");
    case "agents": return "🤖 Agents";
    case "minions": return "🤖 Minions";
    case "projects": return "🛰 Projects & Team";
    case "supervisor": return "🛰 Supervisor AI";
    case "learning": return "🎓 Learning";
    case "skills": return "✨ Skills";
    case "gaps": return "📡 Gap Radar";
    case "upskilling": return "🎓 Upskilling";
    case "srs": return "🧠 Spaced Repetition";
    case "verify":    return "🔵 Skill Verification";
    case "calendar":   return "📅 Calendar";
    case "messaging":  return "💬 Messages";
    case "team":       return "👥 Team Leader";
    case "pm":         return "📋 PM";
    case "org":        return "🌳 Team Org Chart";
    case "assign":     return "📋 Assign task";
    case "tutor": return "👨‍🏫 Tutor";
    case "search": return "🔎 Search";
    case "settings": return "⚙ Settings";
    default: return base;
  }
}

function Shell() {
  const { db, loading } = useStore();
  const { base, id, full } = useHashRoute();
  const [tabs, setTabs] = useState([{ route: "#/pulse" }, { route: "#/queue" }]);
  const [collapsed, setCollapsed] = useState(false);
  const [focusManual, setFocusManual] = useState(false);

  const focus = focusManual || FOCUS_SCREENS.includes(base);

  // keep current route open as a tab
  useEffect(() => {
    if (loading || FOCUS_SCREENS.includes(base)) return;
    setTabs((prev) => (prev.find((t) => t.route === full) ? prev : [...prev, { route: full }]));
  }, [full, base, loading]);

  useEffect(() => { document.body.classList.toggle("focus-mode", focus); }, [focus]);

  // keyboard map
  useEffect(() => {
    let gKey = false;
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); window.dispatchEvent(new CustomEvent("flowna:cmdk")); return; }
      if (meta && e.key === ".") { e.preventDefault(); setCollapsed((c) => !c); return; }
      if (meta && e.shiftKey && e.key.toLowerCase() === "f") { e.preventDefault(); setFocusManual((f) => !f); return; }
      if (e.target.matches?.("input,textarea,select")) return;
      if (!meta && e.key === "g") { gKey = true; setTimeout(() => (gKey = false), 600); return; }
      if (gKey) { const m = { p: "#/pulse", a: "#/queue", r: "#/gaps", l: "#/learning", s: "#/settings" }; if (m[e.key]) { navigate(m[e.key]); gKey = false; } }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (loading || !db) {
    return <div className="splash"><div className="splash__orb">⦿</div><p>The brain is waking up…</p></div>;
  }

  const Screen = SCREENS[base] || SCREENS.pulse;
  const closeTab = (route) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.route !== route);
      if (full === route && next.length) navigate(next[next.length - 1].route);
      return next.length ? next : prev;
    });
  };

  const shellCls = "shell" + (collapsed ? " dock-collapsed" : "") + (focus ? " dock-hidden" : "");

  return (
    <>
      <div className={shellCls} id="shell">
        <Rail />
        <FolderTree />
        <main className="stage" aria-label="Main stage">
          {!focus && <Tabs tabs={tabs} current={full} onClose={closeTab} />}
          <div className="stage__scroll" id="stageScroll">
            <Screen id={id} key={base + (id || "")} />
          </div>
        </main>
        {!focus && <Dock base={base} id={id} onCollapse={() => setCollapsed(true)} />}
        <StatusBar onToggleDock={() => setCollapsed((c) => !c)} onToggleFocus={() => setFocusManual((f) => !f)} />
      </div>
      <CommandBar />
      <Modal />
      <Toast />
    </>
  );
}

import { useStore } from "../store/store.jsx";
import { navigate } from "../lib/router.js";
import { tabLabel } from "../App.jsx";

export default function Tabs({ tabs, current, onClose }) {
  const { db } = useStore();
  const queueCount = db.queue.columns.filter((c) => c.id !== "done").reduce((a, c) => a + c.cards.length, 0);

  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => {
        const [, base, id] = t.route.split("/");
        const active = t.route === current;
        return (
          <button key={t.route} className={"tab" + (active ? " is-active" : "")}
            role="tab" aria-selected={active} onClick={() => navigate(t.route)}>
            {tabLabel(base, id, db)}
            {base === "queue" && <span className="tab__badge">{queueCount}</span>}
            {tabs.length > 1 && (
              <span className="tab__close" onClick={(e) => { e.stopPropagation(); onClose(t.route); }}>✕</span>
            )}
          </button>
        );
      })}
      <button className="tab tab--add" title="Command (⌘K)" onClick={() => window.dispatchEvent(new CustomEvent("flowna:cmdk"))}>＋</button>
    </div>
  );
}

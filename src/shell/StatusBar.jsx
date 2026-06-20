import { useState } from "react";
import { navigate } from "../lib/router.js";

/* Sample notifications for the prototype. */
const MINION_NOTIFS = [
  { who: "@Mary",           text: "drafted the Acme renewal follow-up", when: "2m" },
  { who: "@Frank",          text: "flagged an invoice mismatch in Zenith", when: "18m" },
  { who: "Lead Researcher", text: "found 5 new fintech leads", when: "1h" },
];
const OTHER_NOTIFS = [
  { text: "Sara mentioned you in #design", when: "5m" },
  { text: "Acme renewal deadline in 2 days", when: "1h" },
  { text: "New form submission in “Acme leads”", when: "3h" },
];

function NotifPanel({ type, onClose }) {
  const items = type === "minions" ? MINION_NOTIFS : OTHER_NOTIFS;
  const title = type === "minions" ? "🤖 AI team" : "🔔 Notifications";
  return (
    <>
      <div className="notif-scrim" onClick={onClose} />
      <div className="notif-panel">
        <div className="notif-panel__h">{title}</div>
        <div className="notif-panel__list">
          {items.map((n, i) => (
            <div className="notif-item" key={i}>
              {n.who && <span className="notif-item__who">{n.who}</span>}
              <span className="notif-item__text">{n.text}</span>
              <span className="notif-item__when">{n.when}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function StatusBar() {
  const [panel, setPanel] = useState(null); // "minions" | "other" | null
  const toggle = (p) => setPanel((cur) => (cur === p ? null : p));
  return (
    <footer className="statusbar statusbar--min" aria-label="Status bar">
      <div className="status__left" />
      <div className="status__right">
        <button className="sbtn" title="Assign a task to Doty" onClick={() => navigate("#/assign")}>
          <span className="sbtn__ico">📋</span> Assign task
        </button>
        <button className={"sbtn sbtn--icon" + (panel === "minions" ? " is-active" : "")}
          title="AI team notifications" onClick={() => toggle("minions")}>
          🤖<span className="sbtn__badge">{MINION_NOTIFS.length}</span>
        </button>
        <button className={"sbtn sbtn--icon" + (panel === "other" ? " is-active" : "")}
          title="Notifications" onClick={() => toggle("other")}>
          🔔<span className="sbtn__badge">{OTHER_NOTIFS.length}</span>
        </button>
      </div>
      {panel && <NotifPanel type={panel} onClose={() => setPanel(null)} />}
    </footer>
  );
}

import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { navigate } from "../lib/router.js";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const C_LABEL = { high: "🔴 High complexity", medium: "⬜ Normal", low: "🟢 Easy / Learning" };

/* Relation an event can reference: a folder, a PM ticket, or an upskilling session. */
const LINK_META = {
  folder:     { icon: "📁", noun: "Folder" },
  pm:         { icon: "📋", noun: "PM ticket" },
  box:        { icon: "🎓", noun: "Upskilling session" },
  verify:     { icon: "🔵", noun: "Verification" },
  srs:        { icon: "🧠", noun: "SRS deck" },
  upskilling: { icon: "🎓", noun: "Upskilling" },
};

function evRoute(ev) {
  if (ev.linkedType === "folder")     return "#/folder/" + ev.linkedId;
  if (ev.linkedType === "pm")         return "#/pm";
  if (ev.linkedType === "box")        return "#/box/"    + ev.linkedId;
  if (ev.linkedType === "verify")     return "#/verify/" + ev.linkedId;
  if (ev.linkedType === "srs")        return "#/srs";
  if (ev.linkedType === "upskilling") return "#/upskilling";
  return null;
}

const pad2 = (n) => String(n).padStart(2, "0");
const toDateStr = (y, m, d) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

const collectFolders = (nodes, out = [], prefix = "") => {
  for (const n of nodes || []) {
    if (n.type === "folder") {
      out.push({ id: n.id, label: prefix + n.name });
      collectFolders(n.children, out, prefix + n.name + " / ");
    }
  }
  return out;
};

/* ── Event popup ──────────────────────────────────────────── */
function EventPopup({ ev, onClose }) {
  const route = evRoute(ev);
  const meta  = LINK_META[ev.linkedType];
  return (
    <div className="cal-popup-bd" onClick={onClose}>
      <div className="cal-popup" onClick={e => e.stopPropagation()}>
        <button className="cal-popup__close iconbtn" onClick={onClose}>✕</button>

        <span className={"cal-popup__sev cal-sev--" + ev.complexity}>{C_LABEL[ev.complexity]}</span>
        <h3 className="cal-popup__title">{ev.title}</h3>

        <div className="cal-popup__when">
          <span>📅 {ev.date}</span>
          {ev.time     && <span>🕐 {ev.time}</span>}
          {ev.duration && <span>⏱ {ev.duration} min</span>}
        </div>

        {ev.description && (
          <p className="cal-popup__desc">{ev.description}</p>
        )}

        {route && meta && (
          <div className="cal-popup__rel">
            <span className="cal-popup__rel-cap">Related {meta.noun.toLowerCase()}</span>
            <button
              className="btn btn--primary cal-popup__link"
              onClick={() => { onClose(); navigate(route); }}
            >
              {meta.icon} {ev.linkedLabel} →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Add event popup ─────────────────────────────────────── */
function AddPopup({ onClose, onSave, attachOpts }) {
  const [form, setForm] = useState({
    title: "", date: "", time: "", complexity: "medium", description: "",
    attachType: "", attachId: "",
  });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const items = attachOpts[form.attachType] || [];

  return (
    <div className="cal-popup-bd" onClick={onClose}>
      <div className="cal-popup cal-popup--add" onClick={e => e.stopPropagation()}>
        <button className="cal-popup__close iconbtn" onClick={onClose}>✕</button>
        <h3 className="cal-popup__title" style={{ marginTop: 0 }}>New Event</h3>

        <input className="inp" placeholder="Event title *" value={form.title} onChange={f("title")} />

        <div className="cal-add__row">
          <input className="inp" type="date" value={form.date} onChange={f("date")} />
          <input className="inp" type="time" value={form.time} onChange={f("time")} />
        </div>

        <select className="inp" value={form.complexity} onChange={f("complexity")}>
          <option value="high">🔴 High complexity</option>
          <option value="medium">⬜ Normal</option>
          <option value="low">🟢 Easy / Learning</option>
        </select>

        {/* Attach the event to a folder / PM ticket / upskilling session */}
        <label className="cal-add__label">Attach to (optional)</label>
        <div className="cal-add__row">
          <select className="inp" value={form.attachType}
            onChange={(e) => setForm(p => ({ ...p, attachType: e.target.value, attachId: "" }))}>
            <option value="">🔗 No attachment</option>
            <option value="folder">📁 Folder</option>
            <option value="pm">📋 PM ticket</option>
            <option value="box">🎓 Upskilling session</option>
          </select>
          <select className="inp" value={form.attachId} disabled={!form.attachType}
            onChange={f("attachId")}>
            <option value="">{form.attachType ? "Choose…" : "—"}</option>
            {items.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </div>

        <textarea
          className="inp" rows={3} placeholder="Description (optional)"
          value={form.description} onChange={f("description")}
          style={{ resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={() => onSave(form)}>Add event</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main screen ─────────────────────────────────────────── */
export default function CalendarScreen() {
  const { db, update, showToast } = useStore();
  const now = new Date();

  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth());
  const [popupEv, setPopupEv] = useState(null);  // event object for popup
  const [addOpen, setAddOpen] = useState(false);

  const events   = db.calendarEvents || [];
  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  /* Items an event can be attached to (relation targets). */
  const attachOpts = {
    folder: collectFolders(db.tree),
    pm:     (db.pm?.tasks || []).map(t => ({ id: t.id, label: t.title })),
    box:    Object.entries(db.box || {}).map(([id, b]) => ({ id, label: b.name || id })),
  };

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0);  } else setMonth(m => m+1); };

  const eventsOn = (day) => {
    const ds = toDateStr(year, month, day);
    return events.filter(e => e.date === ds).sort((a,b) => (a.time||"").localeCompare(b.time||""));
  };

  const saveEvent = (form) => {
    if (!form.title.trim() || !form.date) { showToast("Title and date are required"); return; }
    let linkedType = null, linkedId = null, linkedLabel = null;
    if (form.attachType && form.attachId) {
      const item = (attachOpts[form.attachType] || []).find(o => o.id === form.attachId);
      if (item) { linkedType = form.attachType; linkedId = form.attachId; linkedLabel = item.label; }
    }
    update(d => {
      if (!d.calendarEvents) d.calendarEvents = [];
      d.calendarEvents.push({
        id: "ev-" + Date.now(),
        title: form.title.trim(),
        date: form.date,
        time: form.time || null,
        duration: null,
        complexity: form.complexity,
        description: form.description.trim() || null,
        linkedType, linkedId, linkedLabel,
      });
    });
    showToast(linkedType ? "📅 Event added & linked" : "📅 Event added");
    setAddOpen(false);
  };

  /* Calendar grid math */
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const numRows = Math.ceil(cells.length / 7);

  return (
    <div className="cal-wrap">

      {/* ── Toolbar ── */}
      <div className="cal-toolbar">
        <div className="cal-toolbar__nav">
          <button className="iconbtn cal-nav__btn" onClick={prevMonth}>‹</button>
          <h2 className="cal-nav__title">{MONTHS[month]} {year}</h2>
          <button className="iconbtn cal-nav__btn" onClick={nextMonth}>›</button>
        </div>

        <div className="cal-legend">
          <span className="cal-leg"><span className="cal-dot cal-dot--high"   />High</span>
          <span className="cal-leg"><span className="cal-dot cal-dot--low"    />Easy</span>
          <span className="cal-leg"><span className="cal-dot cal-dot--medium" />Normal</span>
        </div>

        <button className="btn btn--primary btn--sm" onClick={() => setAddOpen(true)}>＋ Add event</button>
      </div>

      {/* ── Day-name row ── */}
      <div className="cal-dnames">
        {DAYS.map(d => <div key={d} className="cal-dname">{d}</div>)}
      </div>

      {/* ── Calendar body ── */}
      <div className="cal-body">
        <div
          className="cal-grid"
          style={{ gridTemplateRows: `repeat(${numRows}, 1fr)` }}
        >
          {cells.map((day, i) => {
            if (!day) return <div key={"_"+i} className="cal-cell cal-cell--empty" />;
            const ds     = toDateStr(year, month, day);
            const dayEvs = eventsOn(day);
            const visible  = dayEvs.slice(0, 4);
            const overflow = dayEvs.length - 4;
            return (
              <div key={day} className={"cal-cell" + (ds === todayStr ? " cal-cell--today" : "")}>
                <span className="cal-cell__num">{day}</span>
                <div className="cal-cell__evs">
                  {visible.map(ev => (
                    <button
                      key={ev.id}
                      className={"cal-ev cal-ev--" + ev.complexity}
                      onClick={() => setPopupEv(ev)}
                    >
                      {ev.time && <span className="cal-ev__time">{ev.time}</span>}
                      <span className="cal-ev__title">{ev.title}</span>
                      {ev.linkedType && <span className="cal-ev__link" title="Linked">🔗</span>}
                    </button>
                  ))}
                  {overflow > 0 && (
                    <button
                      className="cal-more"
                      onClick={() => setPopupEv(dayEvs[4])}
                    >+{overflow} more</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Popups ── */}
      {popupEv && <EventPopup ev={popupEv} onClose={() => setPopupEv(null)} />}
      {addOpen  && <AddPopup  onClose={() => setAddOpen(false)} onSave={saveEvent} attachOpts={attachOpts} />}

    </div>
  );
}

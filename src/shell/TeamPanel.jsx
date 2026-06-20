import { useState } from "react";
import { useStore } from "../store/store.jsx";

const STATUS_COLOR = { online: "#22c55e", away: "#f59e0b", offline: "#6b7280" };

const PATHS = [
  { id: "p-sysdesign",  label: "System Design Fundamentals",        duration: "3 weeks" },
  { id: "p-sql",        label: "SQL and Data Analysis Bootcamp",     duration: "2 weeks" },
  { id: "p-async",      label: "Async JS and Error Patterns",        duration: "1 week"  },
  { id: "p-comms",      label: "Technical Communication",            duration: "1 week"  },
  { id: "p-btna",       label: "BTNA Negotiation Framework",         duration: "2 weeks" },
  { id: "p-python",     label: "Python OOP Sandbox",                 duration: "2 weeks" },
  { id: "p-k8s",        label: "Kubernetes Basics",                  duration: "1 week"  },
  { id: "p-leadership", label: "Engineering Leadership",             duration: "4 weeks" },
];

const FLOWNA_MSGS = [
  "Analysing team knowledge graph…",
  "Identifying skill prerequisites…",
  "Generating personalised learning path…",
];

/* ── Small avatar ─────────────────────────────────────────── */
function Av({ name, size = 32 }) {
  return (
    <div className="tp-av" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {name[0].toUpperCase()}
    </div>
  );
}

/* ── Member card ──────────────────────────────────────────── */
function MemberCard({ m, onAssign }) {
  const pct = Math.round((m.xp / m.xpMax) * 100);
  return (
    <div className="tp-member">
      <div className="tp-member__top">
        <Av name={m.name} />
        <span
          className="tp-status-dot"
          style={{ background: STATUS_COLOR[m.status] || STATUS_COLOR.offline }}
        />
        <div className="tp-member__info">
          <span className="tp-member__name">{m.name}</span>
          <span className="tp-member__role muted small">{m.role}</span>
        </div>
        <button className="btn btn--ghost btn--sm tp-assign-btn" onClick={() => onAssign(m)}>
          Assign →
        </button>
      </div>

      {/* XP bar */}
      <div className="tp-xp-row">
        <span className="muted small">{m.xp.toLocaleString()} XP</span>
        <span className="muted small">{pct}%</span>
      </div>
      <div className="tp-xp-bar"><div className="tp-xp-fill" style={{ width: pct + "%" }} /></div>

      {/* Stats */}
      <div className="tp-member__stats">
        <span className="tp-stat">📦 {m.activeBoxes} active</span>
        <span className="tp-stat">✅ {m.completedBoxes} done</span>
        {m.gaps?.length > 0 && (
          <span className="tp-stat tp-stat--gap">⚠ {m.gaps.length} gap{m.gaps.length > 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Current track */}
      {m.track && (
        <div className="tp-track">
          <span className="muted small">Track: </span>
          <span className="small">{m.track}</span>
        </div>
      )}

      {/* Assigned paths */}
      {m.assignedPaths?.length > 0 && (
        <div className="tp-assigned-paths">
          {m.assignedPaths.map((p, i) => (
            <span key={i} className="tp-path-chip">📚 {p}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Gap card ─────────────────────────────────────────────── */
function GapCard({ g, onAskDoty, onAssign }) {
  const sevCls = { high: "tp-sev--high", medium: "tp-sev--med", low: "tp-sev--low" }[g.severity] || "";
  return (
    <div className="tp-gap">
      <div className="tp-gap__head">
        <span className={"tp-sev " + sevCls}>{g.severity}</span>
        <strong className="tp-gap__title">{g.title}</strong>
      </div>
      <p className="tp-gap__reason small muted">{g.reason}</p>
      <div className="tp-gap__members">
        {(g.affectedMembers || []).map(n => (
          <span key={n} className="tp-member-chip">{n[0]}<span>{n}</span></span>
        ))}
      </div>

      {g.flownaStatus ? (
        <div className="tp-flowna-resp">
          <span className="tp-flowna-resp__ico">🤖</span>
          <p className="small">{g.flownaStatus}</p>
          <button className="btn btn--primary btn--sm" style={{ marginTop: 8 }} onClick={() => onAssign(g)}>
            Assign to team →
          </button>
        </div>
      ) : (
        <button className="btn btn--ghost btn--sm tp-ask-btn" onClick={() => onAskDoty(g.id)}>
          🤖 Ask Doty to create learning path
        </button>
      )}
    </div>
  );
}

/* ── Assign form ──────────────────────────────────────────── */
function AssignForm({ members, preselectedMember, onClose, onDone }) {
  const [memberId, setMemberId] = useState(preselectedMember?.id || "");
  const [pathId,   setPathId]   = useState("");
  const [note,     setNote]     = useState("");

  const submit = () => {
    if (!memberId || !pathId) return;
    const m    = members.find(x => x.id === memberId);
    const path = PATHS.find(p => p.id === pathId);
    onDone(m, path, note);
  };

  return (
    <div className="tp-form">
      <h4 className="tp-form__title">Assign Learning Path</h4>

      <label className="tp-label">Team member</label>
      <select className="inp" value={memberId} onChange={e => setMemberId(e.target.value)}>
        <option value="">Select member…</option>
        {members.map(m => (
          <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
        ))}
      </select>

      <label className="tp-label">Learning path</label>
      <select className="inp" value={pathId} onChange={e => setPathId(e.target.value)}>
        <option value="">Select path…</option>
        {PATHS.map(p => (
          <option key={p.id} value={p.id}>{p.label} ({p.duration})</option>
        ))}
      </select>

      <label className="tp-label">Personal note (optional)</label>
      <textarea
        className="inp" rows={2} placeholder="Context or expectation for this member…"
        value={note} onChange={e => setNote(e.target.value)}
        style={{ resize: "vertical" }}
      />

      <div className="tp-form__actions">
        <button className="btn btn--ghost btn--sm" onClick={onClose}>Cancel</button>
        <button
          className="btn btn--primary btn--sm"
          disabled={!memberId || !pathId}
          onClick={submit}
        >
          Assign →
        </button>
      </div>
    </div>
  );
}

/* ── Main panel ───────────────────────────────────────────── */
export default function TeamPanel({ open, onClose }) {
  const { db, update, showToast } = useStore();
  const [tab, setTab]                   = useState("team");    // team | gaps | assign
  const [preselect, setPreselect]       = useState(null);
  const [loadingGap, setLoadingGap]     = useState(null);
  const [loadingStep, setLoadingStep]   = useState(0);

  const members  = db.teamMembers  || [];
  const gaps     = db.teamGaps     || [];

  /* Ask Doty to create path for a gap */
  const askDoty = (gapId) => {
    setLoadingGap(gapId);
    setLoadingStep(0);
    let step = 0;
    const iv = setInterval(() => {
      step++;
      setLoadingStep(step);
      if (step >= FLOWNA_MSGS.length) {
        clearInterval(iv);
        update(d => {
          const g = (d.teamGaps || []).find(x => x.id === gapId);
          if (g) g.flownaStatus = "Doty built a " + (g.suggestedPath || "custom learning path") + ". Review and assign to the affected team members.";
        });
        setLoadingGap(null);
        showToast("🤖 Doty created a learning path");
      }
    }, 900);
  };

  /* Assign a gap's path to all affected members */
  const assignGapToTeam = (gap) => {
    update(d => {
      (d.teamMembers || []).forEach(m => {
        if ((gap.affectedMembers || []).includes(m.name)) {
          if (!m.assignedPaths) m.assignedPaths = [];
          if (!m.assignedPaths.includes(gap.suggestedPath)) {
            m.assignedPaths.push(gap.suggestedPath);
          }
        }
      });
      const g = (d.teamGaps || []).find(x => x.id === gap.id);
      if (g) g.assignedTo = gap.affectedMembers;
    });
    showToast("📚 Learning path assigned to " + gap.affectedMembers.join(", "));
  };

  /* Assign a specific path to a member */
  const doAssign = (member, path, note) => {
    update(d => {
      const m = (d.teamMembers || []).find(x => x.id === member.id);
      if (m) {
        if (!m.assignedPaths) m.assignedPaths = [];
        if (!m.assignedPaths.includes(path.label)) m.assignedPaths.push(path.label);
      }
      /* also seed into learning.boxes as an assigned box */
      if (d.learning?.boxes) {
        d.learning.boxes.unshift({
          id: "box-assigned-" + Date.now(),
          title: path.label,
          desc: note || "Assigned by team leader.",
          status: "not-started",
          xp: 0,
          total: 10,
          tags: ["assigned"],
          assignedBy: "Omar",
          assignedNote: note || "Assigned by team leader.",
          assignedTo: member.name,
        });
      }
    });
    showToast("📚 Assigned “" + path.label + "” to " + member.name);
    setTab("team");
    setPreselect(null);
  };

  const openAssign = (member) => { setPreselect(member); setTab("assign"); };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="tp-backdrop" onClick={onClose} />

      {/* Panel */}
      <div className="tp-panel">

        {/* Header */}
        <div className="tp-header">
          <div className="tp-header__left">
            <span className="tp-header__ico">👥</span>
            <div>
              <div className="tp-header__title">Team Leader</div>
              <div className="tp-header__badge">Team view only</div>
            </div>
          </div>
          <button className="iconbtn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="tp-tabs">
          {["team", "gaps", "assign"].map(t => (
            <button
              key={t}
              className={"tp-tab" + (tab === t ? " tp-tab--active" : "")}
              onClick={() => { setTab(t); if (t !== "assign") setPreselect(null); }}
            >
              {t === "team"   ? `👤 Team (${members.length})`      : ""}
              {t === "gaps"   ? `⚠ Gaps (${gaps.length})`          : ""}
              {t === "assign" ? "📚 Assign"                         : ""}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="tp-body">

          {/* ── Team ── */}
          {tab === "team" && (
            <div className="tp-list">
              {members.map(m => (
                <MemberCard key={m.id} m={m} onAssign={openAssign} />
              ))}
            </div>
          )}

          {/* ── Gaps ── */}
          {tab === "gaps" && (
            <div className="tp-list">
              <p className="muted small" style={{ marginBottom: 12 }}>
                Knowledge gaps identified across your team by Doty.
              </p>
              {gaps.map(g => (
                loadingGap === g.id ? (
                  <div key={g.id} className="tp-gap tp-gap--loading">
                    <div className="tp-spinner" />
                    <span className="small muted">{FLOWNA_MSGS[Math.min(loadingStep, FLOWNA_MSGS.length - 1)]}</span>
                  </div>
                ) : (
                  <GapCard
                    key={g.id}
                    g={g}
                    onAskDoty={askDoty}
                    onAssign={assignGapToTeam}
                  />
                )
              ))}
            </div>
          )}

          {/* ── Assign ── */}
          {tab === "assign" && (
            <AssignForm
              members={members}
              preselectedMember={preselect}
              onClose={() => { setTab("team"); setPreselect(null); }}
              onDone={doAssign}
            />
          )}

        </div>
      </div>
    </>
  );
}

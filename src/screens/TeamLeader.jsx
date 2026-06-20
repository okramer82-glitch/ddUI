import { useState } from "react";
import { useStore } from "../store/store.jsx";

const STATUS_COLOR = { online: "#22c55e", away: "#f59e0b", offline: "#6b7280" };

const PATHS = [
  { id: "p-sysdesign",  label: "System Design Fundamentals",    duration: "3 weeks" },
  { id: "p-sql",        label: "SQL and Data Analysis Bootcamp", duration: "2 weeks" },
  { id: "p-async",      label: "Async JS and Error Patterns",   duration: "1 week"  },
  { id: "p-comms",      label: "Technical Communication",       duration: "1 week"  },
  { id: "p-btna",       label: "BTNA Negotiation Framework",    duration: "2 weeks" },
  { id: "p-python",     label: "Python OOP Sandbox",            duration: "2 weeks" },
  { id: "p-k8s",        label: "Kubernetes Basics",             duration: "1 week"  },
  { id: "p-leadership", label: "Engineering Leadership",        duration: "4 weeks" },
];

const FLOWNA_STEPS = [
  "Analysing team knowledge graph…",
  "Identifying skill prerequisites…",
  "Generating personalised learning path…",
];

/* ── Avatar ───────────────────────────────────────────────── */
function Av({ name, size = 40 }) {
  return (
    <div className="tl-av" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name[0].toUpperCase()}
    </div>
  );
}

/* ── Member card (grid item) ──────────────────────────────── */
function MemberCard({ m, onAssign }) {
  const pct = Math.round((m.xp / m.xpMax) * 100);
  return (
    <div className="tl-member-card">
      <div className="tl-member-card__top">
        <Av name={m.name} size={44} />
        <div className="tl-member-card__meta">
          <div className="tl-member-card__name">
            {m.name}
            <span
              className="tl-status-dot"
              style={{ background: STATUS_COLOR[m.status] || STATUS_COLOR.offline }}
            />
          </div>
          <span className="tl-member-card__role">{m.role}</span>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={() => onAssign(m)}>
          Assign →
        </button>
      </div>

      {/* XP progress */}
      <div className="tl-xp">
        <div className="tl-xp__labels">
          <span>{m.xp.toLocaleString()} XP</span>
          <span>{pct}%</span>
        </div>
        <div className="tl-xp__bar">
          <div className="tl-xp__fill" style={{ width: pct + "%" }} />
        </div>
      </div>

      {/* Stats row */}
      <div className="tl-member-card__stats">
        <span className="tl-stat">📦 {m.activeBoxes} active</span>
        <span className="tl-stat">✅ {m.completedBoxes} done</span>
        {m.gaps?.length > 0 && (
          <span className="tl-stat tl-stat--gap">⚠ {m.gaps.length} gap{m.gaps.length > 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Track */}
      {m.track && (
        <div className="tl-member-card__track">
          <span className="muted small">Track</span>
          <span className="small">{m.track}</span>
        </div>
      )}

      {/* Skills */}
      {m.skills?.length > 0 && (
        <div className="tl-chip-row">
          {m.skills.map(s => <span key={s} className="tl-skill-chip">{s}</span>)}
        </div>
      )}

      {/* Assigned paths */}
      {m.assignedPaths?.length > 0 && (
        <div className="tl-chip-row tl-chip-row--assigned">
          {m.assignedPaths.map((p, i) => (
            <span key={i} className="tl-path-chip">📚 {p}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Gap card ─────────────────────────────────────────────── */
function GapCard({ g, onAskDoty, onAssign }) {
  const sevCls = { high: "tl-sev--high", medium: "tl-sev--med", low: "tl-sev--low" }[g.severity] || "";
  return (
    <div className="tl-gap-card">
      <div className="tl-gap-card__head">
        <span className={"tl-sev " + sevCls}>{g.severity}</span>
        <strong className="tl-gap-card__title">{g.title}</strong>
        <span className="tl-gap-card__cat muted small">{g.category}</span>
      </div>

      <p className="tl-gap-card__reason">{g.reason}</p>

      <div className="tl-gap-card__affected">
        <span className="muted small">Affected:</span>
        {(g.affectedMembers || []).map(n => (
          <span key={n} className="tl-member-chip">
            <span className="tl-member-chip__av">{n[0]}</span>
            {n}
          </span>
        ))}
      </div>

      {g.suggestedPath && (
        <div className="tl-gap-card__suggested">
          <span className="muted small">Suggested path:</span>
          <span className="small">{g.suggestedPath}</span>
        </div>
      )}

      {g.flownaStatus ? (
        <div className="tl-flowna-resp">
          <div className="tl-flowna-resp__head">
            <span>🤖</span>
            <span className="tl-flowna-resp__title">Doty Response</span>
            {g.assignedTo && <span className="tl-assigned-badge">Assigned ✓</span>}
          </div>
          <p className="small">{g.flownaStatus}</p>
          {!g.assignedTo && (
            <button
              className="btn btn--primary btn--sm"
              style={{ alignSelf: "flex-start", marginTop: 4 }}
              onClick={() => onAssign(g)}
            >
              Assign to affected members →
            </button>
          )}
        </div>
      ) : (
        <button className="btn btn--ghost btn--sm" style={{ alignSelf: "flex-start" }} onClick={() => onAskDoty(g.id)}>
          🤖 Ask Doty to create learning path
        </button>
      )}
    </div>
  );
}

/* ── Assign form ──────────────────────────────────────────── */
function AssignTab({ members, preselect, onBack, onDone }) {
  const [memberId, setMemberId] = useState(preselect?.id || "");
  const [pathId,   setPathId]   = useState("");
  const [note,     setNote]     = useState("");
  const ready = memberId && pathId;

  const submit = () => {
    if (!ready) return;
    onDone(members.find(m => m.id === memberId), PATHS.find(p => p.id === pathId), note);
  };

  return (
    <div className="tl-assign-wrap">
      <div className="tl-assign-card card">
        <h3 className="card__title">Assign Learning Path</h3>

        <div className="tl-assign-grid">
          {/* Member */}
          <div className="tl-field">
            <label className="tl-label">Team member</label>
            <select className="inp" value={memberId} onChange={e => setMemberId(e.target.value)}>
              <option value="">Choose member…</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
              ))}
            </select>
          </div>

          {/* Path */}
          <div className="tl-field">
            <label className="tl-label">Learning path</label>
            <select className="inp" value={pathId} onChange={e => setPathId(e.target.value)}>
              <option value="">Choose path…</option>
              {PATHS.map(p => (
                <option key={p.id} value={p.id}>{p.label} · {p.duration}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview */}
        {memberId && pathId && (
          <div className="tl-assign-preview">
            <Av name={members.find(m => m.id === memberId)?.name || "?"} size={36} />
            <div>
              <div className="small" style={{ fontWeight: 700 }}>{members.find(m => m.id === memberId)?.name}</div>
              <div className="small muted">will be assigned: <strong>{PATHS.find(p => p.id === pathId)?.label}</strong></div>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="tl-field">
          <label className="tl-label">Note to member (optional)</label>
          <textarea
            className="inp" rows={3}
            placeholder="Add context or expectations — this will appear as a note in their Learning Boxes…"
            value={note} onChange={e => setNote(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <div className="tl-assign-actions">
          <button className="btn btn--ghost" onClick={onBack}>← Back to team</button>
          <button
            className="btn btn--primary"
            disabled={!ready}
            onClick={submit}
          >
            Assign path →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main screen ──────────────────────────────────────────── */
export default function TeamLeader() {
  const { db, update, showToast } = useStore();
  const [tab, setTab]           = useState("team");
  const [preselect, setPreselect] = useState(null);
  const [loadingGap, setLoadingGap] = useState(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const members = db.teamMembers || [];
  const gaps    = db.teamGaps    || [];

  const askDoty = (gapId) => {
    setLoadingGap(gapId);
    setLoadingStep(0);
    let step = 0;
    const iv = setInterval(() => {
      step++;
      setLoadingStep(step);
      if (step >= FLOWNA_STEPS.length) {
        clearInterval(iv);
        update(d => {
          const g = (d.teamGaps || []).find(x => x.id === gapId);
          if (g) g.flownaStatus = "Doty created " + (g.suggestedPath || "a custom learning path") + ". Review and assign to the affected team members below.";
        });
        setLoadingGap(null);
        showToast("🤖 Doty created a learning path");
      }
    }, 900);
  };

  const assignGapToTeam = (gap) => {
    update(d => {
      (d.teamMembers || []).forEach(m => {
        if ((gap.affectedMembers || []).includes(m.name)) {
          if (!m.assignedPaths) m.assignedPaths = [];
          if (!m.assignedPaths.includes(gap.suggestedPath)) m.assignedPaths.push(gap.suggestedPath);
        }
      });
      const g = (d.teamGaps || []).find(x => x.id === gap.id);
      if (g) g.assignedTo = gap.affectedMembers;
    });
    showToast("📚 Path assigned to " + gap.affectedMembers.join(", "));
  };

  const doAssign = (member, path, note) => {
    update(d => {
      const m = (d.teamMembers || []).find(x => x.id === member.id);
      if (m) {
        if (!m.assignedPaths) m.assignedPaths = [];
        if (!m.assignedPaths.includes(path.label)) m.assignedPaths.push(path.label);
      }
      if (d.learning?.boxes) {
        d.learning.boxes.unshift({
          id: "box-assigned-" + Date.now(),
          title: path.label,
          desc: note || "Assigned by team leader.",
          status: "not-started",
          xp: 0, total: 10,
          tags: ["assigned"],
          assignedBy: "Omar",
          assignedNote: note || "Assigned by team leader.",
          assignedTo: member.name,
        });
      }
    });
    showToast('“' + path.label + '” assigned to ' + member.name);
    setPreselect(null);
    setTab("team");
  };

  const openAssign = (m) => { setPreselect(m); setTab("assign"); };

  const highGaps = gaps.filter(g => g.severity === "high").length;

  return (
    <div className="view view--wide">

      {/* Header */}
      <header className="view__head">
        <div>
          <h1 className="view__title">👥 Team Leader</h1>
          <p className="muted">Manage your team's learning paths, gaps, and skill development.</p>
        </div>
        <span className="tl-role-badge">Team Leader</span>
      </header>

      {/* Summary row */}
      <div className="tl-summary">
        <div className="tl-summary-card">
          <span className="tl-summary-card__val">{members.length}</span>
          <span className="tl-summary-card__label">Team members</span>
        </div>
        <div className="tl-summary-card">
          <span className="tl-summary-card__val">{members.reduce((n, m) => n + (m.activeBoxes || 0), 0)}</span>
          <span className="tl-summary-card__label">Active learning boxes</span>
        </div>
        <div className="tl-summary-card tl-summary-card--warn">
          <span className="tl-summary-card__val">{gaps.length}</span>
          <span className="tl-summary-card__label">Knowledge gaps</span>
        </div>
        <div className="tl-summary-card tl-summary-card--danger">
          <span className="tl-summary-card__val">{highGaps}</span>
          <span className="tl-summary-card__label">High-priority gaps</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tl-tabbar">
        <button
          className={"tl-tab" + (tab === "team" ? " tl-tab--active" : "")}
          onClick={() => setTab("team")}
        >
          👤 Team <span className="tl-tab__count">{members.length}</span>
        </button>
        <button
          className={"tl-tab" + (tab === "gaps" ? " tl-tab--active" : "")}
          onClick={() => setTab("gaps")}
        >
          ⚠ Gaps
          {highGaps > 0 && <span className="tl-tab__badge">{highGaps}</span>}
        </button>
        <button
          className={"tl-tab" + (tab === "assign" ? " tl-tab--active" : "")}
          onClick={() => { setTab("assign"); }}
        >
          📚 Assign Path
        </button>
      </div>

      {/* ── Team tab ── */}
      {tab === "team" && (
        <div className="tl-member-grid">
          {members.map(m => (
            <MemberCard key={m.id} m={m} onAssign={openAssign} />
          ))}
        </div>
      )}

      {/* ── Gaps tab ── */}
      {tab === "gaps" && (
        <div className="tl-gap-list">
          <p className="muted small" style={{ marginBottom: 4 }}>
            Knowledge gaps identified across your team by Doty. Ask Doty to create a learning path, then assign it to affected members.
          </p>
          {gaps.map(g =>
            loadingGap === g.id ? (
              <div key={g.id} className="tl-gap-loading">
                <div className="tl-spinner" />
                <span className="muted small">{FLOWNA_STEPS[Math.min(loadingStep, FLOWNA_STEPS.length - 1)]}</span>
              </div>
            ) : (
              <GapCard key={g.id} g={g} onAskDoty={askDoty} onAssign={assignGapToTeam} />
            )
          )}
        </div>
      )}

      {/* ── Assign tab ── */}
      {tab === "assign" && (
        <AssignTab
          members={members}
          preselect={preselect}
          onBack={() => { setPreselect(null); setTab("team"); }}
          onDone={doAssign}
        />
      )}

    </div>
  );
}

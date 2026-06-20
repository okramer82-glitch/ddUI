import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { navigate } from "../lib/router.js";

/* ===================== Hub ===================== */
export default function Upskilling() {
  const store = useStore();
  const { db } = store;
  const u = db.upskilling;
  const [tab, setTab] = useState("overview");
  const [selectedGap, setSelectedGap] = useState(null);

  if (selectedGap) {
    return <GapDetail gap={selectedGap} onBack={() => setSelectedGap(null)} store={store} />;
  }

  const features = [
    { ico: "🧠", name: "Spaced Repetition (SRS)", desc: `${u.srs.dueToday} cards due · 🔥 ${u.srs.streak}-day streak`, route: "#/srs" },
    { ico: "🎮", name: "Learning Boxes", desc: "Immersive simulations & sandboxes — guided or test mode", route: "#/learning" },
    { ico: "👨‍🏫", name: "Tutor", desc: "Ask anything — canvas maps the answer, topics saved to your tree", route: "#/tutor" },
  ];

  const gaps = (db.gapAlerts || []).filter((g) => !g.accepted);
  const pendingVerify = (db.verifyRequests || []).filter((r) => r.status === "pending");

  return (
    <div className="view view--wide">
      <header className="view__head">
        <div>
          <h1 className="view__title">🎓 Upskilling</h1>
          <p className="muted">An AI coach swarm that upskills you while you work — diagnose gaps, practice by doing, review at the right time.</p>
        </div>
        <span className="lvlpill">Lv {u.level} · {u.levelTitle}</span>
      </header>

      <div className="ftabs" style={{ marginBottom: 20 }}>
        <button className={"ftab" + (tab === "overview" ? " is-active" : "")} onClick={() => setTab("overview")}>Overview</button>
        <button className={"ftab" + (tab === "skills" ? " is-active" : "")} onClick={() => setTab("skills")}>🌳 My Skills</button>
        <button className={"ftab" + (tab === "goals" ? " is-active" : "")} onClick={() => setTab("goals")}>
          🎯 Long-term Goals
          {(db.longTermGoals || []).length > 0 && <span className="badge" style={{ marginLeft: 5 }}>{(db.longTermGoals || []).length}</span>}
        </button>
      </div>

      {tab === "overview" && <>
        <div className="lvlbar card">
          <div className="lvlbar__top"><strong>Level {u.level} — {u.levelTitle}</strong><span className="muted small">{u.xp} / {u.xpNext} XP → {u.nextLevel.to}</span></div>
          <div className="projbar"><span className="projbar__fill" style={{ width: Math.round(u.xp / u.xpNext * 100) + "%" }} /></div>
        </div>

        <div className="cardgrid upgrid">
          {features.map((f) => (
            <article className="upcard" key={f.route} onClick={() => navigate(f.route)}>
              <div className="upcard__ico">{f.ico}</div>
              <strong>{f.name}</strong>
              <p className="muted small">{f.desc}</p>
            </article>
          ))}
        </div>

        {/* Pending verification requests */}
        {pendingVerify.length > 0 && <>
          <div className="gap-alerts-head">
            <h3 className="sub" style={{ margin: 0 }}>
              🔵 Verification Requests
              <span className="badge" style={{ marginLeft: 8, background: "var(--accent)", color: "#fff" }}>{pendingVerify.length}</span>
            </h3>
            <p className="muted small">Your team leader has asked you to verify these skills — accept when you're ready.</p>
          </div>
          <div className="vreq-list">
            {pendingVerify.map((r) => (
              <div className="vreq-card" key={r.id}>
                <div className="vreq-card__top">
                  <div>
                    <span className="vreq-card__skill">{r.skillName}</span>
                    <span className="muted small" style={{ marginLeft: 8 }}>· {r.category}</span>
                  </div>
                  <span className="muted small">from {r.requestedBy} · {r.requestedAt}</span>
                </div>
                {r.note && <p className="vreq-card__note">"{r.note}"</p>}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn--primary btn--sm" onClick={() => navigate("#/verify/" + r.id)}>
                    Accept verification →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>}

        {/* Gap alerts */}
        <div className="gap-alerts-head">
          <h3 className="sub" style={{ margin: 0 }}>
            🚨 Knowledge Gap Alerts
            {gaps.length > 0 && <span className="badge badge--danger" style={{ marginLeft: 8 }}>{gaps.length}</span>}
          </h3>
          <p className="muted small">Detected from your work patterns, deal outcomes, and tutor sessions.</p>
        </div>

        {gaps.length === 0 ? (
          <div className="gap-empty"><span>✅ No open gaps — Doty is watching for new ones.</span></div>
        ) : (
          <div className="gap-list">
            {gaps.map((g) => (
              <GapCard key={g.id} gap={g} onClick={() => setSelectedGap(g)} />
            ))}
          </div>
        )}

      </>}

      {tab === "skills" && <SkillsTab db={db} store={store} />}
      {tab === "goals" && <LongTermGoals db={db} store={store} />}
    </div>
  );
}

/* ── Gap card (in list) ─────────────────────────────────── */
function GapCard({ gap, onClick }) {
  const sevLabel = { high: "🔴 High", medium: "🟡 Medium", low: "🟢 Low" };
  return (
    <div className={"gap-card gap-card--" + gap.severity} onClick={onClick}>
      <div className="gap-card__top">
        <div>
          <span className="gap-card__title">{gap.title}</span>
          <span className="muted small" style={{ marginLeft: 8 }}>· {gap.category}</span>
        </div>
        <span className={"gap-sev gap-sev--" + gap.severity}>{sevLabel[gap.severity] || gap.severity}</span>
      </div>
      <p className="gap-card__reason">{gap.reason}</p>
      <div className="gap-card__examples">
        {gap.examples.slice(0, 2).map((ex, i) => (
          <div className="gap-example" key={i}><span className="gap-bullet">▸</span>{ex}</div>
        ))}
      </div>
      <div className="gap-card__footer">
        <span className="muted small">{gap.roadmap.length} milestones</span>
        <button className="btn btn--ghost btn--sm">View roadmap →</button>
      </div>
    </div>
  );
}

/* ── Gap detail + roadmap ───────────────────────────────── */
function GapDetail({ gap, onBack, store }) {
  const accept = () => {
    store.update((d) => {
      const g = (d.gapAlerts || []).find((x) => x.id === gap.id);
      if (g) g.accepted = true;
    });
    store.showToast("✅ Gap accepted — added to your learning queue");
    onBack();
  };

  const typeLabel = { learn: "📚 Learn", practice: "🎮 Practice", apply: "🎯 Apply" };
  const typeClass = { learn: "gap-type--learn", practice: "gap-type--practice", apply: "gap-type--apply" };

  return (
    <div className="view view--wide">
      <header className="view__head" style={{ alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="btn btn--ghost btn--sm" style={{ alignSelf: "flex-start" }} onClick={onBack}>← Back to Upskilling</button>
          <h1 className="view__title" style={{ margin: 0 }}>{gap.title}</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className={"gap-sev gap-sev--" + gap.severity}>
              {gap.severity === "high" ? "🔴" : gap.severity === "medium" ? "🟡" : "🟢"} {gap.severity} priority
            </span>
            <span className="muted small">· {gap.category}</span>
          </div>
        </div>
        <button className="btn btn--primary" onClick={accept}>✅ Accept &amp; start solving</button>
      </header>

      {/* Why this gap */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card__title">Why Doty flagged this gap</h3>
        <p style={{ marginBottom: 12 }}>{gap.reason}</p>
        <h4 className="card__title" style={{ fontSize: "var(--fs-sm)", marginBottom: 6 }}>Examples from your work:</h4>
        <ul className="gap-examples-list">
          {gap.examples.map((ex, i) => (
            <li key={i} className="gap-examples-list__item">{ex}</li>
          ))}
        </ul>
      </div>

      {/* Roadmap */}
      <h3 className="sub">Suggested Roadmap <span className="muted small">· {gap.roadmap.length} milestones</span></h3>
      <div className="gap-roadmap">
        {gap.roadmap.map((m, i) => (
          <div className="gap-milestone" key={m.id}>
            <div className="gap-milestone__track">
              <div className="gap-milestone__num">{i + 1}</div>
              {i < gap.roadmap.length - 1 && <div className="gap-milestone__line" />}
            </div>
            <div className="gap-milestone__body">
              <div className="gap-milestone__name">{m.name}</div>
              <p className="muted small" style={{ margin: "4px 0 8px" }}>{m.desc}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className={"wfchip " + (typeClass[m.type] || "")}>{typeLabel[m.type] || m.type}</span>
                <span className="muted small">· {m.duration}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
        <button className="btn btn--primary" style={{ fontSize: 15, padding: "10px 24px" }} onClick={accept}>
          ✅ Accept &amp; start solving this gap
        </button>
      </div>
    </div>
  );
}

/* ── Skills Tree ────────────────────────────────────────── */
function SkillsTab({ db, store }) {
  const cats = db.skillsTree || [];
  const [open, setOpen] = useState(() => new Set(["cat-sales", "cat-eng"]));

  const toggle = (id) => setOpen((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const requestVerify = (catId, skillId, skillName) => {
    store.update((d) => {
      const cat = (d.skillsTree || []).find((c) => c.id === catId);
      if (cat) { const sk = cat.skills.find((s) => s.id === skillId); if (sk) sk.status = "verifying"; }
    });
    store.showToast(`🔵 Verification scheduled for "${skillName}" — Doty will quiz you in your next session`);
  };

  const totalVerified = cats.reduce((s, c) => s + c.skills.filter((sk) => sk.status === "verified").length, 0);
  const totalLearning = cats.reduce((s, c) => s + c.skills.filter((sk) => sk.status === "learning" || sk.status === "verifying").length, 0);

  return (
    <div>
      {/* Legend + totals */}
      <div className="sk-legend">
        <span className="sk-legend__item sk-legend__item--verified">✅ Verified <strong>{totalVerified}</strong></span>
        <span className="sk-legend__item sk-legend__item--learning">🟡 Learning <strong>{totalLearning}</strong></span>
        <span className="sk-legend__item sk-legend__item--verifying">🔵 Verifying</span>
        <span className="sk-legend__item sk-legend__item--ns">⬜ Not started</span>
        <span className="muted small" style={{ marginLeft: "auto" }}>Click a learning skill to ask Doty to verify it</span>
      </div>

      <div className="sktree">
        {cats.map((cat) => {
          const verified = cat.skills.filter((s) => s.status === "verified").length;
          const learning = cat.skills.filter((s) => s.status === "learning").length;
          const verifying = cat.skills.filter((s) => s.status === "verifying").length;
          const isOpen = open.has(cat.id);
          return (
            <div className="skcat" key={cat.id}>
              <button className="skcat__head" onClick={() => toggle(cat.id)}>
                <span className="skcat__chev">{isOpen ? "▾" : "▸"}</span>
                <span className="skcat__icon">{cat.icon}</span>
                <span className="skcat__name">{cat.name}</span>
                <span className="skcat__stats">
                  {verified > 0 && <span className="skstat skstat--verified">✅ {verified}</span>}
                  {(learning + verifying) > 0 && <span className="skstat skstat--learning">🟡 {learning + verifying}</span>}
                </span>
              </button>
              {isOpen && (
                <div className="skcat__skills">
                  {cat.skills.map((sk) => (
                    <SkillItem key={sk.id} skill={sk}
                      onVerify={() => requestVerify(cat.id, sk.id, sk.name)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SkillItem({ skill, onVerify }) {
  const ICON = { verified: "✅", learning: "🟡", verifying: "🔵", "not-started": "⬜" };
  return (
    <div className={"skitem skitem--" + skill.status}>
      <span className="skitem__icon">{ICON[skill.status] || "⬜"}</span>
      <span className="skitem__name">{skill.name}</span>
      {skill.status === "verified" && skill.verifiedAt && (
        <span className="skitem__date muted small">verified {skill.verifiedAt}</span>
      )}
      {skill.status === "learning" && (
        <button className="skitem__verify" onClick={onVerify}>Ask Doty to verify →</button>
      )}
      {skill.status === "verifying" && (
        <span className="skitem__verifying">🔵 Verification scheduled</span>
      )}
    </div>
  );
}

/* ── Long-term Goals ────────────────────────────────────── */
function LongTermGoals({ db, store }) {
  const goals = db.longTermGoals || [];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", deadline: "", desc: "" });

  const add = () => {
    if (!form.title.trim()) return;
    store.update((d) => {
      if (!d.longTermGoals) d.longTermGoals = [];
      d.longTermGoals.push({
        id: "ltg-" + Date.now(),
        title: form.title,
        deadline: form.deadline || null,
        desc: form.desc,
        progress: 0,
        milestones: [],
      });
    });
    store.showToast("🎯 Long-term goal added");
    setForm({ title: "", deadline: "", desc: "" });
    setAdding(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p className="muted" style={{ margin: 0 }}>Set 3–12 month learning objectives and track progress with milestones.</p>
        {!adding && <button className="btn btn--primary" onClick={() => setAdding(true)}>＋ Add goal</button>}
      </div>

      {adding && (
        <div className="card ltg-form">
          <h3 className="card__title">New Long-term Goal</h3>
          <input className="inp" placeholder="Goal title…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="inp" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} style={{ marginTop: 8 }} />
          <textarea className="inp" placeholder="What does achieving this look like? (optional)" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} rows={2} style={{ marginTop: 8, resize: "vertical" }} />
          <div className="row gap" style={{ marginTop: 10 }}>
            <button className="btn btn--ghost" onClick={() => setAdding(false)}>Cancel</button>
            <button className="btn btn--primary" disabled={!form.title.trim()} onClick={add}>Add goal</button>
          </div>
        </div>
      )}

      {goals.length === 0 && !adding ? (
        <div className="emptystate">
          <div className="emptystate__ico">🎯</div>
          <h3>No long-term goals yet</h3>
          <p className="muted">Set a 3–12 month goal and Doty will build a milestone path to get you there.</p>
          <button className="btn btn--primary" onClick={() => setAdding(true)}>＋ Set your first goal</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {goals.map((g) => <LtgCard key={g.id} goal={g} />)}
        </div>
      )}
    </div>
  );
}

function LtgCard({ goal }) {
  const done = (goal.milestones || []).filter((m) => m.done).length;
  const total = (goal.milestones || []).length;
  return (
    <div className="ltg-card card">
      <div className="ltg-card__top">
        <strong className="ltg-card__title">{goal.title}</strong>
        {goal.deadline && <span className="muted small">→ {goal.deadline}</span>}
      </div>
      {goal.desc && <p className="muted small" style={{ margin: "4px 0 10px" }}>{goal.desc}</p>}
      <div className="projbar" style={{ marginBottom: 6 }}>
        <span className="projbar__fill" style={{ width: goal.progress + "%" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: total > 0 ? 10 : 0 }}>
        <span className="muted small">{goal.progress}% complete</span>
        {total > 0 && <span className="muted small">{done}/{total} milestones</span>}
      </div>
      {total > 0 && (
        <ul className="milestones-list">
          {goal.milestones.map((m, i) => (
            <li className={"ms ms--" + (m.done ? "done" : "pending")} key={i}>
              <span className="ms__dot" />
              <span className="ms__name">{m.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ===================== SRS ===================== */
const SRS_TABS = [["review", "🔁 Review"], ["upcoming", "🗓 Upcoming"], ["add", "＋ Add from material"]];
export function SRS() {
  const store = useStore();
  const { db } = store;
  const s = db.upskilling.srs;
  const [tab, setTab] = useState("review");
  return (
    <div className="view view--wide">
      <header className="view__head"><div><h1 className="view__title">🧠 Spaced Repetition</h1>
        <p className="muted">Retrieval practice at optimal intervals — beat the forgetting curve.</p></div>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate("#/upskilling")}>← Upskilling</button></header>
      <div className="srsstats">
        <span><strong>{s.queue.length}</strong> due today</span>
        <span>🔥 {s.streak}-day streak</span>
        <span>{s.retention}% retention</span>
        <span>{(s.upcoming || []).length} scheduled ahead</span>
      </div>
      <div className="ftabs">{SRS_TABS.map(([k, l]) => (
        <button key={k} className={"ftab" + (tab === k ? " is-active" : "")} onClick={() => setTab(k)}>{l}</button>))}</div>
      {tab === "review" && <SrsReview s={s} store={store} />}
      {tab === "upcoming" && <SrsUpcoming s={s} />}
      {tab === "add" && <SrsAdd db={db} store={store} />}
    </div>
  );
}

function SrsReview({ s, store }) {
  const [i, setI] = useState(0);
  const [show, setShow] = useState(false);
  const card = s.queue[i];
  const rate = (r) => { store.showToast(`${card.deck}: scheduled (${r})`); setShow(false); setI((x) => x + 1); };
  if (!card) return (
    <div className="srscard srscard--done"><div className="pform__check">✓</div><h2>All caught up</h2>
      <p className="muted">You've cleared today's reviews. Come back tomorrow to keep the streak.</p>
      <button className="btn btn--ghost" onClick={() => { setI(0); setShow(false); }}>Review again</button></div>);
  return (
    <div className="srscard">
      <span className="srscard__deck">{card.deck} · {i + 1}/{s.queue.length} · next in {card.interval}</span>
      <p className="srscard__front">{card.front}</p>
      {show && <p className="srscard__back">{card.back}</p>}
      {!show
        ? <button className="btn btn--primary" onClick={() => setShow(true)}>Show answer</button>
        : <div className="srsrate">
          <button className="btn btn--ghost" onClick={() => rate("Again")}>Again</button>
          <button className="btn btn--ghost" onClick={() => rate("Hard")}>Hard</button>
          <button className="btn btn--primary" onClick={() => rate("Good")}>Good</button>
          <button className="btn btn--ghost" onClick={() => rate("Easy")}>Easy</button>
        </div>}
    </div>
  );
}

function SrsUpcoming({ s }) {
  const groups = [["Due today", s.queue.map((c) => ({ ...c, due: "today" }))]];
  const byDue = {};
  (s.upcoming || []).forEach((c) => { (byDue[c.due] = byDue[c.due] || []).push(c); });
  for (const due of Object.keys(byDue)) groups.push([due, byDue[due]]);
  return (
    <div className="srsup">
      <p className="muted small">Everything scheduled by Doty's adaptive engine — review at the moment you're about to forget.</p>
      {groups.map(([when, cards]) => (
        <div className="srsup__group" key={when}>
          <div className="srsup__when">{when === "today" ? "Due today" : when} <span className="badge">{cards.length}</span></div>
          <ul className="srsup__list">{cards.map((c) => (
            <li className="srsup__row" key={c.id}>
              <span className="srsup__deck">{c.deck}</span>
              <span className="srsup__front">{c.front}</span>
              <span className="muted small">{c.interval ? "interval " + c.interval : "in " + c.in + "d"}</span>
            </li>))}</ul>
        </div>))}
    </div>
  );
}

function addDeck(store, name, count) {
  store.update((d) => {
    const srs = d.upskilling.srs;
    srs.upcoming = srs.upcoming || [];
    srs.upcoming.unshift({ id: "ua" + (srs.upcoming.length + 1), deck: name, front: `${count} cards auto-generated from "${name}"`, due: "Tomorrow", in: 1 });
  });
  store.showToast(`Added ${count} cards from "${name}" to your SRS`);
}

function leavesUnder(nodes, acc = []) {
  for (const n of nodes || []) {
    if (n.type === "lesson") acc.push(n.id);
    else leavesUnder(n.children, acc);
  }
  return acc;
}

function PickNode({ node, depth, sel, toggleKeys, open, setOpen }) {
  if (node.type === "lesson") {
    return (
      <label className="pick__file" style={{ paddingLeft: 6 + depth * 16 }}>
        <input type="checkbox" checked={sel.has(node.id)} onChange={() => toggleKeys([node.id], !sel.has(node.id))} />
        <span className="g-lesson">📘</span> {node.name}</label>);
  }
  const kids = node.children || [];
  const isOpen = open.has(node.id);
  const myKeys = leavesUnder([node]);
  const allSel = myKeys.length > 0 && myKeys.every((k) => sel.has(k));
  const someSel = myKeys.some((k) => sel.has(k));
  const flip = () => setOpen((p) => { const n = new Set(p); n.has(node.id) ? n.delete(node.id) : n.add(node.id); return n; });
  return (
    <div>
      <div className="pick__row" style={{ paddingLeft: 6 + depth * 16 }}>
        <input type="checkbox" checked={allSel} ref={(el) => { if (el) el.indeterminate = !allSel && someSel; }} onChange={() => toggleKeys(myKeys, !allSel)} />
        <button className="pick__chev" onClick={flip}>{kids.length ? (isOpen ? "▾" : "▸") : ""}</button>
        <span className={depth === 0 ? "pick__root" : ""}>📁 {node.name}</span>
        <span className="muted small">{myKeys.length}</span>
      </div>
      {isOpen && kids.map((c) => <PickNode key={c.id} node={c} depth={depth + 1} sel={sel} toggleKeys={toggleKeys} open={open} setOpen={setOpen} />)}
    </div>
  );
}

function SrsAdd({ db, store }) {
  const roots = db.learnTree || [];
  const [sel, setSel] = useState(() => new Set());
  const [open, setOpen] = useState(() => new Set());
  const [custom, setCustom] = useState("");
  const toggleKeys = (keys, on) => setSel((prev) => { const n = new Set(prev); keys.forEach((k) => (on ? n.add(k) : n.delete(k))); return n; });
  const subjectCount = roots.filter((r) => leavesUnder([r]).some((k) => sel.has(k))).length;
  const generate = () => {
    if (!sel.size) { store.showToast("Tick some topics or lessons first"); return; }
    addDeck(store, `Mixed set · ${sel.size} lessons from ${subjectCount} subject${subjectCount > 1 ? "s" : ""}`, sel.size * 5);
    setSel(new Set());
  };
  return (
    <div className="srsadd">
      <p className="muted small">Browse your <strong>learning topics</strong> — tick a whole subject, a topic, or individual lessons. Mix as many as you like, then turn the set into a spaced-repetition deck.</p>
      <div className="pickwrap">{roots.length ? roots.map((r) => (
        <PickNode key={r.id} node={r} depth={0} sel={sel} toggleKeys={toggleKeys} open={open} setOpen={setOpen} />
      )) : <p className="muted small">No learning material yet.</p>}</div>
      <div className="pickbar">
        <span className="muted small">{sel.size ? `${sel.size} lessons selected · from ${subjectCount} subject${subjectCount > 1 ? "s" : ""}` : "Nothing selected"}</span>
        <span className="row gap">
          {sel.size > 0 && <button className="btn btn--ghost btn--sm" onClick={() => setSel(new Set())}>Clear</button>}
          <button className="btn btn--primary" disabled={!sel.size} onClick={generate}>＋ Generate SRS deck</button>
        </span>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h4 className="card__title">Or add from anything else</h4>
        <p className="muted small">Paste a topic, a doc name, or a note — Doty drafts cards from it.</p>
        <div className="inviterow"><input className="inp" placeholder="e.g. CAP theorem, subjunctive triggers…" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && custom.trim() && (addDeck(store, custom.trim(), 8), setCustom(""))} />
          <button className="btn btn--primary" onClick={() => { if (custom.trim()) { addDeck(store, custom.trim(), 8); setCustom(""); } }}>＋ Generate deck</button></div>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useStore } from "../store/store.jsx";

/* ── Design tokens ───────────────────────────────────────────
   Asana-style: muted surfaces, soft status/priority pills,
   completion circles, right-side task drawer. Uses app palette
   (--accent --violet --teal --amber --green --red --ink --muted).
   ──────────────────────────────────────────────────────────── */
const STATUSES = ["todo","in-progress","review","done","blocked"];
const STATUS = {
  "todo":        { label:"To do",       color:"var(--muted)"  },
  "in-progress": { label:"In progress", color:"var(--accent)" },
  "review":      { label:"In review",   color:"var(--amber)"  },
  "done":        { label:"Done",        color:"var(--green)"  },
  "blocked":     { label:"Blocked",     color:"var(--red)"    },
};
const PRIORITIES = ["high","medium","low"];
const PRIORITY = {
  high:   { label:"High",   color:"var(--red)"    },
  medium: { label:"Medium", color:"var(--amber)"  },
  low:    { label:"Low",    color:"var(--accent)" },
};
const GOAL_COLOR = {
  "goal-zenith":"#5AA9FF", "goal-flowna":"#8B7BFF",
  "goal-scale":"#FFC56E",  "goal-paper":"#97A2BC",
  "goal-infra":"#39D0D8",  "goal-cx":"#FF9FC7",
};
const goalColor = (id) => GOAL_COLOR[id] || "var(--muted)";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TODAY  = new Date().toISOString().slice(0,10);
const fmtDate = (iso) => { if(!iso) return ""; const [,m,d] = iso.split("-").map(Number); return MONTHS[m-1] + " " + d; };
function dueMeta(iso, done) {
  if (!iso) return { text:"", cls:"" };
  const text = fmtDate(iso);
  if (done)        return { text, cls:"pm-due--done" };
  if (iso < TODAY) return { text, cls:"pm-due--over" };
  const diff = (new Date(iso) - new Date(TODAY)) / 86400000;
  if (diff <= 2)   return { text, cls:"pm-due--soon" };
  return { text, cls:"" };
}

/* ── Primitives ──────────────────────────────────────────────── */
function Avatar({ name = "?", size = 24 }) {
  return (
    <span className="pm-av" style={{ width:size, height:size, fontSize:Math.round(size*0.42) }}>
      {name[0].toUpperCase()}
    </span>
  );
}

function Pill({ label, color, soft = true, onClick, active }) {
  const style = soft
    ? { color, background:`color-mix(in srgb, ${color} 15%, transparent)` }
    : { color:"#0E1117", background:color };
  return (
    <span
      className={"pm-pill" + (onClick ? " pm-pill--btn" : "") + (active ? " pm-pill--active" : "")}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <span className="pm-pill__dot" style={{ background:color }} />
      {label}
    </span>
  );
}
const StatusPill   = ({ s, ...p }) => <Pill label={STATUS[s].label}   color={STATUS[s].color}   {...p} />;
const PriorityPill = ({ p: pr, ...rest }) => <Pill label={PRIORITY[pr].label} color={PRIORITY[pr].color} {...rest} />;

function CompletionCircle({ done, onToggle, size = 18 }) {
  return (
    <button
      className={"pm-check-circle" + (done ? " pm-check-circle--done" : "")}
      style={{ width:size, height:size }}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      title={done ? "Mark incomplete" : "Mark complete"}
    >
      <svg viewBox="0 0 24 24" width={size*0.62} height={size*0.62}><path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
  );
}

function MiniProgress({ value, color = "var(--accent)" }) {
  return (
    <div className="pm-mini-prog"><div className="pm-mini-prog__fill" style={{ width:value+"%", background:color }} /></div>
  );
}

/* ── LIST view ───────────────────────────────────────────────── */
function ListView({ tasks, goals, members, groupBy, sortBy, collapsed, toggleCollapse, onOpen, onComplete, onQuickAdd }) {
  const sortTasks = (arr) => {
    const c = [...arr];
    if (sortBy === "due")      c.sort((a,b) => (a.dueDate||"9999") < (b.dueDate||"9999") ? -1 : 1);
    if (sortBy === "priority") { const o={high:0,medium:1,low:2}; c.sort((a,b)=>(o[a.priority]??9)-(o[b.priority]??9)); }
    if (sortBy === "title")    c.sort((a,b) => a.title.localeCompare(b.title));
    return c;
  };

  const sections = useMemo(() => {
    if (groupBy === "status")
      return STATUSES.map(s => ({ key:s, title:STATUS[s].label, color:STATUS[s].color, addCtx:{status:s},
        tasks:sortTasks(tasks.filter(t=>t.status===s)) }));
    if (groupBy === "assignee") {
      const names = [...new Set(tasks.map(t=>t.assignee))].sort();
      return names.map(n => ({ key:n, title:n, color:"var(--violet)", addCtx:{assignee:n}, avatar:n,
        tasks:sortTasks(tasks.filter(t=>t.assignee===n)) }));
    }
    // by goal (default) — interleave milestones
    return goals.map(g => {
      const gt = sortTasks(tasks.filter(t=>t.goalId===g.id));
      return { key:g.id, title:g.title, color:goalColor(g.id), goal:g, addCtx:{goalId:g.id},
        milestones:g.milestones||[], tasks:gt };
    }).filter(s => s.tasks.length || s.milestones?.length);
  }, [tasks, goals, groupBy, sortBy]);

  const noGoal = groupBy === "goal" ? sortTasks(tasks.filter(t => !t.goalId)) : [];

  return (
    <div className="pm-list">
      <div className="pm-list__head">
        <span className="pm-lc pm-lc--name">Task name</span>
        <span className="pm-lc pm-lc--assignee">Assignee</span>
        <span className="pm-lc pm-lc--due">Due date</span>
        <span className="pm-lc pm-lc--pri">Priority</span>
        <span className="pm-lc pm-lc--status">Status</span>
      </div>

      {sections.map(sec => {
        const isOpen = !collapsed.has(sec.key);
        const doneN  = sec.tasks.filter(t=>t.status==="done").length;
        return (
          <section key={sec.key} className="pm-sec">
            <header className="pm-sec__head" onClick={() => toggleCollapse(sec.key)}>
              <span className={"pm-sec__chev" + (isOpen ? " pm-sec__chev--open" : "")}>▸</span>
              <span className="pm-sec__bar" style={{ background:sec.color }} />
              <span className="pm-sec__title">{sec.title}</span>
              <span className="pm-sec__count">{sec.tasks.length}</span>
              {sec.goal && (
                <span className="pm-sec__prog">
                  <MiniProgress value={sec.goal.progress} color={sec.color} />
                  <span className="pm-sec__pct">{sec.goal.progress}%</span>
                </span>
              )}
            </header>

            {isOpen && (
              <div className="pm-sec__body">
                {/* milestones first (goal grouping) */}
                {sec.milestones?.map(m => {
                  const dm = dueMeta(m.dueDate, m.done);
                  return (
                    <div key={m.id} className={"pm-row pm-row--ms" + (m.done ? " pm-row--ms-done" : "")}>
                      <span className="pm-lc pm-lc--name">
                        <span className="pm-ms-diamond">◆</span>
                        <span className="pm-row__name">{m.title}</span>
                        <span className="pm-ms-tag">Milestone</span>
                      </span>
                      <span className="pm-lc pm-lc--assignee" />
                      <span className="pm-lc pm-lc--due"><span className={"pm-due "+dm.cls}>{dm.text}</span></span>
                      <span className="pm-lc pm-lc--pri" />
                      <span className="pm-lc pm-lc--status">
                        {m.done
                          ? <span className="pm-ms-state pm-ms-state--done">Reached</span>
                          : <span className="pm-ms-state">Upcoming</span>}
                      </span>
                    </div>
                  );
                })}

                {sec.tasks.map(t => {
                  const dm = dueMeta(t.dueDate, t.status==="done");
                  const sub = t.subtasks||[]; const sd = sub.filter(s=>s.done).length;
                  return (
                    <div key={t.id} className={"pm-row" + (t.status==="done" ? " pm-row--done" : "")} onClick={() => onOpen(t.id)}>
                      <span className="pm-lc pm-lc--name">
                        <CompletionCircle done={t.status==="done"} onToggle={() => onComplete(t.id)} />
                        <span className="pm-row__name">{t.title}</span>
                        {sub.length > 0 && <span className="pm-subchip" title="Subtasks">◑ {sd}/{sub.length}</span>}
                        {t.collaborators?.length > 0 && <span className="pm-shared-ic" title="Shared">⇄</span>}
                        {t.tags?.slice(0,2).map(tag => <span key={tag} className="pm-tag">{tag}</span>)}
                      </span>
                      <span className="pm-lc pm-lc--assignee"><Avatar name={t.assignee} /> <span className="pm-row__sub">{t.assignee}</span></span>
                      <span className="pm-lc pm-lc--due"><span className={"pm-due "+dm.cls}>{dm.text || "—"}</span></span>
                      <span className="pm-lc pm-lc--pri"><PriorityPill p={t.priority} /></span>
                      <span className="pm-lc pm-lc--status"><StatusPill s={t.status} /></span>
                    </div>
                  );
                })}

                <QuickAdd ctx={sec.addCtx} onAdd={onQuickAdd} />
              </div>
            )}
          </section>
        );
      })}

      {noGoal.length > 0 && (
        <section className="pm-sec">
          <header className="pm-sec__head">
            <span className="pm-sec__chev pm-sec__chev--open">▸</span>
            <span className="pm-sec__bar" style={{ background:"var(--muted)" }} />
            <span className="pm-sec__title">No goal</span>
            <span className="pm-sec__count">{noGoal.length}</span>
          </header>
          <div className="pm-sec__body">
            {noGoal.map(t => {
              const dm = dueMeta(t.dueDate, t.status==="done");
              return (
                <div key={t.id} className={"pm-row" + (t.status==="done" ? " pm-row--done" : "")} onClick={() => onOpen(t.id)}>
                  <span className="pm-lc pm-lc--name">
                    <CompletionCircle done={t.status==="done"} onToggle={() => onComplete(t.id)} />
                    <span className="pm-row__name">{t.title}</span>
                  </span>
                  <span className="pm-lc pm-lc--assignee"><Avatar name={t.assignee} /> <span className="pm-row__sub">{t.assignee}</span></span>
                  <span className="pm-lc pm-lc--due"><span className={"pm-due "+dm.cls}>{dm.text || "—"}</span></span>
                  <span className="pm-lc pm-lc--pri"><PriorityPill p={t.priority} /></span>
                  <span className="pm-lc pm-lc--status"><StatusPill s={t.status} /></span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function QuickAdd({ ctx, onAdd }) {
  const [open, setOpen] = useState(false);
  const [val, setVal]   = useState("");
  const submit = () => { const v = val.trim(); if (v) { onAdd(ctx, v); setVal(""); } };
  if (!open) return <button className="pm-addrow" onClick={() => setOpen(true)}>+ Add task</button>;
  return (
    <div className="pm-addrow pm-addrow--open">
      <span className="pm-check-circle pm-check-circle--ghost" />
      <input
        autoFocus className="pm-addinput" placeholder="Task name, then Enter"
        value={val} onChange={e=>setVal(e.target.value)}
        onKeyDown={e => { if (e.key==="Enter") submit(); if (e.key==="Escape") { setOpen(false); setVal(""); } }}
        onBlur={() => { if (!val.trim()) setOpen(false); }}
      />
    </div>
  );
}

/* ── BOARD view ──────────────────────────────────────────────── */
function BoardView({ tasks, goals, onOpen, onComplete }) {
  return (
    <div className="pm-board">
      {STATUSES.map(s => {
        const col = tasks.filter(t => t.status === s);
        return (
          <div key={s} className="pm-col">
            <div className="pm-col__head">
              <span className="pm-col__dot" style={{ background:STATUS[s].color }} />
              <span className="pm-col__title">{STATUS[s].label}</span>
              <span className="pm-col__count">{col.length}</span>
            </div>
            <div className="pm-col__body">
              {col.map(t => {
                const goal = goals.find(g=>g.id===t.goalId);
                const dm = dueMeta(t.dueDate, t.status==="done");
                const sub = t.subtasks||[]; const sd = sub.filter(x=>x.done).length;
                return (
                  <div key={t.id} className="pm-bcard" onClick={() => onOpen(t.id)}>
                    <div className="pm-bcard__top">
                      <CompletionCircle done={t.status==="done"} onToggle={() => onComplete(t.id)} size={16} />
                      <span className="pm-bcard__title">{t.title}</span>
                    </div>
                    {goal && <span className="pm-bcard__goal" style={{ color:goalColor(goal.id), background:`color-mix(in srgb, ${goalColor(goal.id)} 14%, transparent)` }}>{goal.title}</span>}
                    {sub.length > 0 && (
                      <div className="pm-bcard__sub">
                        <MiniProgress value={Math.round(sd/sub.length*100)} />
                        <span className="pm-bcard__subn">{sd}/{sub.length}</span>
                      </div>
                    )}
                    <div className="pm-bcard__foot">
                      <Avatar name={t.assignee} size={22} />
                      {dm.text && <span className={"pm-due "+dm.cls}>{dm.text}</span>}
                      <span className="pm-bcard__spacer" />
                      <PriorityPill p={t.priority} />
                    </div>
                  </div>
                );
              })}
              {col.length === 0 && <div className="pm-col__empty">No tasks</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── GOALS view ──────────────────────────────────────────────── */
function GoalsView({ goals, tasks, onOpen }) {
  return (
    <div className="pm-goals">
      {goals.map(g => {
        const gt   = tasks.filter(t=>t.goalId===g.id);
        const dn   = gt.filter(t=>t.status==="done").length;
        const ms   = g.milestones||[];
        const msDn = ms.filter(m=>m.done).length;
        const c    = goalColor(g.id);
        return (
          <div key={g.id} className="pm-goalcard">
            <div className="pm-goalcard__head">
              <span className="pm-goalcard__bar" style={{ background:c }} />
              <div className="pm-goalcard__title-wrap">
                <h3 className="pm-goalcard__title">{g.title}</h3>
                <p className="pm-goalcard__desc">{g.desc}</p>
              </div>
              <PriorityPill p={g.priority} />
            </div>

            <div className="pm-goalcard__meta">
              <span className="pm-goalcard__owner"><Avatar name={g.owner} size={22} /> {g.owner}</span>
              <span className="pm-goalcard__date">Due {fmtDate(g.deadline)}</span>
              <span className="pm-goalcard__stat">{dn}/{gt.length} tasks</span>
              <span className="pm-goalcard__stat">{msDn}/{ms.length} milestones</span>
            </div>

            <div className="pm-goalcard__prog">
              <MiniProgress value={g.progress} color={c} />
              <span className="pm-goalcard__pct" style={{ color:c }}>{g.progress}%</span>
            </div>

            {ms.length > 0 && (
              <div className="pm-timeline">
                {ms.map((m,i) => {
                  const over = m.dueDate && m.dueDate < TODAY && !m.done;
                  return (
                    <div key={m.id} className={"pm-tl-node" + (m.done ? " is-done" : "") + (over ? " is-over" : "")}>
                      {i>0 && <span className={"pm-tl-line" + (ms[i-1].done ? " is-done" : "")} />}
                      <span className="pm-tl-dot" style={ m.done ? { background:c, borderColor:c } : undefined } />
                      <span className="pm-tl-title">{m.title}</span>
                      <span className="pm-tl-date">{fmtDate(m.dueDate)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {gt.length > 0 && (
              <div className="pm-goalcard__tasks">
                {gt.map(t => (
                  <button key={t.id} className="pm-gtask" onClick={() => onOpen(t.id)}>
                    <span className="pm-pill__dot" style={{ background:STATUS[t.status].color }} />
                    <span className="pm-gtask__title">{t.title}</span>
                    <Avatar name={t.assignee} size={20} />
                    <span className="pm-gtask__status" style={{ color:STATUS[t.status].color }}>{STATUS[t.status].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── DASHBOARD view ──────────────────────────────────────────── */
function DashboardView({ tasks, goals, members, user }) {
  const total   = tasks.length;
  const done    = tasks.filter(t=>t.status==="done").length;
  const wip      = tasks.filter(t=>t.status==="in-progress").length;
  const overdue = tasks.filter(t=>t.dueDate && t.dueDate < TODAY && t.status!=="done").length;

  const people = [...new Set(tasks.map(t=>t.assignee))].map(name => {
    const mt = tasks.filter(t=>t.assignee===name);
    return {
      name, role: members.find(m=>m.name===name)?.role || (name===user.name ? "Founder" : "Team member"),
      total: mt.length, done: mt.filter(t=>t.status==="done").length,
      counts: STATUSES.map(s => mt.filter(t=>t.status===s).length),
    };
  }).sort((a,b)=>b.total-a.total);

  return (
    <div className="pm-dash">
      <div className="pm-dash__stats">
        <Stat label="Total tasks"  value={total} />
        <Stat label="Completed"    value={done}    color="var(--green)" sub={total ? Math.round(done/total*100)+"%" : "0%"} />
        <Stat label="In progress"  value={wip}     color="var(--accent)" />
        <Stat label="Overdue"      value={overdue} color="var(--red)" />
      </div>

      <div className="pm-dash__cols">
        {/* Completion by goal */}
        <div className="pm-panel">
          <h4 className="pm-panel__title">Progress by goal</h4>
          {goals.map(g => (
            <div key={g.id} className="pm-goalrow">
              <span className="pm-goalrow__name">{g.title}</span>
              <MiniProgress value={g.progress} color={goalColor(g.id)} />
              <span className="pm-goalrow__pct">{g.progress}%</span>
            </div>
          ))}
        </div>

        {/* Workload by person */}
        <div className="pm-panel">
          <h4 className="pm-panel__title">Workload by person</h4>
          {people.map(p => (
            <div key={p.name} className="pm-workrow">
              <Avatar name={p.name} size={30} />
              <div className="pm-workrow__main">
                <div className="pm-workrow__top">
                  <span className="pm-workrow__name">{p.name}</span>
                  <span className="pm-workrow__count">{p.done}/{p.total} done</span>
                </div>
                <div className="pm-workrow__bar">
                  {p.counts.map((n,i) => n>0 && (
                    <span key={i} className="pm-workrow__seg" style={{ flex:n, background:STATUS[STATUSES[i]].color }} title={STATUS[STATUSES[i]].label+": "+n} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
const Stat = ({ label, value, color="var(--ink)", sub }) => (
  <div className="pm-stat">
    <span className="pm-stat__val" style={{ color }}>{value}</span>
    <span className="pm-stat__label">{label}{sub && <em className="pm-stat__sub"> · {sub}</em>}</span>
  </div>
);

/* ── TASK DRAWER (right side) ────────────────────────────────── */
function TaskDrawer({ task, goals, members, user, onClose, onPatch, onToggleSub, onComplete }) {
  const goal = goals.find(g=>g.id===task.goalId);
  const sub  = task.subtasks||[]; const sd = sub.filter(s=>s.done).length;
  const assignees = [...new Set([user.name, ...members.map(m=>m.name)])];
  const dm = dueMeta(task.dueDate, task.status==="done");

  return (
    <>
      <div className="pm-drawer-bd" onClick={onClose} />
      <aside className="pm-drawer" role="dialog" aria-label="Task details">
        <div className="pm-drawer__bar">
          <button className={"pm-complete-btn" + (task.status==="done" ? " is-done" : "")} onClick={() => onComplete(task.id)}>
            <CompletionCircle done={task.status==="done"} onToggle={() => onComplete(task.id)} size={18} />
            {task.status==="done" ? "Completed" : "Mark complete"}
          </button>
          <span className="pm-drawer__spacer" />
          <span className="pm-drawer__id">{task.id}</span>
          <button className="pm-drawer__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="pm-drawer__body">
          <h2 className="pm-drawer__title">{task.title}</h2>

          <div className="pm-fields">
            <Field label="Assignee">
              <span className="pm-field-av"><Avatar name={task.assignee} size={24} /></span>
              <select className="pm-select" value={task.assignee} onChange={e=>onPatch(task.id,{assignee:e.target.value})}>
                {assignees.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>

            <Field label="Due date">
              <input type="date" className="pm-select pm-date" value={task.dueDate||""} onChange={e=>onPatch(task.id,{dueDate:e.target.value})} />
              {dm.text && <span className={"pm-due "+dm.cls} style={{ marginLeft:8 }}>{dm.text}</span>}
            </Field>

            <Field label="Goal">
              {goal
                ? <span className="pm-field-goal" style={{ color:goalColor(goal.id) }}>● {goal.title}</span>
                : <span className="muted small">None</span>}
            </Field>

            <Field label="Priority">
              <span className="pm-seg">
                {PRIORITIES.map(p => (
                  <button key={p} className={"pm-seg__btn"+(task.priority===p?" is-active":"")}
                    style={task.priority===p?{ color:PRIORITY[p].color, borderColor:PRIORITY[p].color }:undefined}
                    onClick={()=>onPatch(task.id,{priority:p})}>{PRIORITY[p].label}</button>
                ))}
              </span>
            </Field>

            <Field label="Status">
              <span className="pm-seg pm-seg--wrap">
                {STATUSES.map(s => (
                  <button key={s} className={"pm-seg__btn"+(task.status===s?" is-active":"")}
                    style={task.status===s?{ color:STATUS[s].color, borderColor:STATUS[s].color }:undefined}
                    onClick={()=>onPatch(task.id,{status:s})}>{STATUS[s].label}</button>
                ))}
              </span>
            </Field>

            {task.collaborators?.length > 0 && (
              <Field label="Collaborators">
                <span className="pm-collabs">
                  {task.collaborators.map(c => <span key={c} className="pm-collab"><Avatar name={c} size={20}/> {c}</span>)}
                </span>
              </Field>
            )}
          </div>

          {task.desc && (
            <div className="pm-drawer__sec">
              <h4 className="pm-drawer__label">Description</h4>
              <p className="pm-drawer__desc">{task.desc}</p>
            </div>
          )}

          {sub.length > 0 && (
            <div className="pm-drawer__sec">
              <div className="pm-drawer__subhead">
                <h4 className="pm-drawer__label">Subtasks</h4>
                <span className="pm-drawer__subcount">{sd}/{sub.length}</span>
                <MiniProgress value={Math.round(sd/sub.length*100)} />
              </div>
              <div className="pm-checklist">
                {sub.map(st => (
                  <label key={st.id} className={"pm-cl-item"+(st.done?" is-done":"")}>
                    <CompletionCircle done={st.done} onToggle={()=>onToggleSub(task.id, st.id)} size={16} />
                    <span>{st.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {task.tags?.length > 0 && (
            <div className="pm-drawer__sec">
              <h4 className="pm-drawer__label">Tags</h4>
              <div className="pm-tagwrap">{task.tags.map(t => <span key={t} className="pm-tag">{t}</span>)}</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
const Field = ({ label, children }) => (
  <div className="pm-field">
    <span className="pm-field__label">{label}</span>
    <span className="pm-field__val">{children}</span>
  </div>
);

/* ── MAIN ────────────────────────────────────────────────────── */
const VIEWS = [
  { id:"list",      label:"List"      },
  { id:"board",     label:"Board"     },
  { id:"goals",     label:"Goals"     },
  { id:"dashboard", label:"Dashboard" },
];

export default function PM() {
  const { db, update, showToast } = useStore();
  const [view, setView]       = useState("list");
  const [mine, setMine]       = useState(false);
  const [groupBy, setGroupBy] = useState("goal");
  const [sortBy, setSortBy]   = useState("due");
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [openId, setOpenId]   = useState(null);

  const pm      = db.pm          || { goals:[], tasks:[] };
  const members = db.teamMembers || [];
  const user    = db.user        || { name:"Osama" };
  const goals   = pm.goals       || [];
  const allTasks = pm.tasks      || [];

  const isMine = (t) => t.assignee === user.name || (t.collaborators||[]).includes(user.name);
  const viewTasks = mine ? allTasks.filter(isMine) : allTasks;

  /* mutations */
  const patchTask = (id, patch) => update(d => {
    const t = (d.pm?.tasks||[]).find(x=>x.id===id);
    if (t) Object.assign(t, patch);
  });
  const toggleComplete = (id) => {
    const t = allTasks.find(x=>x.id===id);
    const next = t?.status === "done" ? "todo" : "done";
    patchTask(id, { status: next });
    showToast(next === "done" ? "Task completed ✓" : "Task reopened");
  };
  const toggleSub = (id, stId) => update(d => {
    const t = (d.pm?.tasks||[]).find(x=>x.id===id);
    const s = t?.subtasks?.find(x=>x.id===stId);
    if (s) s.done = !s.done;
  });
  const quickAdd = (ctx, title) => {
    update(d => {
      d.pm.tasks.push({
        id: "t-" + Date.now(),
        title,
        goalId: ctx.goalId || null,
        assignee: ctx.assignee || user.name,
        reporter: user.name,
        priority: "medium",
        status: ctx.status || "todo",
        dueDate: null, tags: [], collaborators: [], desc: "", subtasks: [],
      });
    });
    showToast("Task added");
  };

  const toggleCollapse = (key) => setCollapsed(prev => {
    const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n;
  });

  const openTask = allTasks.find(t => t.id === openId) || null;
  const showControls = view === "list" || view === "board";

  return (
    <div className="view view--wide pm-screen">

      {/* Header */}
      <header className="pm-top">
        <div className="pm-top__title">
          <h1 className="view__title">Projects</h1>
          <span className="pm-top__sub">{allTasks.length} tasks · {goals.length} goals</span>
        </div>
      </header>

      {/* View switcher */}
      <nav className="pm-views">
        {VIEWS.map(v => (
          <button key={v.id} className={"pm-viewtab"+(view===v.id?" is-active":"")} onClick={()=>setView(v.id)}>
            {v.label}
          </button>
        ))}
      </nav>

      {/* Control bar */}
      {showControls && (
        <div className="pm-controls">
          <button className={"pm-filter"+(mine?" is-active":"")} onClick={()=>setMine(m=>!m)}>
            <span className="pm-filter__check">{mine ? "✓" : ""}</span> My tasks
          </button>
          {view === "list" && (
            <>
              <label className="pm-ctl">Group
                <select className="pm-ctl__sel" value={groupBy} onChange={e=>setGroupBy(e.target.value)}>
                  <option value="goal">Goal</option>
                  <option value="status">Status</option>
                  <option value="assignee">Assignee</option>
                </select>
              </label>
              <label className="pm-ctl">Sort
                <select className="pm-ctl__sel" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                  <option value="due">Due date</option>
                  <option value="priority">Priority</option>
                  <option value="title">Name</option>
                </select>
              </label>
            </>
          )}
          <span className="pm-controls__spacer" />
          <span className="pm-controls__count muted small">{viewTasks.length} shown</span>
        </div>
      )}

      {/* Content */}
      {view === "list" && (
        <ListView
          tasks={viewTasks} goals={goals} members={members}
          groupBy={groupBy} sortBy={sortBy}
          collapsed={collapsed} toggleCollapse={toggleCollapse}
          onOpen={setOpenId} onComplete={toggleComplete} onQuickAdd={quickAdd}
        />
      )}
      {view === "board"     && <BoardView tasks={viewTasks} goals={goals} onOpen={setOpenId} onComplete={toggleComplete} />}
      {view === "goals"     && <GoalsView goals={goals} tasks={allTasks} onOpen={setOpenId} />}
      {view === "dashboard" && <DashboardView tasks={allTasks} goals={goals} members={members} user={user} />}

      {/* Drawer */}
      {openTask && (
        <TaskDrawer
          task={openTask} goals={goals} members={members} user={user}
          onClose={() => setOpenId(null)}
          onPatch={patchTask} onToggleSub={toggleSub} onComplete={toggleComplete}
        />
      )}
    </div>
  );
}

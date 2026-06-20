import { useState } from "react";
import { useStore } from "../store/store.jsx";

/* ============================================================
   OrgChart — team hierarchy builder for the workspace.
   A team leader starts from scratch and organises members into
   a top-down org chart (manager → reports). Persisted to
   db.orgChart = { nodes: [{ id, name, role, memberId, parentId }] }.
   ============================================================ */

const genId = () => "org-" + Math.random().toString(36).slice(2, 9);

/* ── Add / edit form (overlay) ────────────────────────────── */
function NodeForm({ mode, node, parentName, pool, onCancel, onSubmit }) {
  // person id: "" = vacant/custom role
  const [personId, setPersonId] = useState(node?.memberId || "");
  const [name, setName] = useState(node?.name || "");
  const [role, setRole] = useState(node?.role || "");

  const pickPerson = (pid) => {
    setPersonId(pid);
    const p = pool.find((x) => x.id === pid);
    if (p) { setName(p.name); if (!role || mode === "add") setRole(p.role); }
    else if (mode === "add") { setName(""); }
  };

  const ready = (personId && name) || (!personId && name.trim() && role.trim());
  const submit = () => {
    if (!ready) return;
    onSubmit({ memberId: personId || null, name: name.trim(), role: role.trim() || "Team member" });
  };

  return (
    <div className="org-form-bd" onClick={onCancel}>
      <div className="org-form" onClick={(e) => e.stopPropagation()}>
        <h3 className="org-form__title">
          {mode === "add" ? (parentName ? `Add a report under ${parentName}` : "Add the top of the team") : "Edit position"}
        </h3>

        <label className="org-field">
          <span className="org-field__label">Person</span>
          <select className="inp" value={personId} onChange={(e) => pickPerson(e.target.value)}>
            <option value="">— Vacant / custom role —</option>
            {pool.map((p) => (
              <option key={p.id} value={p.id}>{p.name} · {p.role}</option>
            ))}
          </select>
        </label>

        {!personId && (
          <label className="org-field">
            <span className="org-field__label">Name</span>
            <input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Open role, or a name" />
          </label>
        )}

        <label className="org-field">
          <span className="org-field__label">Role / title</span>
          <input className="inp" value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Backend Engineer" />
        </label>

        {personId && (
          <div className="org-form__preview">
            <span className="org-av" style={{ width: 34, height: 34, fontSize: 14 }}>{name[0]?.toUpperCase()}</span>
            <div><div className="org-form__pname">{name}</div><div className="org-form__prole muted small">{role}</div></div>
          </div>
        )}

        <div className="org-form__actions">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary" disabled={!ready} onClick={submit}>
            {mode === "add" ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Recursive node ───────────────────────────────────────── */
function OrgNode({ node, childrenOf, onAdd, onEdit, onRemove }) {
  const kids = childrenOf(node.id);
  const vacant = !node.memberId;
  return (
    <li>
      <div className={"org-card" + (vacant ? " org-card--vacant" : "")}>
        <div className="org-card__tools">
          <button className="org-tool" title="Add report" onClick={() => onAdd(node)}>＋</button>
          <button className="org-tool" title="Edit" onClick={() => onEdit(node)}>✎</button>
          <button className="org-tool org-tool--danger" title="Remove" onClick={() => onRemove(node)}>🗑</button>
        </div>
        <div className="org-av">{node.name[0]?.toUpperCase()}</div>
        <div className="org-card__name">{node.name}</div>
        <div className="org-card__role">{node.role}</div>
        {vacant && <span className="org-card__tag">Vacant</span>}
        {kids.length > 0 && <span className="org-card__reports">{kids.length} report{kids.length > 1 ? "s" : ""}</span>}
      </div>

      {kids.length > 0 && (
        <ul>
          {kids.map((k) => (
            <OrgNode key={k.id} node={k} childrenOf={childrenOf} onAdd={onAdd} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ── Main screen ──────────────────────────────────────────── */
export default function OrgChart() {
  const { db, update, showToast } = useStore();
  const user = db.user || { name: "Osama", role: "Founder" };
  const members = db.teamMembers || [];

  const nodes = db.orgChart?.nodes || [];
  const roots = nodes.filter((n) => !n.parentId);
  const childrenOf = (pid) => nodes.filter((n) => n.parentId === pid);

  const pool = [{ id: "self", name: user.name, role: user.role || "Team Leader" },
                ...members.map((m) => ({ id: m.id, name: m.name, role: m.role }))];
  const placed = new Set(nodes.filter((n) => n.memberId).map((n) => n.memberId));
  const unplaced = pool.filter((p) => !placed.has(p.id));

  // form state: { mode:'add'|'edit', parentId, node }
  const [form, setForm] = useState(null);

  const save = (mutator) => update((d) => {
    if (!d.orgChart) d.orgChart = { nodes: [] };
    mutator(d.orgChart);
  });

  const openAdd  = (parent) => setForm({ mode: "add", parentId: parent ? parent.id : null, parentName: parent?.name });
  const openEdit = (node)   => setForm({ mode: "edit", node });

  const submitForm = (vals) => {
    if (form.mode === "add") {
      save((oc) => oc.nodes.push({ id: genId(), parentId: form.parentId, ...vals }));
      showToast(form.parentName ? `${vals.name} added under ${form.parentName}` : `${vals.name} set as team lead`);
    } else {
      save((oc) => { const n = oc.nodes.find((x) => x.id === form.node.id); if (n) Object.assign(n, vals); });
      showToast("Position updated");
    }
    setForm(null);
  };

  const removeNode = (node) => {
    const kids = childrenOf(node.id);
    if (!node.parentId && kids.length > 0) { showToast("Add a new top position before removing this one"); return; }
    save((oc) => {
      oc.nodes.forEach((n) => { if (n.parentId === node.id) n.parentId = node.parentId; }); // lift reports up
      oc.nodes = oc.nodes.filter((n) => n.id !== node.id);
    });
    showToast(`${node.name} removed`);
  };

  const quickPlace = (p) => {
    const root = roots[0];
    save((oc) => oc.nodes.push({ id: genId(), parentId: root ? root.id : null, name: p.name, role: p.role, memberId: p.id }));
    showToast(root ? `${p.name} added under ${root.name}` : `${p.name} set as team lead`);
  };

  const parentNameForPool = form?.mode === "edit" ? form.node : null;
  // pool offered in the form: unplaced + (when editing) the node's own current member
  const formPool = form?.mode === "edit" && form.node.memberId
    ? [...pool.filter((p) => !placed.has(p.id) || p.id === form.node.memberId)]
    : unplaced;

  return (
    <div className="view view--wide org-screen">
      <header className="view__head">
        <div>
          <h1 className="view__title">🌳 Team Org Chart</h1>
          <p className="muted">Build your workspace hierarchy — organise who reports to whom.</p>
        </div>
        <div className="view__actions">
          <span className="muted small">{nodes.length} placed · {unplaced.length} unassigned</span>
          {nodes.length > 0 && (
            <button className="btn btn--ghost btn--sm" onClick={() => { save((oc) => { oc.nodes = []; }); showToast("Org chart cleared"); }}>
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Chart */}
      {roots.length === 0 ? (
        <div className="org-empty">
          <div className="org-empty__icon">🌱</div>
          <h3 className="org-empty__title">Start building your team</h3>
          <p className="org-empty__sub">Add the person at the top of this workspace, then add their reports to grow the hierarchy.</p>
          <button className="btn btn--primary" onClick={() => openAdd(null)}>＋ Add top position</button>
        </div>
      ) : (
        <div className="org-canvas">
          <div className="org-tree">
            <ul>
              {roots.map((r) => (
                <OrgNode key={r.id} node={r} childrenOf={childrenOf} onAdd={openAdd} onEdit={openEdit} onRemove={removeNode} />
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Unassigned tray */}
      {unplaced.length > 0 && roots.length > 0 && (
        <div className="org-tray">
          <span className="org-tray__label">Unassigned members</span>
          <div className="org-tray__chips">
            {unplaced.map((p) => (
              <button key={p.id} className="org-chip" onClick={() => quickPlace(p)} title={`Add ${p.name} to the chart`}>
                <span className="org-av org-av--sm">{p.name[0].toUpperCase()}</span>
                <span className="org-chip__name">{p.name}</span>
                <span className="org-chip__role muted small">{p.role}</span>
                <span className="org-chip__add">＋</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {form && (
        <NodeForm
          mode={form.mode}
          node={form.node}
          parentName={form.parentName}
          pool={formPool}
          onCancel={() => setForm(null)}
          onSubmit={submitForm}
        />
      )}
    </div>
  );
}

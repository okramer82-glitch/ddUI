import { findNode } from "../../lib/tree.js";

/** Blank workflow-folder skeleton (every folder is a workflow folder). */
export function skeleton(node) {
  return {
    id: node.id, name: node.name, circle: node.circle || "individual",
    workflowText: "",
    workflow: { schedule: "Not scheduled yet", nodes: [], outputTo: { subfolder: null, note: "" } },
    minions: [], outputStyle: "", teamwork: "", connectedFolders: [],
    archive: { filters: [], folders: [] },
    board: { goals: [] },
    forms: [], recommendedFormFields: [],
    access: { mode: "private", people: [] },
  };
}

/** Read a folder's workspace data, synthesizing a blank one if undefined. */
export function getFolder(db, id) {
  if (db.folders[id]) return db.folders[id];
  const node = findNode(db.tree, id);
  return node && node.type === "folder" ? skeleton(node) : null;
}

/** Persist a synthesized skeleton into the DB on first open. */
export function ensureFolder({ db, update }, id) {
  if (db.folders[id]) return;
  const node = findNode(db.tree, id);
  if (!node || node.type !== "folder") return;
  update((d) => { if (!d.folders[id]) d.folders[id] = skeleton(node); });
}

export function runWorkflow({ update, showToast }, id, setTab) {
  const stamp = Date.now();
  update((d) => {
    const f = d.folders[id]; if (!f) return;
    // land new files into an "Inbox" archive folder (created on first run)
    let inbox = f.archive.folders.find((x) => x.name === "Inbox");
    if (!inbox) { inbox = { id: "ar-inbox", name: "Inbox", files: [], subfolders: [] }; f.archive.folders.unshift(inbox); }
    const n = inbox.files.length + 1;
    inbox.files.unshift({ id: "u" + stamp, name: `upload_${n}.csv`, kind: "original", tags: ["leads", "raw"], uploaded: "just now", analysis: "analysed", analyzedAt: "just now" });
    inbox.files.unshift({ id: "g" + stamp, name: `result_${n}.json`, kind: "generated", tags: ["enriched"], from: `upload_${n}.csv`, path: "/" + f.name + " · Workflow", created: "just now", analysis: "analysed", analyzedAt: "just now" });
  });
  showToast("▶ Workflow ran on uploaded data — output + tagged files added to Archive");
  setTab && setTab("archive");
}

export function addMinion({ db, update, showToast, closeModal }, id, name, dept, setTab) {
  if (db.folders[id]?.minions.some((m) => m.name === name)) { showToast(name + " already in folder"); return; }
  update((d) => {
    d.folders[id].minions.push({ id: name.replace("@", "").toLowerCase(), name, dept, job: "(define in workflow)", rules: "—", schedule: "manual", mcps: [] });
  });
  showToast(name + " added to folder"); closeModal(); setTab && setTab("minions");
}

/** Toggle whether a node runs in parallel with the node directly before it. */
export function toggleParallel({ update, showToast }, fid, nid) {
  let msg = "";
  update((d) => {
    const nodes = d.folders[fid]?.workflow.nodes; if (!nodes) return;
    const idx = nodes.findIndex((n) => n.id === nid);
    if (idx <= 0) { msg = "The first step can't run in parallel with a previous step"; return; }
    const cur = nodes[idx], prev = nodes[idx - 1];
    if (cur.group && cur.group === prev.group) {
      cur.group = null; msg = `${cur.name} now runs after ${prev.name}`;
    } else {
      const gid = prev.group || "grp-" + prev.id;
      prev.group = gid; cur.group = gid; msg = `${cur.name} now runs in parallel with ${prev.name}`;
    }
  });
  showToast(msg);
}

export function toggleConnect({ update, showToast }, id, oid) {
  update((d) => {
    const f = d.folders[id], o = d.folders[oid]; if (!f || !o) return;
    const on = f.connectedFolders.includes(oid);
    if (on) { f.connectedFolders = f.connectedFolders.filter((x) => x !== oid); o.connectedFolders = o.connectedFolders.filter((x) => x !== id); }
    else { f.connectedFolders.push(oid); if (!o.connectedFolders.includes(id)) o.connectedFolders.push(id); }
    showToast((on ? "Disconnected " : "Connected ") + o.name);
  });
}

export function createGoal({ update, showToast, closeModal }, id, setTab) {
  const stamp = Date.now();
  update((d) => {
    const f = d.folders[id];
    f.board.goals.unshift({
      id: "ag" + stamp, name: "Get Acme renewal signed (by Fri)", status: "in-progress",
      report: {
        summary: "0/3 milestones complete — goal just created.",
        metrics: [{ label: "Milestones", value: "0 / 3" }, { label: "Status", value: "in-progress" }, { label: "Team", value: "2 minions" }],
        narrative: "@Frank, @Mary are assigned. Minions will post their work and reasoning under each milestone as they go.",
        updatedBy: "@Doty", updated: "just now",
      },
      milestones: [
        { id: "ag" + stamp + "-0", name: "Confirm pricing", status: "todo", minions: ["@Frank"], description: "Confirm renewal pricing is within discount policy.", scheduled: "Not scheduled", depends: [], updates: [] },
        { id: "ag" + stamp + "-1", name: "Champion email", status: "in-progress", minions: ["@Mary"], description: "Draft and send the champion email.", scheduled: "In progress · today", depends: ["Confirm pricing"], updates: [{ by: "@Mary", when: "just now", kind: "work", text: "Drafting the champion email now." }] },
        { id: "ag" + stamp + "-2", name: "Legal sign-off", status: "todo", minions: ["@Frank"], description: "Route the final terms through legal.", scheduled: "Recurring · weekdays 09:00", depends: ["Champion email"], updates: [], cron: { expr: "0 9 * * 1-5", label: "Every weekday at 09:00", runs: [{ when: "17 Jun 09:00", status: "scheduled", note: "First run" }, { when: "18 Jun 09:00", status: "scheduled", note: "" }] } },
      ],
    });
  });
  showToast("Created goal · assigned @Frank, @Mary"); closeModal(); setTab && setTab("board");
}

/* ---------- forms ---------- */
const slugify = (s) => (s || "form").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);

/** Create/refresh the form's result as a dynamic file node in the folder tree (left rail). */
function upsertResultDoc(d, fid, form) {
  const out = form.output;
  if (!out || !out.fileName) return;
  const node = findNode(d.tree, fid); if (!node) return;
  node.children = node.children || [];
  let doc = node.children.find((c) => c.id === form.docId);
  if (!doc) { doc = { id: form.docId, type: "dynfile", dyn: true }; node.children.unshift(doc); node.open = true; }
  doc.name = out.fileName; doc.folderId = fid; doc.formId = form.id;
}

/** Publish a new form into the folder — generates a live link, stores its full config. */
export function createForm({ update, showToast, closeModal }, fid, cfg, setTab) {
  const stamp = Date.now();
  const id = "fm" + stamp;
  update((d) => {
    const f = d.folders[fid]; if (!f) return;
    const form = {
      id, type: cfg.type || "lead-capture", name: cfg.name || "Untitled form",
      desc: cfg.desc || "Custom form — submissions handled by this folder's workflow.",
      link: `doty.app/f/${slugify(fid)}-${slugify(cfg.name)}`,
      fields: cfg.fields && cfg.fields.length ? cfg.fields : (f.recommendedFormFields || []),
      gate: cfg.gate !== false,
      logic: cfg.logic || null, framework: cfg.framework || null,
      output: cfg.output || null, docId: cfg.output?.fileName ? "doc" + stamp : null,
      submissions: 0, live: true,
    };
    f.forms.unshift(form);
    upsertResultDoc(d, fid, form);
  });
  showToast("Form published — link is live"); closeModal && closeModal(); setTab && setTab("forms");
  return id;
}

/** Edit an existing form's settings (any subset of its config). */
export function updateForm({ update, showToast, closeModal }, fid, formId, patch) {
  update((d) => {
    const fm = d.folders[fid]?.forms.find((x) => x.id === formId); if (!fm) return;
    Object.assign(fm, patch);
    if (fm.output?.fileName && !fm.docId) fm.docId = "doc" + formId;
    upsertResultDoc(d, fid, fm);
  });
  showToast("Form settings saved"); closeModal && closeModal();
}

/** Simulate a public submission landing in the folder + running the workflow. */
export function submitForm(store, fid, formId) {
  const { update, showToast } = store;
  update((d) => { const fm = d.folders[fid]?.forms.find((x) => x.id === formId); if (fm) fm.submissions = (fm.submissions || 0) + 1; });
  runWorkflow(store, fid);
  showToast("Submission received → processed by this folder's workflow");
}

/* ---------- access / sharing ---------- */
export function setAccess({ update, showToast }, fid, patch) {
  update((d) => { const f = d.folders[fid]; if (!f) return; f.access = { mode: "private", people: [], ...(f.access || {}), ...patch }; });
  showToast("Sharing updated");
}
export function addPerson({ update, showToast }, fid, person) {
  update((d) => {
    const f = d.folders[fid]; if (!f) return;
    f.access = f.access || { mode: "people", people: [] };
    if (!f.access.people.some((p) => p.email === person.email)) f.access.people.push(person);
    f.access.mode = "people";
  });
  showToast(person.name + " can now access this folder");
}
export function removePerson({ update }, fid, email) {
  update((d) => { const f = d.folders[fid]; if (!f) return; f.access.people = (f.access.people || []).filter((p) => p.email !== email); });
}

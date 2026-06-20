import { navigate } from "../lib/router.js";

/** Route to the supervisor builder page (new, or edit when name given). */
export const supervisorRoute = (name) => name ? "#/supervisor/" + encodeURIComponent(name) : "#/supervisor/new";
export const openSupervisorBuilder = (_store, name) => navigate(supervisorRoute(name));

/** All minion names grouped/uniqued from the hub. */
export const allMinionNames = (db) => [...new Set(Object.values(db.minionHub || {}).flat().map((m) => m.name))];
export const minionsInScope = (db, scope) =>
  scope === "all" ? allMinionNames(db) : [...new Set((db.minionHub?.[scope] || []).map((m) => m.name))];

/** Persist a supervisor AI into the global team. */
export function saveSupervisor({ update, showToast }, origName, s) {
  update((d) => {
    d.supervisors = d.supervisors || [];
    if (origName) d.supervisors = d.supervisors.filter((x) => x.name !== origName);
    d.supervisors.unshift({ name: s.name, role: s.role, desc: s.desc, manages: s.manages, mode: s.mode, scope: s.scope });
  });
  showToast(origName ? "Supervisor updated" : s.name + " supervisor AI created");
}

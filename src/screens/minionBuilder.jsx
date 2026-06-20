import { navigate } from "../lib/router.js";

/** Route to the full-page minion builder (new, or edit when cat+name given). */
export const minionRoute = (cat, name) =>
  cat && name ? "#/minion/" + encodeURIComponent(cat) + "/" + encodeURIComponent(name) : "#/minion/new";

/** Open the minion builder page. */
export const openMinionBuilder = (_store, cat, name) => navigate(minionRoute(cat, name));

/** Persist a minion into the global hub (moving categories if needed). */
export function saveMinion({ update, showToast }, origName, m) {
  update((d) => {
    const hub = d.minionHub;
    if (origName) for (const c of Object.keys(hub)) hub[c] = hub[c].filter((x) => x.name !== origName);
    hub[m.category] = hub[m.category] || [];
    hub[m.category].unshift({ name: m.name, skills: m.skills, rules: m.rules, by: m.by || "You", desc: m.desc, framework: m.framework, logic: m.logic });
  });
  showToast(origName ? "Minion updated" : m.name + " added to the team");
}

/* ============================================================
   Simulated server. The JSON in public/db.json is the "database".
   On first load it is seeded into localStorage; thereafter all reads
   and writes go through here with artificial latency, so the app
   behaves like it's talking to a real async backend.

   To swap in a REAL backend later (e.g. `npm run server` → json-server
   on :4000), set API_BASE and flip USE_REMOTE — the rest of the app
   doesn't change.
   ============================================================ */
const KEY = "flowna_db_v27";
const USE_REMOTE = false;
const API_BASE = "http://localhost:4000";
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Load the whole database (seeds from db.json on first run). */
export async function loadDB() {
  await delay(150);
  if (USE_REMOTE) return (await fetch(`${API_BASE}/db`)).json();
  const cached = localStorage.getItem(KEY);
  if (cached) return JSON.parse(cached);
  const seed = await (await fetch(import.meta.env.BASE_URL + "db.json")).json();
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

/** Persist the whole database (fire-and-forget from the store). */
export async function saveDB(db) {
  await delay(90);
  if (USE_REMOTE) {
    await fetch(`${API_BASE}/db`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(db) });
    return db;
  }
  localStorage.setItem(KEY, JSON.stringify(db));
  return db;
}

/** Wipe local changes and re-seed from db.json. */
export async function resetDB() {
  localStorage.removeItem(KEY);
  return loadDB();
}

/* --- Generic REST-ish helpers (handy when you add features) --- */
export async function apiGet(path) {
  const db = await loadDB();
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), db);
}





/* ============================================================
   Form catalog, knowledge base, and generators shared by the
   Form Wizard, the public form page, and the report (HTML) viewer.
   ============================================================ */

/** General-purpose form types — each reusable across many use cases. */
export const FORM_TYPES = [
  { id: "lead-capture", ico: "🎯", name: "Lead capture", base: "fields",
    desc: "Qualify inbound leads and route the hot ones to sales.",
    fields: ["Full name", "Work email", "Company", "Team size", "What are you looking to solve?"] },
  { id: "support-ticket", ico: "🎫", name: "Support ticket", base: "fields",
    desc: "Customers file issues; minions triage and resolve them.",
    fields: ["Name", "Email", "Subject", "Describe the issue", "Priority"] },
  { id: "booking", ico: "📅", name: "Booking / appointment", base: "booking",
    desc: "Collect details and book a real time slot.",
    fields: ["Full name", "Email", "Phone", "Preferred time"] },
  { id: "application", ico: "🧑‍💼", name: "Application / intake", base: "fields",
    desc: "Jobs, programs, grants — collect applications with files.",
    fields: ["Full name", "Email", "Role / program", "Upload CV / resume", "Cover note"] },
  { id: "survey", ico: "📊", name: "Survey / feedback", base: "fields",
    desc: "Gather structured feedback and satisfaction scores.",
    fields: ["Name (optional)", "Overall rating", "What worked well?", "What could be better?"] },
  { id: "quote-rfp", ico: "📝", name: "Quote / RFP", base: "fields",
    desc: "Capture requirements and produce a tailored quote.",
    fields: ["Company", "Work email", "Budget range", "Requirements", "Timeline"] },
  { id: "verification", ico: "✅", name: "Verification (HR)", base: "fields",
    desc: "Securely verify identity or employment.",
    fields: ["Full legal name", "Work email", "Upload ID document", "Consent to processing"] },
  { id: "chatbot", ico: "💬", name: "Chat assistant", base: "chat",
    desc: "Let visitors chat with your files (scoped, read-only).",
    fields: [] },
  // legacy aliases kept so older seeded forms still resolve
  { id: "ticket", ico: "🎫", name: "Support ticket", base: "fields", desc: "Customers file issues; minions work them.", fields: ["Name", "Email", "Subject", "Describe the issue", "Priority"] },
  { id: "pr-interview", ico: "🎙", name: "Booking / interview", base: "booking", desc: "Qualify and book a slot.", fields: ["Full name", "Email", "Phone", "Preferred time"] },
];
export const typeMeta = (id) => FORM_TYPES.find((t) => t.id === id) || FORM_TYPES[0];

/** Knowledge base: pick a sector, then a framework to shape the form. */
export const KNOWLEDGE_BASE = {
  Sales: [
    { id: "bant", name: "BANT", desc: "Budget · Authority · Need · Timeline — classic lead qualification.", criteria: ["Budget", "Authority (decision maker?)", "Need", "Timeline"] },
    { id: "meddic", name: "MEDDIC", desc: "Metrics · Economic buyer · Decision criteria · Decision process · Identify pain · Champion.", criteria: ["Metrics", "Economic buyer", "Decision criteria", "Pain", "Champion"] },
    { id: "spin", name: "SPIN", desc: "Situation · Problem · Implication · Need-payoff questioning.", criteria: ["Situation", "Problem", "Implication", "Need-payoff"] },
    { id: "champ", name: "CHAMP", desc: "Challenges · Authority · Money · Prioritization.", criteria: ["Challenges", "Authority", "Money", "Prioritization"] },
  ],
  Marketing: [
    { id: "aida", name: "AIDA", desc: "Attention · Interest · Desire · Action — funnel framing.", criteria: ["Attention", "Interest", "Desire", "Action"] },
    { id: "pas", name: "PAS", desc: "Problem · Agitate · Solve — persuasive copy structure.", criteria: ["Problem", "Agitation", "Solution"] },
    { id: "jtbd", name: "Jobs-to-be-Done", desc: "What job is the visitor hiring you to do?", criteria: ["Job / outcome", "Current alternative", "Trigger", "Anxiety"] },
  ],
  HR: [
    { id: "star", name: "STAR", desc: "Situation · Task · Action · Result — behavioral interviews.", criteria: ["Situation", "Task", "Action", "Result"] },
    { id: "competency", name: "Competency-based", desc: "Score against role competencies.", criteria: ["Communication", "Ownership", "Problem solving", "Culture add"] },
  ],
  Support: [
    { id: "kcs", name: "KCS", desc: "Knowledge-Centered Service — capture + reuse answers.", criteria: ["Issue", "Environment", "Resolution", "Reusable article?"] },
    { id: "rice", name: "RICE", desc: "Reach · Impact · Confidence · Effort prioritization.", criteria: ["Reach", "Impact", "Confidence", "Effort"] },
  ],
  Finance: [
    { id: "unit-econ", name: "Unit economics", desc: "CAC · LTV · payback assessment.", criteria: ["CAC", "LTV", "Payback period", "Margin"] },
    { id: "3-statement", name: "3-statement", desc: "Tie request to P&L, balance sheet, cash flow.", criteria: ["P&L impact", "Cash impact", "Balance-sheet impact"] },
  ],
};

/** Heuristically turn a plain-language prompt into visual logic nodes. */
export function generateLogicNodes(prompt) {
  const nodes = [{ id: "t0", kind: "trigger", text: "On form submit" }];
  const text = (prompt || "").replace(/\n/g, " ");
  const clauses = text.split(/(?:\.|;|\band\b|\bthen\b(?=.*\bif\b))/i).map((s) => s.trim()).filter(Boolean);
  let i = 1;
  for (const c of clauses) {
    const m = c.match(/if\s+(.+?)\s+(?:then|do|→|->|,)\s+(.+)/i);
    if (m) {
      nodes.push({ id: "c" + i, kind: "condition", text: "If " + m[1].trim() });
      nodes.push({ id: "a" + i, kind: "action", text: m[2].trim() });
      i++;
    } else if (/route|assign|send|notify|email|score|tag|create|escalat/i.test(c)) {
      nodes.push({ id: "a" + i, kind: "action", text: c.charAt(0).toUpperCase() + c.slice(1) });
      i++;
    }
  }
  if (nodes.length === 1) {
    nodes.push({ id: "c1", kind: "condition", text: "If submission looks like a qualified lead" });
    nodes.push({ id: "a1", kind: "action", text: "Notify the sales minion + add to the board" });
  }
  return nodes;
}

const NODE_TITLE = { trigger: "Trigger", condition: "Condition", action: "Action", store: "Store to file" };

/** Turn a plain-language prompt into a positioned node canvas (nodes + arrows). */
export function promptToCanvas(prompt) {
  const seq = generateLogicNodes(prompt);
  const nodes = seq.map((n, i) => ({
    id: n.id, kind: n.kind, title: NODE_TITLE[n.kind] || "Step", desc: n.text,
    x: 40 + (i % 2) * 240, y: 24 + i * 96,
  }));
  const edges = [];
  for (let i = 1; i < nodes.length; i++) edges.push({ id: "e" + i, from: nodes[i - 1].id, to: nodes[i].id });
  return { nodes, edges };
}

/* Realistic example workflows used when a minion's logic is built ("test" flows). */
const MARKETING_GAP = () => ({
  prompt: "Analyse brand positioning gaps",
  nodes: [
    { id: "t", kind: "trigger", title: "Trigger", desc: "Weekly · or when new market/brand data lands", x: 40, y: 14 },
    { id: "a1", kind: "action", title: "Gather signals", desc: "Pull brand mentions, reviews, competitor sites & ads", x: 40, y: 164 },
    { id: "a2", kind: "action", title: "Map positioning", desc: "Score us vs competitors on key attributes (price, trust, innovation)", x: 40, y: 314 },
    { id: "c1", kind: "condition", title: "Gap found?", desc: "A whitespace or weak attribute vs competitors", x: 300, y: 14 },
    { id: "a3", kind: "action", title: "Recommend messaging", desc: "Draft positioning + messaging to close the gap", x: 300, y: 164 },
    { id: "s1", kind: "store", title: "Store to file", desc: "Save the gap analysis + recommendations", file: "brand_positioning_gaps.md", x: 300, y: 314 },
  ],
  edges: [
    { id: "e1", from: "t", to: "a1" }, { id: "e2", from: "a1", to: "a2" }, { id: "e3", from: "a2", to: "c1" },
    { id: "e4", from: "c1", to: "a3" }, { id: "e5", from: "a3", to: "s1" },
  ],
});
const SALES_QUAL = () => ({
  prompt: "Qualify and route inbound leads",
  nodes: [
    { id: "t", kind: "trigger", title: "Trigger", desc: "On new lead (form / Gmail / HubSpot)", x: 40, y: 14 },
    { id: "a1", kind: "action", title: "Enrich lead", desc: "Add company size, funding, tech stack", x: 40, y: 164 },
    { id: "c1", kind: "condition", title: "Qualified (BANT)?", desc: "Budget + authority + need + timeline met", x: 40, y: 314 },
    { id: "a2", kind: "action", title: "Route to AE", desc: "Notify the right rep + add to the board", x: 300, y: 164 },
    { id: "a3", kind: "action", title: "Nurture", desc: "Not yet — drop into a nurture sequence", x: 300, y: 14 },
    { id: "s1", kind: "store", title: "Store to file", desc: "Append qualified leads", file: "qualified_leads.csv", x: 300, y: 314 },
  ],
  edges: [
    { id: "e1", from: "t", to: "a1" }, { id: "e2", from: "a1", to: "c1" },
    { id: "e3", from: "c1", to: "a2" }, { id: "e4", from: "c1", to: "a3" }, { id: "e5", from: "a2", to: "s1" },
  ],
});

/** Build a minion's logic — domain-aware example workflow for the "test" flow. */
export function buildMinionLogic(category, desc) {
  const text = (desc || "").toLowerCase();
  if (category === "Marketing" || /brand|position|gap|whitespace|messaging|competitor/.test(text)) return MARKETING_GAP();
  if (category === "Sales" || /lead|qualif|pipeline|outreach/.test(text)) return SALES_QUAL();
  return { prompt: desc, ...promptToCanvas(desc) };
}

/** Doty's suggested skills & rules per category — for the interview-style picker. */
export const MINION_SUGGESTIONS = {
  Marketing: { skills: ["Brand positioning", "Competitor analysis", "Gap analysis", "Messaging & copy", "Campaign planning", "SEO & content", "Market research"], rules: ["On-brand voice", "Cite sources", "No unverified claims", "Value before price", "GDPR-safe"] },
  Sales: { skills: ["Lead gen", "Enrichment", "Qualification", "Objection handling", "Negotiation", "Pipeline hygiene"], rules: ["B2B only", "Dedupe by domain", "Cite evidence", "20% discount cap"] },
  HR: { skills: ["Screening", "Verification", "Scheduling", "Competency scoring", "Onboarding"], rules: ["GDPR-safe", "Consent required", "No biased language"] },
  Support: { skills: ["Ticket triage", "Doc Q&A", "Resolution drafting", "Escalation"], rules: ["Escalate U0/U1", "Cite KB article", "Friendly tone"] },
  Finance: { skills: ["Modeling", "Memos", "Scoring", "Invoicing", "Forecasting"], rules: ["Cite evidence", "Net-30 default", "Flag < 60% confidence"] },
};

/** Normalize any stored logic into the canvas shape (nodes with x/y/title/desc + edges). */
export function normalizeLogic(logic) {
  if (!logic) return { prompt: "", nodes: [], edges: [] };
  const nodes = (logic.nodes || []).map((n, i) => ({
    id: n.id || "n" + i, kind: n.kind || "action",
    title: n.title || NODE_TITLE[n.kind] || "Step", desc: n.desc || n.text || "",
    x: n.x ?? (40 + (i % 2) * 240), y: n.y ?? (24 + i * 96),
    ...(n.kind === "store" || n.file !== undefined ? { file: n.file || "" } : {}),
  }));
  return { prompt: logic.prompt || "", nodes, edges: logic.edges || [] };
}

/** Plausible dummy value for a field, so previews look real. */
export function fieldDummy(name) {
  const n = name.toLowerCase();
  if (/legal name|full name|^name/.test(n)) return "Jane Doe";
  if (/email/.test(n)) return "jane@acme.co";
  if (/phone|number/.test(n)) return "+1 555 0142";
  if (/company|org/.test(n)) return "Acme Inc.";
  if (/team size|employees|seats/.test(n)) return "120";
  if (/budget/.test(n)) return "$25k–50k";
  if (/timeline|when|time/.test(n)) return "This quarter";
  if (/priority/.test(n)) return "High";
  if (/rating|score/.test(n)) return "4 / 5";
  if (/role|program/.test(n)) return "Account Executive";
  if (/upload|file|cv|resume|id document/.test(n)) return "resume_jane.pdf";
  if (/consent/.test(n)) return "✓ agreed";
  if (/subject/.test(n)) return "Cannot export report";
  if (/describe|issue|requirements|solve|better|well|note|cover/.test(n)) return "Lorem ipsum — short illustrative answer for preview.";
  return "—";
}

/** Build a styled, self-contained HTML report from the form config + dummy data. */
export function buildReportHtml(form, folderName) {
  const t = typeMeta(form.type);
  const dark = /dark|night|black/i.test(form.output?.description || "");
  const cards = /card/i.test(form.output?.description || "");
  const accent = "#16b8a6";
  const bg = dark ? "#0e1622" : "#f7f9fb";
  const surface = dark ? "#16202e" : "#ffffff";
  const ink = dark ? "#e8eef5" : "#10202e";
  const muted = dark ? "#8aa0b4" : "#5b6b78";
  const line = dark ? "#243140" : "#e6ebef";
  const fields = (form.fields && form.fields.length ? form.fields : t.fields);
  const fw = form.framework;
  const rows = fields.map((f) => `<tr><td class="k">${f}</td><td class="v">${fieldDummy(f)}</td></tr>`).join("");
  const critRows = fw ? fw.criteria.map((c, i) => `<tr><td class="k">${c}</td><td class="v">${["Strong", "Medium", "Confirmed", "Yes"][i % 4]}</td></tr>`).join("") : "";
  const body = cards
    ? `<div class="cards">${fields.map((f) => `<div class="card"><div class="lbl">${f}</div><div class="val">${fieldDummy(f)}</div></div>`).join("")}</div>`
    : `<table>${rows}</table>`;
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,Arial,sans-serif;background:${bg};color:${ink};padding:24px}
  .wrap{max-width:680px;margin:0 auto;background:${surface};border:1px solid ${line};border-radius:14px;overflow:hidden}
  .head{padding:20px 24px;border-bottom:1px solid ${line};display:flex;align-items:center;justify-content:space-between}
  .title{font-size:18px;font-weight:700;margin:0}
  .sub{color:${muted};font-size:12px;margin:2px 0 0}
  .pill{font-size:11px;color:${accent};border:1px solid ${accent}55;border-radius:999px;padding:3px 10px}
  .sec{padding:18px 24px}
  .sec h3{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:${muted};margin:0 0 10px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  td{padding:9px 0;border-bottom:1px solid ${line};vertical-align:top}
  td.k{color:${muted};width:42%} td.v{font-weight:500}
  .cards{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .card{border:1px solid ${line};border-radius:10px;padding:12px}
  .card .lbl{color:${muted};font-size:12px} .card .val{font-weight:600;margin-top:4px}
  .foot{padding:14px 24px;color:${muted};font-size:11px;border-top:1px solid ${line}}
</style></head><body><div class="wrap">
  <div class="head"><div><h1 class="title">${form.name || "Form report"}</h1>
    <p class="sub">${folderName || ""} · ${t.name} · sample data</p></div>
    <span class="pill">${fw ? fw.name : "Live report"}</span></div>
  <div class="sec"><h3>Submission</h3>${body}</div>
  ${fw ? `<div class="sec"><h3>${fw.name} assessment</h3><table>${critRows}</table></div>` : ""}
  <div class="foot">Auto-generated by Doty from the “${form.name}” form · updates on every submission.</div>
</div></body></html>`;
}

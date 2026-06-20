import { useStore } from "../store/store.jsx";
import { openCloneShare } from "./folder/modals.jsx";
import DocCanvas from "./DocCanvas.jsx";

/* Build initial document blocks from a report's structured data.
   Once the user edits, blocks are persisted on the report itself. */
function reportToBlocks(r) {
  const b = (html) => ({ id: "blk-" + Math.random().toString(36).slice(2, 9), html });
  const blocks = [];

  blocks.push(b(`<h1 style="font-size:32px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin:0 0 6px;">${r.name}</h1>`));
  blocks.push(b(`<p style="color:#64748b;font-size:15px;margin:0 0 20px;">${r.cadence} report · ${r.circle} circle</p>`));

  // Pulse metrics
  if (r.pulse?.length) {
    const cards = r.pulse.map((p) => {
      const up = p.dir === "up";
      const col = up ? "#059669" : "#dc2626";
      const arrow = up ? "▲" : "▼";
      return `<div style="flex:1;min-width:150px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
    <div style="font-size:13px;color:#64748b;font-weight:600;margin-bottom:6px;text-transform:capitalize;">${p.label}</div>
    <div style="font-size:26px;font-weight:800;color:${col};">${arrow} ${p.val}</div>
  </div>`;
    }).join("\n  ");
    blocks.push(b(`<h2 style="font-size:22px;font-weight:700;color:#1e293b;margin:8px 0 12px;">Pulse</h2>`));
    blocks.push(b(`<div style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 22px;">\n  ${cards}\n</div>`));
  }

  // Commitments
  if (r.commitments) {
    const c = r.commitments;
    blocks.push(b(`<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:0 0 18px;display:flex;gap:28px;flex-wrap:wrap;">
  <div><div style="font-size:13px;color:#64748b;font-weight:600;">Closed</div><div style="font-size:24px;font-weight:800;color:#059669;">${c.closed}</div></div>
  <div><div style="font-size:13px;color:#64748b;font-weight:600;">Created</div><div style="font-size:24px;font-weight:800;color:#0f172a;">${c.created}</div></div>
  <div><div style="font-size:13px;color:#64748b;font-weight:600;">At risk</div><div style="font-size:24px;font-weight:800;color:#dc2626;">${c.atRisk}</div></div>
</div>`));
  }

  // Decision
  if (r.decision) {
    blocks.push(b(`<div style="background:#eef2ff;border:1px solid #e0e7ff;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
  <div style="font-weight:700;color:#3730a3;margin-bottom:4px;">Decision</div>
  <p style="color:#4338ca;margin:0;line-height:1.6;">${r.decision}</p>
</div>`));
  }

  // Charts → horizontal bars
  (r.charts || []).forEach((chart) => {
    const mx = Math.max(...chart.bars.map((x) => x[1]));
    const rows = chart.bars.map(([label, val]) => {
      const pct = Math.round((val / mx) * 100);
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
    <span style="width:90px;font-size:13px;color:#475569;">${label}</span>
    <span style="flex:1;height:10px;background:#eef2ff;border-radius:5px;overflow:hidden;"><span style="display:block;height:100%;width:${pct}%;background:#6366f1;border-radius:5px;"></span></span>
    <span style="width:34px;text-align:right;font-size:13px;font-weight:700;color:#1e293b;">${val}</span>
  </div>`;
    }).join("\n  ");
    blocks.push(b(`<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:0 0 18px;">
  <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:14px;">${chart.title}</div>
  ${rows}
</div>`));
  });

  // Risks
  if (r.risks?.length) {
    const items = r.risks.map((x) =>
      `<li style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;">
    <span style="color:#dc2626;font-size:14px;line-height:1.5;">●</span><span>${x}</span>
  </li>`).join("\n  ");
    blocks.push(b(`<h2 style="font-size:22px;font-weight:700;color:#1e293b;margin:8px 0 12px;">Risks</h2>`));
    blocks.push(b(`<ul style="list-style:none;padding:0;margin:0 0 20px;color:#475569;line-height:1.6;">\n  ${items}\n</ul>`));
  }

  // Next step
  if (r.nextStep) {
    blocks.push(b(`<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:0 0 8px;">
  <div style="font-weight:700;color:#166534;margin-bottom:4px;">Next step</div>
  <p style="color:#15803d;margin:0;line-height:1.6;">${r.nextStep}</p>
</div>`));
  }

  return blocks;
}

export default function Reports({ id }) {
  const store = useStore();
  const { db, update } = store;
  const reportId = db.reports[id] ? id : "report-acme";
  const r = db.reports[reportId];

  const blocks = r.blocks || reportToBlocks(r);
  const persist = (next) => update((d) => { d.reports[reportId].blocks = next; });

  return (
    <div className="view view--wide">
      <DocCanvas
        blocks={blocks}
        onChange={persist}
        title={r.name}
        meta={<>{r.cadence} · {r.circle} circle</>}
        actions={
          <button className="dc-btn dc-btn--primary" onClick={() => openCloneShare(store, r.name)}>Share</button>
        }
      />
    </div>
  );
}

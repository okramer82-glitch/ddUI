import { useStore } from "../store/store.jsx";
import { useHashRoute, navigate } from "../lib/router.js";
import { findNode } from "../lib/tree.js";
import DocCanvas from "./DocCanvas.jsx";

const genId = () => "blk-" + Math.random().toString(36).slice(2, 9);

/* Seed a fresh document for a file the first time it is opened. */
function defaultDocBlocks(node, form, folderName) {
  const b = (html) => ({ id: genId(), html });
  const blocks = [
    b(`<h1 style="font-size:32px;font-weight:800;color:#0f172a;letter-spacing:-0.02em;margin:0 0 6px;">${node.name}</h1>`),
  ];

  if (form) {
    blocks.push(b(`<p style="color:#64748b;font-size:15px;margin:0 0 20px;">Living document · auto-updates from the “${form.name}” form in ${folderName || "this folder"}.</p>`));
    blocks.push(b(`<div style="background:#eef2ff;border:1px solid #e0e7ff;border-radius:12px;padding:18px 20px;margin:0 0 22px;display:flex;justify-content:space-between;align-items:center;">
  <div>
    <div style="font-weight:700;color:#3730a3;margin-bottom:2px;">Submissions collected</div>
    <div style="font-size:13px;color:#6366f1;">Synced from the connected form</div>
  </div>
  <div style="font-size:32px;font-weight:800;color:#4f46e5;">${form.submissions || 0}</div>
</div>`));
  } else {
    blocks.push(b(`<p style="color:#64748b;font-size:15px;margin:0 0 20px;">Static document. Edit any block below, reorder sections, or add new components.</p>`));
  }

  blocks.push(b(`<h2 style="font-size:22px;font-weight:700;color:#1e293b;margin:24px 0 12px;">Overview</h2>`));
  blocks.push(b(`<p style="color:#475569;line-height:1.7;margin:0 0 16px;">Use this space to summarise the purpose of the document. Click directly on this text to edit it, hover any block to reorder or delete it, or use “Add component” to insert headings, lists, metrics, quotes and more.</p>`));
  blocks.push(b(`<blockquote style="border-left:4px solid #c7d2fe;background:#eef2ff;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;color:#3730a3;font-style:italic;">
  "Every file in Doty is a living, editable document."
</blockquote>`));
  return blocks;
}

/** Block-based viewer/editor for a file (dynamic form result or static doc). */
export default function DocViewer() {
  const { id } = useHashRoute();
  const { db, update } = useStore();
  // A document can live in the workspace tree or the learning tree.
  const node = findNode(db.tree, id) || findNode(db.learnTree || [], id);

  if (!node) {
    return (
      <div className="view view--wide">
        <p className="muted" style={{ padding: 24 }}>This file is no longer available. <button className="btn btn--ghost btn--sm" onClick={() => navigate("#/pulse")}>← Back</button></p>
      </div>
    );
  }

  const folder = node.folderId ? db.folders[node.folderId] : null;
  const form   = folder?.forms?.find((x) => x.id === node.formId) || null;

  const saved  = db.docs?.[id]?.blocks;
  const blocks = saved || defaultDocBlocks(node, form, folder?.name);
  const persist = (next) => update((d) => {
    if (!d.docs) d.docs = {};
    d.docs[id] = { ...(d.docs[id] || {}), blocks: next };
  });

  const meta = form
    ? <>auto-updates from the “{form.name}” form · {form.submissions || 0} submissions</>
    : <>static document</>;

  return (
    <div className="view view--wide">
      <DocCanvas
        blocks={blocks}
        onChange={persist}
        title={node.name}
        badge={form ? "dynamic" : "static"}
        meta={meta}
        actions={
          <>
            {node.folderId && <button className="dc-btn" onClick={() => navigate("#/folder/" + node.folderId)}>Open folder</button>}
            {form && <button className="dc-btn" onClick={() => window.open(location.origin + location.pathname + "#/form/" + node.folderId + "/" + form.id, "_blank", "noopener")}>Open form ↗</button>}
          </>
        }
      />
    </div>
  );
}

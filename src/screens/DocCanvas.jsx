import { useState, useRef } from "react";

/* ============================================================
   DocCanvas — block-based HTML/CSS document editor.
   Renders a document as a stack of editable HTML blocks on a
   light "paper" surface. Each block can be edited in place
   (contentEditable), reordered, deleted, or inserted from a
   template. Used by Reports and DocViewer to render any
   dynamic or static file's content.

   Props:
     blocks   : [{ id, html }]   initial blocks
     onChange : (blocks) => void  persist callback (store)
     title    : string            document title (toolbar)
     badge    : string?           small tag next to title
     meta     : node?             subtitle / context line
     actions  : node?             extra toolbar buttons (right)
   ============================================================ */

const genId = () => "blk-" + Math.random().toString(36).slice(2, 9);

/* ── Inline-SVG icons (no external icon lib) ──────────────── */
const I = ({ children, size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const IcEdit   = () => <I><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></I>;
const IcUp     = () => <I><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></I>;
const IcDown   = () => <I><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></I>;
const IcTrash  = () => <I><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></I>;
const IcCheck  = () => <I><path d="M20 6 9 17l-5-5" /></I>;
const IcX      = () => <I><path d="M18 6 6 18" /><path d="m6 6 12 12" /></I>;
const IcPlus   = () => <I><path d="M12 5v14" /><path d="M5 12h14" /></I>;
const IcFile   = () => <I size={18}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></I>;

/* ── Component templates (self-contained inline styles) ───── */
const TEMPLATES = [
  { name: "Heading", glyph: "H", html:
    `<h2 style="font-size:22px;font-weight:700;color:#1e293b;margin:24px 0 12px;">New section title</h2>` },
  { name: "Paragraph", glyph: "¶", html:
    `<p style="color:#475569;line-height:1.7;margin:0 0 16px;">Start typing your paragraph here…</p>` },
  { name: "Bullet list", glyph: "•", html:
    `<ul style="color:#475569;line-height:1.8;margin:0 0 16px;padding-left:22px;">\n  <li>First item</li>\n  <li>Second item</li>\n  <li>Third item</li>\n</ul>` },
  { name: "Quote", glyph: "❝", html:
    `<blockquote style="border-left:4px solid #c7d2fe;background:#eef2ff;padding:12px 16px;margin:20px 0;border-radius:0 8px 8px 0;color:#3730a3;font-style:italic;">\n  "Enter a significant quote or insight here."\n  <div style="font-size:13px;font-weight:600;color:#6366f1;margin-top:6px;font-style:normal;">— Source</div>\n</blockquote>` },
  { name: "Callout", glyph: "❗", html:
    `<div style="background:#eef2ff;border:1px solid #e0e7ff;border-radius:12px;padding:18px 20px;margin:0 0 20px;">\n  <div style="font-weight:700;color:#3730a3;margin-bottom:6px;">Key takeaway</div>\n  <p style="color:#4338ca;margin:0;line-height:1.6;">Summarise the most important point here.</p>\n</div>` },
  { name: "Metric grid", glyph: "▦", html:
    `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 22px;">\n  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;">\n    <div style="font-size:13px;color:#64748b;font-weight:600;margin-bottom:4px;">Metric A</div>\n    <div style="font-size:28px;font-weight:800;color:#059669;">42%</div>\n  </div>\n  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;">\n    <div style="font-size:13px;color:#64748b;font-weight:600;margin-bottom:4px;">Metric B</div>\n    <div style="font-size:28px;font-weight:800;color:#f59e0b;">35%</div>\n  </div>\n  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:16px;text-align:center;">\n    <div style="font-size:13px;color:#64748b;font-weight:600;margin-bottom:4px;">Metric C</div>\n    <div style="font-size:28px;font-weight:800;color:#94a3b8;">23%</div>\n  </div>\n</div>` },
  { name: "Data card", glyph: "▭", html:
    `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin:0 0 18px;display:flex;justify-content:space-between;align-items:center;">\n  <div>\n    <div style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:2px;">New metric</div>\n    <div style="font-size:13px;color:#64748b;">Description of the metric</div>\n  </div>\n  <div style="font-size:30px;font-weight:800;color:#4f46e5;">0%</div>\n</div>` },
  { name: "Divider", glyph: "—", html:
    `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />` },
  { name: "Custom HTML", glyph: "</>", html:
    `<div style="padding:16px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:8px;color:#64748b;">\n  <!-- Write any HTML / CSS here -->\n  Custom block\n</div>` },
];

/* ── Single editable block ────────────────────────────────── */
function Block({ block, index, total, onUpdate, onDelete, onMoveUp, onMoveDown }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef(null);

  const save = () => { if (ref.current) onUpdate(block.id, ref.current.innerHTML); setEditing(false); };

  if (editing) {
    return (
      <div className="dc-block dc-block--editing">
        <div className="dc-edit-bar">
          <span className="dc-edit-hint"><IcEdit /> Editing — click into the content to change text</span>
          <span className="dc-edit-actions">
            <button className="dc-mini dc-mini--ghost" onClick={() => setEditing(false)}><IcX /> Cancel</button>
            <button className="dc-mini dc-mini--save" onClick={save}><IcCheck /> Save</button>
          </span>
        </div>
        <div
          ref={ref}
          className="dc-editable"
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      </div>
    );
  }

  return (
    <div className="dc-block">
      <div className="dc-tools">
        <button className="dc-tool" title="Edit"      onClick={() => setEditing(true)}><IcEdit /></button>
        <button className="dc-tool" title="Move up"    onClick={() => onMoveUp(index)}   disabled={index === 0}><IcUp /></button>
        <button className="dc-tool" title="Move down"  onClick={() => onMoveDown(index)} disabled={index === total - 1}><IcDown /></button>
        <button className="dc-tool dc-tool--danger" title="Delete" onClick={() => onDelete(block.id)}><IcTrash /></button>
      </div>
      <div
        className="dc-rendered"
        onClick={(e) => { if (!["A","BUTTON","INPUT"].includes(e.target.tagName)) setEditing(true); }}
        dangerouslySetInnerHTML={{ __html: block.html }}
      />
    </div>
  );
}

/* ── Add-component picker ─────────────────────────────────── */
function AddComponent({ onAdd }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button className="dc-add" onClick={() => setOpen(true)}>
        <span className="dc-add__icon"><IcPlus /></span> Add component
      </button>
    );
  }
  return (
    <div className="dc-picker">
      <button className="dc-picker__close" onClick={() => setOpen(false)}><IcX /></button>
      <h4 className="dc-picker__title">Choose a component</h4>
      <div className="dc-picker__grid">
        {TEMPLATES.map((t) => (
          <button key={t.name} className="dc-tpl" onClick={() => { onAdd(t.html); setOpen(false); }}>
            <span className="dc-tpl__glyph">{t.glyph}</span>
            <span className="dc-tpl__name">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Main canvas ──────────────────────────────────────────── */
export default function DocCanvas({ blocks: initial = [], onChange, title, badge, meta, actions }) {
  const [blocks, setBlocks] = useState(initial);

  const commit = (next) => { setBlocks(next); onChange?.(next); };

  const addBlock    = (html) => commit([...blocks, { id: genId(), html }]);
  const updateBlock = (id, html) => commit(blocks.map((b) => (b.id === id ? { ...b, html } : b)));
  const deleteBlock = (id) => commit(blocks.filter((b) => b.id !== id));
  const moveUp = (i) => { if (i === 0) return; const n = [...blocks]; [n[i-1], n[i]] = [n[i], n[i-1]]; commit(n); };
  const moveDown = (i) => { if (i === blocks.length - 1) return; const n = [...blocks]; [n[i+1], n[i]] = [n[i], n[i+1]]; commit(n); };

  return (
    <div className="dc">
      {/* Toolbar */}
      <div className="dc-bar">
        <div className="dc-bar__left">
          <span className="dc-bar__avatar"><IcFile /></span>
          <div>
            <div className="dc-bar__title">{title}{badge && <span className="dc-badge">{badge}</span>}</div>
            {meta && <div className="dc-bar__meta">{meta}</div>}
          </div>
        </div>
        <div className="dc-bar__right">
          {actions}
          <span className="dc-mode"><IcEdit /> Live edit</span>
          <button className="dc-btn" onClick={() => window.print()}>Export PDF</button>
        </div>
      </div>

      {/* Paper */}
      <div className="dc-paper">
        {blocks.length === 0 ? (
          <div className="dc-empty">
            <span className="dc-empty__icon"><IcFile /></span>
            <h3 className="dc-empty__title">This document is empty</h3>
            <p className="dc-empty__sub">Add a component below to get started.</p>
          </div>
        ) : (
          blocks.map((b, i) => (
            <Block key={b.id} block={b} index={i} total={blocks.length}
              onUpdate={updateBlock} onDelete={deleteBlock} onMoveUp={moveUp} onMoveDown={moveDown} />
          ))
        )}

        <div className="dc-addzone">
          <AddComponent onAdd={addBlock} />
        </div>
      </div>
    </div>
  );
}

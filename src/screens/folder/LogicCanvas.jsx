import { useRef, useState, useEffect } from "react";

const NODE_W = 200;
const KIND = {
  trigger: { ico: "⚡", label: "Trigger", cls: "trigger" },
  condition: { ico: "◇", label: "Condition", cls: "condition" },
  action: { ico: "▸", label: "Action", cls: "action" },
  store: { ico: "🔁", label: "Store to file", cls: "store" },
};

/** Freeform node canvas: drag nodes, edit their description, connect with arrows. */
export default function LogicCanvas({ nodes, edges, onChange }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);
  const [linkFrom, setLinkFrom] = useState(null);

  const update = (ns, es) => onChange(ns ?? nodes, es ?? edges);
  const setNode = (id, patch) => update(nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)), edges);

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const r = ref.current.getBoundingClientRect();
      let x = e.clientX - r.left - drag.dx, y = e.clientY - r.top - drag.dy;
      x = Math.max(0, Math.min(x, r.width - NODE_W)); y = Math.max(0, Math.min(y, r.height - 40));
      update(nodes.map((n) => (n.id === drag.id ? { ...n, x, y } : n)), edges);
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [drag, nodes, edges]); // eslint-disable-line

  const startDrag = (e, n) => {
    if (e.target.closest(".lcport,.lcnode__del,input,textarea,select")) return;
    const r = ref.current.getBoundingClientRect();
    setDrag({ id: n.id, dx: e.clientX - r.left - n.x, dy: e.clientY - r.top - n.y });
  };
  const addNode = (kind) => {
    const id = "n" + Date.now();
    const off = nodes.length * 14 % 120;
    update([...nodes, { id, kind, title: KIND[kind].label, desc: "", x: 50 + off, y: 30 + off, ...(kind === "store" ? { file: "" } : {}) }], edges);
  };
  const del = (id) => update(nodes.filter((n) => n.id !== id), edges.filter((e) => e.from !== id && e.to !== id));
  const clickIn = (id) => {
    if (linkFrom && linkFrom !== id && !edges.some((e) => e.from === linkFrom && e.to === id))
      update(nodes, [...edges, { id: "e" + Date.now(), from: linkFrom, to: id }]);
    setLinkFrom(null);
  };
  const node = (id) => nodes.find((n) => n.id === id);
  const port = (n, side) => ({ x: n.x + (side === "out" ? NODE_W : 0), y: n.y + 22 });

  return (
    <div className="lcwrap">
      <div className="lcpalette">
        <span className="muted small">Add node:</span>
        {Object.entries(KIND).map(([k, v]) => <button key={k} className="btn btn--ghost btn--sm" onClick={() => addNode(k)}>{v.ico} {v.label}</button>)}
        {linkFrom && <span className="lchint">↳ now click another node's left ● to connect · <button className="link" onClick={() => setLinkFrom(null)}>cancel</button></span>}
      </div>
      <div className="lccanvas" ref={ref} onClick={(e) => { if (e.target.classList.contains("lccanvas")) setLinkFrom(null); }}>
        <svg className="lcedges">
          <defs><marker id="lcarrow" markerWidth="10" markerHeight="8" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="var(--muted)" /></marker></defs>
          {edges.map((e) => {
            const a = node(e.from), b = node(e.to); if (!a || !b) return null;
            const p1 = port(a, "out"), p2 = port(b, "in"), mx = (p1.x + p2.x) / 2;
            return <path key={e.id} className="lcedge" d={`M${p1.x},${p1.y} C${mx},${p1.y} ${mx},${p2.y} ${p2.x},${p2.y}`} markerEnd="url(#lcarrow)" onClick={() => update(nodes, edges.filter((x) => x.id !== e.id))} />;
          })}
        </svg>
        {nodes.map((n) => (
          <div key={n.id} className={"lcnode lcnode--" + KIND[n.kind].cls} style={{ left: n.x, top: n.y, width: NODE_W }} onPointerDown={(e) => startDrag(e, n)}>
            <button className={"lcport lcport--in" + (linkFrom && linkFrom !== n.id ? " is-target" : "")} title="input — click to connect from another node" onClick={() => clickIn(n.id)} />
            <button className={"lcport lcport--out" + (linkFrom === n.id ? " is-on" : "")} title="output — click, then click another node's left dot" onClick={() => setLinkFrom(n.id)} />
            <div className="lcnode__head"><span className="lcnode__kind">{KIND[n.kind].ico} {KIND[n.kind].label}</span>
              <button className="lcnode__del" onClick={() => del(n.id)}>✕</button></div>
            <input className="lcnode__title" value={n.title} onChange={(e) => setNode(n.id, { title: e.target.value })} placeholder="title" />
            <textarea className="lcnode__desc" rows="2" value={n.desc} onChange={(e) => setNode(n.id, { desc: e.target.value })} placeholder="describe this step…" />
            {n.kind === "store" && <input className="lcnode__file" value={n.file || ""} onChange={(e) => setNode(n.id, { file: e.target.value })} placeholder="📄 result file name…" />}
          </div>))}
        {!nodes.length && <div className="lcempty muted">Add nodes from the palette (or describe the logic above and hit “Build flow”). Drag to move · click a node's right ● then another node's left ● to connect · click an arrow to delete it.</div>}
      </div>
    </div>
  );
}

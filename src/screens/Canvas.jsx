import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { CircleBadge } from "../lib/ui.jsx";

export default function Canvas({ id }) {
  const { db, showToast } = useStore();
  const c = db.canvas[id] || db.canvas["canvas-pipe"];
  const [prompt, setPrompt] = useState("");
  const regen = () => showToast(/stalled|red/i.test(prompt) ? "✦ Regenerated — stalled cards now red" : "✦ Regenerated from: " + (prompt || "prompt"));
  return (
    <div className="view view--wide">
      <header className="view__head">
        <div><h1 className="view__title">🧩 Canvas: "{c.name}" <CircleBadge c={c.circle} /></h1></div>
        <div className="view__actions"><button className="btn btn--ghost">WYSIWYG</button><button className="btn btn--ghost">Wire data</button></div>
      </header>
      <div className="kanban">{c.columns.map((col) => (
        <div className="kcol" key={col.id}><h3 className="kcol__title">{col.title} <span className="badge">{col.cards.length}</span></h3>
          {col.cards.map((cd, i) => (
            <article className={"kcard" + (cd.stalled ? " kcard--stalled" : "")} key={i}>
              <p className="kcard__title">{cd.t}</p><p className="kcard__meta muted">owner: {cd.owner}</p></article>))}
        </div>))}</div>
      <div className="promptstrip"><span className="cmd__prompt">＞</span>
        <input className="cmd__input" placeholder='describe a change: "color stalled cards red"' value={prompt}
          onChange={(e) => setPrompt(e.target.value)} onKeyDown={(e) => e.key === "Enter" && regen()} />
        <button className="btn btn--primary" onClick={regen}>✦ Regenerate</button></div>
    </div>
  );
}

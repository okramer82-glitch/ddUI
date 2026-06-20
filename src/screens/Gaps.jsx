import { useState } from "react";
import { useStore } from "../store/store.jsx";

const SEVY = { high: 70, med: 150, low: 230 };
const TYPECOLOR = { process: "var(--accent)", knowledge: "var(--amber)", data: "var(--teal)", ownership: "var(--violet)" };
const COLS = { process: 110, knowledge: 230, data: 350, ownership: 470 };

export default function Gaps() {
  const { db, setUi } = useStore();
  const g = db.gaps;
  const [type, setType] = useState(g.types[0]);
  return (
    <div className="view view--wide">
      <header className="view__head"><h1 className="view__title">📡 Gap Radar</h1>
        <div className="segmented">{g.types.map((t) => (
          <button key={t} className={"seg" + (type === t ? " is-active" : "")} onClick={() => setType(t)}>{t}</button>))}</div>
      </header>
      <p className="muted small">bubble size = # affected · color = type · Day-0 structural + reference gaps shown first</p>
      <svg className="radar" viewBox="0 0 560 280">
        <text x="6" y="74" fill="var(--muted)" fontSize="11">high</text>
        <text x="6" y="154" fill="var(--muted)" fontSize="11">med</text>
        <text x="6" y="234" fill="var(--muted)" fontSize="11">low</text>
        {Object.entries(COLS).map(([t, x]) => <text key={t} x={x - 10} y="270" fill="var(--muted)" fontSize="11">{t}</text>)}
        {g.items.map((it) => (
          <g className="gap" key={it.id} onClick={() => setUi((u) => ({ ...u, gap: it }))}
            transform={`translate(${COLS[it.type] + (it.id.charCodeAt(1) % 3) * 14},${SEVY[it.sev] + (it.affected % 3) * 10})`}>
            <circle r={8 + it.affected * 2} fill={TYPECOLOR[it.type]} opacity="0.55" />
          </g>))}
      </svg>

      {db.upskilling?.nextLevel && <>
        <h3 className="sub">Milestones to {db.upskilling.nextLevel.to} <span className="muted small">· {db.upskilling.nextLevel.progress}%</span></h3>
        <div className="projbar" style={{ maxWidth: 420, marginBottom: 10 }}><span className="projbar__fill" style={{ width: db.upskilling.nextLevel.progress + "%" }} /></div>
        <ul className="milestones-list">{db.upskilling.nextLevel.milestones.map((m, i) => (
          <li className={"ms ms--" + m.status} key={i}><span className="ms__dot" /><span className="ms__name">{m.name}</span>
            <span className="ms__facts"><span className="muted small">{m.detail}</span></span><span className="ms__status">{m.status}</span></li>))}</ul>
      </>}
    </div>
  );
}

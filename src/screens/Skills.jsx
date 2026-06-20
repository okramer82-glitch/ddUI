import { useStore } from "../store/store.jsx";

const COL = { mastered: "var(--green)", developing: "var(--amber)", gap: "var(--red)" };

export default function Skills() {
  const { db, setUi } = useStore();
  const g = db.skills;
  return (
    <div className="view view--wide">
      <header className="view__head"><h1 className="view__title">✨ Skill Constellation</h1>
        <div className="segmented"><button className="seg is-active">Me</button><button className="seg">Team (aggregate)</button></div>
      </header>
      <div className="legend">
        <span><i style={{ background: "var(--green)" }} /> mastered</span>
        <span><i style={{ background: "var(--amber)" }} /> developing</span>
        <span><i style={{ background: "var(--red)" }} /> gap</span>
      </div>
      <svg className="constellation" viewBox="0 0 560 380">
        {g.edges.map(([a, b], i) => {
          const A = g.nodes.find((n) => n.id === a), B = g.nodes.find((n) => n.id === b);
          return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="var(--line)" strokeWidth="1.5" />;
        })}
        {g.nodes.map((n) => (
          <g className="cnode" key={n.id} transform={`translate(${n.x},${n.y})`} onClick={() => setUi((u) => ({ ...u, node: n }))}>
            <circle r="9" fill={COL[n.m]} opacity={n.m === "gap" ? 0.55 : 1} />
            <text x="13" y="4" fill="var(--ink)" fontSize="11">{n.label}</text>
          </g>))}
      </svg>
    </div>
  );
}

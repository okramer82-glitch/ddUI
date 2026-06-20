import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { navigate } from "../lib/router.js";

const label = (who, character) =>
  who === "you" ? "You" : who === "coach" ? "🧠 Doty" : who === "sys" ? "🖥 Sandbox" : "🤖 " + (character || "Partner");
const cls = (who) => (who === "you" ? "buyer" : who === "coach" || who === "sys" ? "coach" : "buyer");

export default function LearningBox({ id }) {
  const { db } = useStore();
  const b = db.box[id] || db.box["box-negotiation"];
  const sandbox = b.kind === "sandbox";
  const [mode, setMode] = useState("guided"); // guided | test
  const [turns, setTurns] = useState(b.turns);
  const [val, setVal] = useState("");
  const [done, setDone] = useState(false);
  const userTurns = turns.filter((t) => t.who === "you").length;

  const send = () => {
    if (!val.trim() || done) return;
    const reply = { who: sandbox ? "sys" : (b.character ? "char" : "buyer"), text: b.reply || "Okay — keep going.", character: b.character };
    const add = [{ who: "you", text: val }, reply];
    if (mode === "guided") add.push({ who: "coach", text: "💡 " + (b.coach || "Think about the core principle here.") });
    setTurns((t) => [...t, ...add]);
    setVal("");
  };
  const hint = () => setTurns((t) => [...t, { who: "coach", text: "💡 " + (b.coach || "Focus on the fundamentals.") }]);
  const finish = () => {
    const score = Math.min(10, 5 + userTurns);
    setTurns((t) => [...t, { who: "coach", text: `Debrief — you scored ${score}/10. ${b.coach}` }]);
    setDone(true);
  };

  return (
    <div className="boxsim">
      <header className="boxsim__head"><span>{b.glyph} {b.name} · Level {b.level}/{b.max}{sandbox && <span className="wfchip" style={{ marginLeft: 8 }}>sandbox</span>}</span>
        <span className="boxsim__right">
          <span className="segmented">
            <button className={"seg" + (mode === "guided" ? " is-active" : "")} onClick={() => setMode("guided")}>🧭 Guided</button>
            <button className={"seg" + (mode === "test" ? " is-active" : "")} onClick={() => setMode("test")}>🎯 Test</button>
          </span>
          <span className="mono">⏱ {b.timer}</span>
          <button className="btn btn--ghost btn--sm" onClick={() => navigate("#/learning")}>Exit</button></span></header>
      <div className="boxsim__stage">
        <p className="scene">Scene: "{b.scene}"</p>
        {turns.map((t, i) => (
          <div className={"bubble bubble--" + cls(t.who)} key={i}>{label(t.who, t.character || b.character)}: "{t.text}"</div>))}
        {!done && <div className="boxsim__input">
          <input className="cmd__input" placeholder={sandbox ? "type a command / your code…" : "type or 🎙 speak your response…"} value={val}
            onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          {mode === "guided" && <button className="btn btn--ghost" onClick={hint}>💡 Hint</button>}
          <button className="btn btn--primary" onClick={send}>{sandbox ? "Run" : "Send"}</button></div>}
        {done && <button className="btn btn--ghost" style={{ marginTop: 8 }} onClick={() => { setTurns(b.turns); setDone(false); }}>Try again</button>}
      </div>
      <footer className="boxsim__foot">
        {mode === "guided"
          ? <p className="coach">🧭 Guided mode — Doty coaches you live ▸ <em>"{b.coach}"</em></p>
          : <p className="coach">🎯 Test mode — hints off. {done ? "Scored." : <button className="link" onClick={finish}>Finish &amp; get scored</button>}</p>}
        <p className="muted">Skills exercised: {b.skills.join(" · ")}</p></footer>
    </div>
  );
}

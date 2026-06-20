import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { useHashRoute, navigate } from "../lib/router.js";
import { KNOWLEDGE_BASE, buildMinionLogic, normalizeLogic, MINION_SUGGESTIONS } from "./folder/formMeta.js";
import LogicCanvas from "./folder/LogicCanvas.jsx";
import { saveMinion } from "./minionBuilder.jsx";

const CATEGORIES = Object.keys(KNOWLEDGE_BASE);
const splitList = (s, sep) => (s ? s.split(sep).map((x) => x.trim()).filter(Boolean) : []);

export default function MinionBuilderPage() {
  const store = useStore();
  const { db, showToast } = store;
  const { id, sub } = useHashRoute();
  const isNew = id === "new";
  const editCat = isNew ? null : decodeURIComponent(id || "");
  const editName = isNew ? null : decodeURIComponent(sub || "");
  const existing = editCat ? db.minionHub[editCat]?.find((m) => m.name === editName) : null;

  const [name, setName] = useState(existing?.name || "@");
  const [category, setCategory] = useState(editCat || "Marketing");
  const [skillList, setSkillList] = useState(() => splitList(existing?.skills, /,\s*/));
  const [ruleList, setRuleList] = useState(() => splitList(existing?.rules, /\s*·\s*/));
  const [framework, setFramework] = useState(existing?.framework || null);
  const [desc, setDesc] = useState(existing?.desc || "");
  const [logic, setLogic] = useState(() => normalizeLogic(existing?.logic));

  const frameworks = KNOWLEDGE_BASE[category] || [];
  const sugg = MINION_SUGGESTIONS[category] || { skills: [], rules: [] };
  const chooseFw = (id2) => { const fw = frameworks.find((x) => x.id === id2); setFramework(fw ? { id: fw.id, name: fw.name, desc: fw.desc, criteria: fw.criteria } : null); };
  const build = () => {
    if (!desc.trim()) { showToast("Describe what the minion should do first"); return; }
    setLogic((l) => ({ ...l, ...buildMinionLogic(category, desc) }));
    showToast("Doty built a sample workflow — edit it on the canvas, then test it");
  };
  const save = () => {
    if (!name.replace("@", "").trim()) { showToast("Give the minion a name"); return; }
    saveMinion(store, existing?.name, { name: name.startsWith("@") ? name : "@" + name, category, skills: skillList.join(", "), rules: ruleList.join(" · "), framework, desc, logic });
    navigate("#/minions");
  };

  return (
    <div className="mbpage">
      <header className="mbpage__bar">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate("#/minions")}>← Minions</button>
        <h1 className="mbpage__title">{existing ? "✎ Edit " + existing.name : "🤖 New minion"}</h1>
        <div className="row gap">
          <button className="btn btn--ghost" onClick={() => navigate("#/minions")}>Cancel</button>
          <button className="btn btn--primary" onClick={save}>{existing ? "Save minion" : "✓ Add to team"}</button>
        </div>
      </header>

      <div className="mbpage__body">
        <div className="mbpage__main">
          <div className="card">
            <div className="row gap">
              <label className="fld flex1"><span>Name</span><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="@Riley" /></label>
              <label className="fld flex1"><span>Category</span>
                <select className="sel" value={category} onChange={(e) => { setCategory(e.target.value); setFramework(null); }}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
            </div>
            <div className="fld"><span>Skills <span className="muted small">— ✦ Doty suggests, pick or add your own</span></span>
              <ChipPicker suggestions={sugg.skills} value={skillList} onChange={setSkillList} placeholder="Add a skill…" /></div>
            <div className="fld"><span>Rules <span className="muted small">— ✦ Doty suggests, pick or add your own</span></span>
              <ChipPicker suggestions={sugg.rules} value={ruleList} onChange={setRuleList} placeholder="Add a rule…" /></div>
            <label className="fld"><span>Skills framework <span className="muted small">— from the {category} knowledge base</span></span>
              <div className="kbframeworks kbframeworks--inline">{frameworks.map((fw) => (
                <button key={fw.id} className={"kbcard" + (framework?.id === fw.id ? " is-active" : "")} onClick={() => chooseFw(framework?.id === fw.id ? "" : fw.id)}>
                  <strong>{fw.name}</strong><span className="muted small">{fw.desc}</span>
                  <span className="kbcrit">{fw.criteria.map((c) => <span className="kbchip" key={c}>{c}</span>)}</span></button>))}</div></label>
          </div>

          <div className="card card--ai"><h4 className="card__title"><span>✦</span> Describe how this minion works — Doty drafts its logic</h4>
            <p className="muted small">e.g. <em>"When a lead comes in, qualify it with BANT. If budget &gt; $20k notify @Frank, else nurture. Store qualified leads to a file."</em></p>
            <textarea className="ta" rows="3" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <button className="btn btn--primary" style={{ marginTop: 8 }} onClick={build}>✦ Build logic</button></div>

          <h4 className="sub">How {name} will work <span className="muted small">— editable logic canvas</span></h4>
          <LogicCanvas nodes={logic.nodes} edges={logic.edges} onChange={(nodes, edges) => setLogic((l) => ({ ...l, nodes, edges }))} />
          <p className="muted small">{logic.nodes.length} nodes · {logic.edges.length} connections</p>
        </div>

        <aside className="mbpage__test">
          <ChatTest name={name} framework={framework} desc={desc} skills={skillList.join(", ")} logic={logic} onAdd={save} isNew={!existing} />
        </aside>
      </div>
    </div>
  );
}

function ChipPicker({ suggestions, value, onChange, placeholder }) {
  const [custom, setCustom] = useState("");
  const add = (s) => { if (s && !value.includes(s)) onChange([...value, s]); };
  const remove = (s) => onChange(value.filter((x) => x !== s));
  const addCustom = () => { if (custom.trim()) { add(custom.trim()); setCustom(""); } };
  const remaining = suggestions.filter((s) => !value.includes(s));
  return (
    <div className="chippick">
      {value.length > 0 && <div className="chippick__sel">{value.map((s) => (
        <span className="selchip" key={s}>{s}<button onClick={() => remove(s)} title="remove">✕</button></span>))}</div>}
      <div className="chippick__sug"><span className="muted small">✦ Doty:</span>
        {remaining.length ? remaining.map((s) => <button key={s} className="sugchip" onClick={() => add(s)}>+ {s}</button>) : <span className="muted small">all added</span>}</div>
      <div className="inviterow"><input className="inp" placeholder={placeholder} value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())} />
        <button className="btn btn--ghost btn--sm" onClick={addCustom}>+ Add</button></div>
    </div>
  );
}

function makeReply(input, { framework, logic, skills }) {
  const fw = framework ? ` using ${framework.name}` : "";
  const action = logic?.nodes?.find((n) => n.kind === "action")?.desc;
  const store = logic?.nodes?.find((n) => n.kind === "store" && n.file?.trim())?.file?.trim();
  return `Got it. I'd assess "${input.slice(0, 60)}"${fw}${skills ? ` (skills: ${skills.split(",")[0].trim()})` : ""}` +
    `${action ? `, then ${action.toLowerCase()}` : ""}${store ? `, and store the result to 📄 ${store}` : ""}. — demo response`;
}

function ChatTest({ name, framework, desc, skills, logic, onAdd, isNew }) {
  const intro = desc ? `Hi, I'm ${name || "your minion"}. Here's how I'll work: ${desc}` : `Hi, I'm ${name || "your minion"}. Describe me on the left, then test me here.`;
  const [msgs, setMsgs] = useState([{ who: "bot", text: intro }]);
  const [val, setVal] = useState("");
  const send = () => {
    if (!val.trim()) return;
    setMsgs((m) => [...m, { who: "you", text: val }, { who: "bot", text: makeReply(val, { framework, logic, skills }) }]);
    setVal("");
  };
  return (
    <div className="mbtest">
      <div className="mbtest__head"><strong>🧪 Test {name}</strong><span className="muted small">before adding to the team</span></div>
      {framework && <div className="mbtest__fw">📚 reasoning with {framework.name}</div>}
      <div className="mbtest__msgs">{msgs.map((b, i) => (
        <div className={"bubble bubble--" + (b.who === "you" ? "buyer" : "coach")} key={i}>{b.who === "bot" ? "🤖 " : ""}{b.text}</div>))}</div>
      <div className="boxsim__input"><input className="cmd__input" placeholder={`Send ${name} a test message…`} value={val}
        onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="btn btn--primary" onClick={send}>Send</button></div>
      <button className="btn btn--primary mbtest__add" onClick={onAdd}>{isNew ? "✓ Add to team" : "Save minion"}</button>
    </div>
  );
}

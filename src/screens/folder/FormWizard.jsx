import { useState, useMemo } from "react";
import { useStore } from "../../store/store.jsx";
import { ModalFrame } from "../../shell/Modal.jsx";
import { createForm, updateForm } from "./folderActions.js";
import { FORM_TYPES, typeMeta, KNOWLEDGE_BASE, promptToCanvas, normalizeLogic, buildReportHtml } from "./formMeta.js";
import LogicCanvas from "./LogicCanvas.jsx";

const MAIN_TYPES = FORM_TYPES.filter((t) => !["ticket", "pr-interview"].includes(t.id));
const STEPS = ["Type", "Fields & access", "Logic", "Knowledge base", "Output report", "Review & publish"];
const uniq = (a) => [...new Set(a)];

/** Multi-step, live-preview form builder used for both create and edit. */
export default function FormWizard({ fid, formId, setTab }) {
  const store = useStore();
  const { db } = store;
  const f = db.folders[fid];
  const existing = formId ? f?.forms.find((x) => x.id === formId) : null;

  const [step, setStep] = useState(0);
  const [type, setType] = useState(existing?.type || "lead-capture");
  const [name, setName] = useState(existing?.name || "");
  const [fields, setFields] = useState(() => existing?.fields?.slice() || typeMeta(existing?.type || "lead-capture").fields.slice());
  const [gate, setGate] = useState(existing?.gate !== false);
  const [logic, setLogic] = useState(() => normalizeLogic(existing?.logic));
  const [framework, setFramework] = useState(existing?.framework || null);
  const [output, setOutput] = useState(existing?.output || { fileName: "", description: "" });

  const [sector, setSector] = useState(framework?.sector || "Sales");
  const [extra, setExtra] = useState("");

  const meta = typeMeta(type);
  const storeFile = logic.nodes.find((n) => n.kind === "store" && n.file?.trim())?.file?.trim();
  const effOutput = storeFile ? { ...output, fileName: storeFile } : output;
  const cfg = { type, name, fields, gate, logic, framework, output: effOutput };
  const reportHtml = useMemo(() => buildReportHtml(cfg, f?.name), [type, name, fields, framework, output.description]); // eslint-disable-line

  const pickType = (t) => { setType(t.id); setFields(t.fields.slice()); };
  const available = uniq([...meta.fields, ...(framework?.criteria || []), ...fields]);
  const toggleField = (x) => setFields((a) => (a.includes(x) ? a.filter((y) => y !== x) : [...a, x]));
  const addField = () => { if (extra.trim() && !fields.includes(extra.trim())) { setFields((a) => [...a, extra.trim()]); setExtra(""); } };
  const buildLogic = () => setLogic((l) => ({ ...l, ...promptToCanvas(l.prompt) }));
  const setCanvas = (nodes, edges) => setLogic((l) => ({ ...l, nodes, edges }));
  const chooseFramework = (fw) => setFramework({ sector, id: fw.id, name: fw.name, desc: fw.desc, criteria: fw.criteria });

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const publish = () => { if (existing) updateForm(store, fid, formId, cfg); else createForm(store, fid, cfg, setTab); };

  return (
    <ModalFrame title={`${existing ? "⚙ Edit" : "📨 Build"} form — ${name || meta.name}`} footer={
      <div className="wizfoot">
        <button className="btn btn--ghost" onClick={back} disabled={step === 0}>← Back</button>
        <span className="wizfoot__spacer" />
        {step < STEPS.length - 1
          ? <button className="btn btn--primary" onClick={next}>Next →</button>
          : <button className="btn btn--primary" onClick={publish}>{existing ? "Save form" : "Publish — make link live"}</button>}
      </div>}>
      <ol className="wizsteps">{STEPS.map((s, i) => (
        <li key={s} className={"wizstep" + (i === step ? " is-active" : i < step ? " is-done" : "")} onClick={() => setStep(i)}>
          <span className="wizstep__n">{i < step ? "✓" : i + 1}</span><span className="wizstep__l">{s}</span></li>))}</ol>

      {/* ---- Step 0: Type ---- */}
      {step === 0 && (
        <div className="wizbody">
          <label className="fld"><span>Form name</span><input className="inp" placeholder="e.g. Acme demo request" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <p className="muted small">Pick a general type — each works across many use cases. You'll customize it next.</p>
          <div className="typegrid">{MAIN_TYPES.map((t) => (
            <button key={t.id} className={"typecard" + (type === t.id ? " is-active" : "")} onClick={() => pickType(t)}>
              <span className="typecard__ico">{t.ico}</span><strong>{t.name}</strong>
              <span className="muted small">{t.desc}</span></button>))}</div>
        </div>)}

      {/* ---- Step 1: Fields & access ---- */}
      {step === 1 && (
        <div className="wizsplit">
          <div className="wizsplit__edit">
            {type === "chatbot"
              ? <p className="muted small">The chat assistant has no fields — visitors just chat with your files.</p>
              : <>
                <h4 className="sub" style={{ marginTop: 0 }}>Fields visitors fill in</h4>
                <div className="recfields">{available.map((x) => (
                  <label className={"recfield" + (fields.includes(x) ? " is-on" : "")} key={x}><input type="checkbox" checked={fields.includes(x)} onChange={() => toggleField(x)} /> {x}</label>))}</div>
                <div className="inviterow" style={{ marginTop: 8 }}><input className="inp" placeholder="Add a custom field…" value={extra} onChange={(e) => setExtra(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addField())} />
                  <button className="btn btn--ghost btn--sm" onClick={addField}>+ Add</button></div>
              </>}
            <h4 className="sub">How visitors access it</h4>
            <div className="formtypes">
              <label className={"ftpick" + (gate ? " is-active" : "")}><input type="radio" checked={gate} onChange={() => setGate(true)} />🪪 Gather contact info first (2 steps)</label>
              <label className={"ftpick" + (!gate ? " is-active" : "")}><input type="radio" checked={!gate} onChange={() => setGate(false)} />⚡ Open directly</label>
            </div>
          </div>
          <div className="wizsplit__prev"><div className="previewlabel">Live form preview</div><FormPreview type={type} name={name || meta.name} fields={fields} gate={gate} /></div>
        </div>)}

      {/* ---- Step 2: Logic canvas ---- */}
      {step === 2 && (
        <div className="wizbody">
          <div className="card card--ai"><h4 className="card__title"><span>✦</span> Build the logic on a canvas</h4>
            <p className="muted small">Describe it and let Doty lay out a starting flow, then drag nodes, edit descriptions, and connect them with arrows. Add a <strong>🔁 Store to file</strong> node to save any result into a named file.</p>
            <div className="addnode"><input className="inp" placeholder='e.g. "If budget > $20k then notify @Frank, score with BANT, store qualified leads to a file"' value={logic.prompt} onChange={(e) => setLogic((l) => ({ ...l, prompt: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && buildLogic()} />
              <button className="btn btn--primary" onClick={buildLogic}>✦ Build flow</button></div></div>
          <LogicCanvas nodes={logic.nodes} edges={logic.edges} onChange={setCanvas} />
          <p className="muted small">{logic.nodes.length} nodes · {logic.edges.length} connections{storeFile ? ` · result → 📄 ${storeFile}` : ""}</p>
        </div>)}

      {/* ---- Step 3: Knowledge base ---- */}
      {step === 3 && (
        <div className="wizbody">
          <p className="muted small">Add a proven framework to shape the form &amp; its scoring. Pick a sector, then a framework.</p>
          <div className="kbwrap">
            <ul className="kbsectors">{Object.keys(KNOWLEDGE_BASE).map((s) => (
              <li key={s} className={"kbsector" + (sector === s ? " is-active" : "")} onClick={() => setSector(s)}>{s}</li>))}</ul>
            <div className="kbframeworks">{KNOWLEDGE_BASE[sector].map((fw) => (
              <button key={fw.id} className={"kbcard" + (framework?.id === fw.id ? " is-active" : "")} onClick={() => chooseFramework(fw)}>
                <strong>{fw.name}</strong><span className="muted small">{fw.desc}</span>
                <span className="kbcrit">{fw.criteria.map((c) => <span className="kbchip" key={c}>{c}</span>)}</span></button>))}</div>
          </div>
          {framework && <div className="card" style={{ marginTop: 12 }}>
            <p className="small"><strong>{framework.name}</strong> attached. Its criteria appear in the report and can be added as form fields.</p>
            <div className="row gap"><button className="btn btn--ghost btn--sm" onClick={() => setFields((a) => uniq([...a, ...framework.criteria]))}>+ Add criteria as fields</button>
              <button className="btn btn--ghost btn--sm" onClick={() => setFramework(null)}>Remove framework</button></div></div>}
        </div>)}

      {/* ---- Step 4: Output report ---- */}
      {step === 4 && (
        <div className="wizsplit">
          <div className="wizsplit__edit">
            <label className="fld"><span>Store results in a dynamic file</span>
              <input className="inp" placeholder="e.g. Acme leads (live)" value={storeFile || output.fileName} disabled={!!storeFile} onChange={(e) => setOutput((o) => ({ ...o, fileName: e.target.value }))} /></label>
            {storeFile
              ? <p className="muted small">Name comes from your <strong>🔁 Store to file</strong> node in the Logic canvas.</p>
              : <p className="muted small">This file appears in the left tree under 📁 {f?.name}, updates on every submission, and keeps version history.</p>}
            <label className="fld"><span>Describe how the HTML report should look</span>
              <textarea className="ta" rows="3" placeholder="e.g. A clean table of each submission with a BANT score panel. Use cards, dark theme." value={output.description} onChange={(e) => setOutput((o) => ({ ...o, description: e.target.value }))} /></label>
            <p className="muted small">Tip: mention <em>cards</em> or <em>dark</em> to change the layout. Preview updates live →</p>
          </div>
          <div className="wizsplit__prev"><div className="previewlabel">Live report preview (sample data)</div>
            <iframe className="htmlpreview" title="report" srcDoc={reportHtml} /></div>
        </div>)}

      {/* ---- Step 5: Review ---- */}
      {step === 5 && (
        <div className="wizbody">
          <div className="reviewgrid">
            <div className="reviewcol"><div className="previewlabel">Form ({gate ? "2-step" : "direct"})</div><FormPreview type={type} name={name || meta.name} fields={fields} gate={gate} /></div>
            <div className="reviewcol"><div className="previewlabel">Report → {output.fileName || "not stored"}</div><iframe className="htmlpreview" title="report2" srcDoc={reportHtml} /></div>
          </div>
          <div className="card" style={{ marginTop: 12 }}><h4 className="card__title">Summary</h4>
            <ul className="sumlist">
              <li>Type: <strong>{meta.name}</strong></li>
              <li>Fields: <strong>{type === "chatbot" ? "chat" : fields.length}</strong> · Access: <strong>{gate ? "gather info first" : "direct"}</strong></li>
              <li>Logic: <strong>{logic.nodes.length ? logic.nodes.length + " nodes · " + logic.edges.length + " arrows" : "none"}</strong> · Framework: <strong>{framework?.name || "none"}</strong></li>
              <li>Stored in: <strong>{effOutput.fileName ? "📄 " + effOutput.fileName : "—"}</strong></li>
            </ul></div>
        </div>)}
    </ModalFrame>
  );
}

/** Compact, non-interactive preview of the live form. */
function FormPreview({ type, name, fields, gate }) {
  const isFile = (x) => /upload|file|attach|cv|resume|id document/i.test(x);
  return (
    <div className="formprev">
      <div className="formprev__bar"><span className="formprev__dot" /><span className="formprev__dot" /><span className="formprev__dot" /></div>
      <div className="formprev__page">
        <div className="formprev__brand">⦿ Doty</div>
        <h3 className="formprev__title">{name}</h3>
        {gate && <div className="formprev__steps"><span className="is-on">① Your details</span><span>② Form</span></div>}
        {gate
          ? <>{["Full name *", "Work email *", "Phone number *"].map((x) => <div className="formprev__f" key={x}><span>{x}</span><div className="formprev__in" /></div>)}
            <div className="formprev__btn">Continue →</div></>
          : type === "chatbot"
            ? <div className="formprev__chat"><div className="formprev__bub">Hi! Ask me anything about our files.</div><div className="formprev__in formprev__in--wide" /></div>
            : <>{(fields.length ? fields : ["Field"]).slice(0, 6).map((x) => <div className="formprev__f" key={x}><span>{x}</span>{isFile(x) ? <div className="formprev__drop">⬆ upload</div> : <div className="formprev__in" />}</div>)}
              <div className="formprev__btn">Submit</div></>}
      </div>
    </div>
  );
}

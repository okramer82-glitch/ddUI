import { useState } from "react";
import { useStore } from "../store/store.jsx";
import { useHashRoute, navigate } from "../lib/router.js";
import { submitForm } from "./folder/folderActions.js";
import { typeMeta } from "./folder/formMeta.js";

const isFile = (x) => /upload|file|attach|cv|resume|csv|pdf|xlsx|document|id/i.test(x);
const isLong = (x) => /describe|message|details|question|comment|notes|help|about|reason/i.test(x);

export default function PublicForm() {
  const { id, sub } = useHashRoute();
  const store = useStore();
  const { db } = store;
  const f = db.folders[id];
  const fm = f?.forms.find((x) => x.id === sub);
  const gated = fm?.gate !== false;
  const [sent, setSent] = useState(false);
  const [step, setStep] = useState(gated ? "contact" : "form");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });

  if (!f || !fm) {
    return (
      <div className="pform">
        <div className="pform__card">
          <div className="pform__brand">⦿ Doty</div>
          <h2 className="pform__title">Form not available</h2>
          <p className="muted">This link may have been unpublished or moved.</p>
          <button className="btn btn--ghost" onClick={() => navigate("#/pulse")}>← Back to app</button>
        </div>
      </div>
    );
  }

  const t = typeMeta(fm.type);
  const meta = { ico: t.ico, tag: t.name, blurb: t.desc };
  const base = t.base;
  const isTicket = /ticket/.test(fm.type);
  const isBooking = base === "booking";
  const fields = fm.fields?.length ? fm.fields : (t.fields.length ? t.fields : (f.recommendedFormFields || ["Full name", "Email"]));
  const submit = () => { submitForm(store, id, fm.id); setSent(true); };
  const proceed = () => {
    if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim()) { store.showToast("Please fill in your name, work email and phone number"); return; }
    setStep("form");
  };
  const cta = isTicket ? "Submit ticket" : isBooking ? "Book it" : fm.type === "verification" ? "Verify me" : "Submit";

  return (
    <div className="pform">
      <div className="pform__card">
        <div className="pform__head">
          <div className="pform__brand">⦿ Doty</div>
          <span className="pform__tag">{meta.ico} {meta.tag}</span>
        </div>
        <h1 className="pform__title">{fm.name}</h1>
        <p className="muted">{meta.blurb}</p>
        <div className="pform__org muted small">Shared by 📁 {f.name}</div>

        {gated && !sent && (
          <div className="pform__progress">
            <span className={"pstep" + (step === "contact" ? " is-active" : " is-done")}>① Your details</span>
            <span className="pstep__sep">→</span>
            <span className={"pstep" + (step === "form" ? " is-active" : "")}>② {meta.tag}</span>
          </div>)}

        {sent ? (
          <div className="pform__done">
            <div className="pform__check">✓</div>
            <h2>{isTicket ? "Ticket received" : isBooking ? "Thanks — we'll be in touch" : "Submitted"}</h2>
            <p className="muted">It's now being processed by {f.name}'s workflow. You'll get a reply by email.</p>
            <button className="btn btn--ghost" onClick={() => { setSent(false); setStep(gated ? "contact" : "form"); }}>Submit another</button>
          </div>
        ) : gated && step === "contact" ? (
          <div className="pform__body">
            <p className="small">First, a few details so we can follow up. <span className="muted">All required.</span></p>
            <label className="fld"><span>Full name *</span><input className="inp" placeholder="Jane Doe" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} /></label>
            <label className="fld"><span>Work email *</span><input className="inp" type="email" placeholder="jane@company.com" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} /></label>
            <label className="fld"><span>Phone number *</span><input className="inp" type="tel" placeholder="+1 555 0100" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} /></label>
            <button className="btn btn--primary pform__submit" onClick={proceed}>Continue →</button>
          </div>
        ) : base === "chat" ? (
          <ChatVariant name={f.name} />
        ) : (
          <div className="pform__body">
            {isBooking && <ol className="pform__steps"><li>About you</li><li>Your needs</li><li>Book a slot</li></ol>}
            {fm.type === "verification" && <div className="pform__notice">🔒 Your data is encrypted and used only for verification.</div>}
            {fields.map((x, i) => (
              <label className="fld" key={i}><span>{x}</span>
                {isFile(x) ? <div className="dropzone dropzone--sm">⬆ Upload {x.toLowerCase()}</div>
                  : isLong(x) ? <textarea className="ta" rows="3" placeholder={x} />
                    : /priority/i.test(x) ? <select className="sel"><option>Normal</option><option>High</option><option>Urgent</option></select>
                      : <input className="inp" placeholder={x} />}</label>))}
            <button className="btn btn--primary pform__submit" onClick={submit}>{cta}</button>
          </div>
        )}

        <div className="pform__foot muted small">Powered by Doty · <a className="link" onClick={() => navigate("#/folder/" + id)}>open in app</a></div>
      </div>
    </div>
  );
}

function ChatVariant({ name }) {
  const [chat, setChat] = useState([{ who: "bot", text: `Hi! I'm ${name}'s assistant. Ask me anything about our documents.` }]);
  const [val, setVal] = useState("");
  const send = () => {
    if (!val.trim()) return;
    setChat((c) => [...c, { who: "you", text: val }, { who: "bot", text: "Here's what I found in the files… (demo answer)" }]);
    setVal("");
  };
  return (
    <div className="pform__chat">
      <div className="pform__msgs">{chat.map((b, i) => (
        <div className={"bubble bubble--" + (b.who === "you" ? "buyer" : "coach")} key={i}>{b.text}</div>))}</div>
      <div className="boxsim__input"><input className="cmd__input" placeholder="Type a question…" value={val}
        onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
        <button className="btn btn--primary" onClick={send}>Ask</button></div>
    </div>
  );
}

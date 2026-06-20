import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/store.jsx";

/* Flatten the workspace folders so the user can reference one in chat. */
const collectFolders = (nodes, out = [], prefix = "") => {
  for (const n of nodes || []) {
    if (n.type === "folder") {
      out.push({ id: n.id, label: prefix + n.name });
      collectFolders(n.children, out, prefix + n.name + " / ");
    }
  }
  return out;
};

const STARTERS = {
  ask: "Hi — I'm Doty. Ask me anything about your work. Tap ＋ to point me at a folder.",
  assign: "Hi! Tell me what you'd like done and I'll turn it into tasks for the right minions. Reference a folder so I have context.",
};

/* Reusable Doty chat — used in the right dock and the Assign-task tab. */
export default function AIChat({ variant = "dock", mode = "ask", defaultFolderId = null, onCollapse }) {
  const { db } = useStore();
  const folders = collectFolders(db.tree);

  const [refs, setRefs]   = useState(defaultFolderId ? [defaultFolderId] : []);
  const [msgs, setMsgs]   = useState([{ id: 1, role: "ai", text: STARTERS[mode] || STARTERS.ask }]);
  const [val, setVal]     = useState("");
  const [pickOpen, setPick] = useState(false);
  const listRef = useRef(null);
  const idRef   = useRef(2);

  useEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs]);

  const refLabel  = (id) => folders.find((f) => f.id === id)?.label || "folder";
  const addRef    = (id) => { setRefs((r) => (r.includes(id) ? r : [...r, id])); setPick(false); };
  const removeRef = (id) => setRefs((r) => r.filter((x) => x !== id));

  const replyText = (usedRefs) => {
    const ctx = usedRefs.length ? ` about ${usedRefs.map(refLabel).join(", ")}` : "";
    if (mode === "assign")
      return `Got it — I'll create the tasks${ctx} and assign them to the right minions. Want me to set a due date or priority?`;
    return usedRefs.length
      ? `Looking at${ctx} — its workflow, files and board. Here's what I found…`
      : "Here's my take. Tap ＋ to point me at a folder if you'd like me to focus on something specific.";
  };

  const send = () => {
    const text = val.trim(); if (!text) return;
    const usedRefs = [...refs];
    setMsgs((m) => [...m, { id: idRef.current++, role: "user", text, refs: usedRefs }]);
    setVal("");
    const typingId = idRef.current++;
    setMsgs((m) => [...m, { id: typingId, role: "ai", typing: true }]);
    setTimeout(() => {
      setMsgs((m) => m.filter((x) => x.id !== typingId).concat({ id: idRef.current++, role: "ai", text: replyText(usedRefs) }));
    }, 700);
  };

  return (
    <div className={"aichat aichat--" + variant}>
      <header className="aichat__head">
        <span className="aichat__brand"><span className="aichat__orb">✦</span> Doty</span>
        <span className="aichat__sub">{mode === "assign" ? "Assign tasks" : "Ask anything"}</span>
        {onCollapse && <button className="iconbtn aichat__collapse" title="Hide" onClick={onCollapse}>✕</button>}
      </header>

      <div className="aichat__list" ref={listRef}>
        {msgs.map((m) => m.typing ? (
          <div key={m.id} className="aimsg aimsg--ai">
            <span className="aimsg__av">✦</span>
            <div className="aibubble aibubble--typing"><span /><span /><span /></div>
          </div>
        ) : (
          <div key={m.id} className={"aimsg aimsg--" + m.role}>
            {m.role === "ai" && <span className="aimsg__av">✦</span>}
            <div className="aibubble">
              {m.refs?.length > 0 && (
                <div className="aibubble__refs">{m.refs.map((r) => <span key={r} className="airef">📁 {refLabel(r)}</span>)}</div>
              )}
              <span>{m.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="aichat__compose">
        {refs.length > 0 && (
          <div className="aichat__refs">
            {refs.map((r) => (
              <span key={r} className="airef airef--active">📁 {refLabel(r)}
                <button onClick={() => removeRef(r)} title="Remove">✕</button></span>
            ))}
          </div>
        )}
        <div className="aichat__inputrow">
          <button className="aichat__plus" title="Reference a folder" onClick={() => setPick((o) => !o)}>＋</button>
          <input className="aichat__input" placeholder={mode === "assign" ? "Describe the task…" : "Message Doty…"}
            value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className={"aichat__send" + (val.trim() ? " is-on" : "")} onClick={send} title="Send">➤</button>
        </div>
        {pickOpen && (
          <div className="aichat__pick">
            <div className="aichat__pick-h">Reference a folder</div>
            <div className="aichat__pick-list">
              {folders.length ? folders.map((f) => (
                <button key={f.id} className="aichat__pick-item" onClick={() => addRef(f.id)}>📁 {f.label}</button>
              )) : <div className="muted small" style={{ padding: 8 }}>No folders yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

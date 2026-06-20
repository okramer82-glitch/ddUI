import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/store.jsx";
import { navigate } from "../lib/router.js";

export default function CommandBar() {
  const { db, showToast } = useStore();
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const onOpen = () => setOpen((o) => !o);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("flowna:cmdk", onOpen);
    document.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("flowna:cmdk", onOpen); document.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  if (!open) return null;

  const pick = (c) => { setOpen(false); if (c.route) navigate(c.route); else showToast("Routing → " + c.pillar); };

  return (
    <div className="cmd-overlay" onClick={(e) => { if (e.target.classList.contains("cmd-overlay")) setOpen(false); }}>
      <div className="cmd">
        <div className="cmd__inputrow">
          <span className="cmd__prompt">＞</span>
          <input ref={inputRef} className="cmd__input" placeholder="type intent… build a board · draft follow-ups · teach me…" />
          <kbd className="cmd__esc">Esc</kbd>
        </div>
        <div className="cmd__sugs">
          <p className="cmd__seclabel">suggestions</p>
          {db.commands.map((c, i) => (
            <button key={i} className="cmd__sug" onClick={() => pick(c)}>
              <span className={"g-" + (c.color === "blue" ? "board" : c.color === "teal" ? "flow" : c.color === "amber" ? "learn" : "report")}>{c.glyph}</span>
              {c.text} <span className={"pill pill--" + c.color}>{c.pillar}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { navigate } from "./router.js";
import { useStore } from "../store/store.jsx";

/* glyphs / colors shared across screens */
export const GLYPH = { folder: "📁", flow: "⚙", report: "📊", board: "🧩", learn: "🎓", doc: "📄", chat: "💬", agent: "🤖" };
export const GCLASS = { flow: "g-flow", report: "g-report", board: "g-board", learn: "g-learn", doc: "g-doc" };

export function CircleBadge({ c }) {
  if (c === "shared") return <span className="circle circle--shared" title="Shared">◐</span>;
  if (c === "institutional") return <span className="circle circle--inst" title="Institutional">◍</span>;
  return <span className="circle circle--ind" title="Individual">●</span>;
}

export function StatusDot({ s }) {
  return s ? <span className={`dot dot--${s}`} title={s} /> : null;
}

const RISK = { suggest: "🟢 Suggest", draft: "🟡 Draft", exec: "🔴 Execute", wait: "⏳ Waiting", done: "✓ Done" };
export function RiskBadge({ r }) {
  return <span className={`riskbadge riskbadge--${r}`}>{RISK[r] || r}</span>;
}

/** "why?" evidence link — opens the dock's evidence section + a toast. */
export function Why({ text, label = "why?" }) {
  const { showToast } = useStore();
  return (
    <button className="why" onClick={(e) => {
      e.stopPropagation();
      document.getElementById("shell")?.classList.remove("dock-collapsed", "dock-hidden");
      if (text) showToast("Evidence: " + text);
      document.querySelector(".dock__sec--evidence")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }}>{label}</button>
  );
}

/** Render a string that may contain trusted inline HTML (from db). */
export function Html({ as: Tag = "span", html, ...rest }) {
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Anchor that navigates the hash router. */
export function Link({ to, className, children, ...rest }) {
  return (
    <a className={className} onClick={(e) => { e.preventDefault(); navigate(to); }} href={to} {...rest}>
      {children}
    </a>
  );
}

export { navigate };

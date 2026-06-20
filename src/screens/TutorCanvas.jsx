import { useState, useRef, useEffect, useCallback } from "react";
import { navigate } from "../lib/router.js";
import { useStore } from "../store/store.jsx";

/* ── Mock AI ────────────────────────────────────────────── */
function mockAI(question) {
  const q = question.toLowerCase();

  if (/negotiat|btna|pitch|deal|price|anchor/.test(q)) return {
    mainAnswer: "Negotiation is structured value exchange. BTNA (Best Terms Negotiation Approach) gives you a repeatable framework: anchor → explore → concede strategically → close.",
    branches: [
      { topic: "Anchoring", responseType: "text", content: "Open with your ideal outcome. 70%+ of final deals land within 15% of the first anchor. Never let the other side go first." },
      { topic: "BTNA Phases", responseType: "table", content: '[["Phase","Goal","Key move"],["Open","Set anchor","State ideal boldly"],["Explore","Reveal interests","Ask why 3×"],["Concede","Trade value","Never even"],["Close","Lock agreement","Summarise + silence"]]' },
      { topic: "Common traps", responseType: "text", content: "• Negotiating against yourself\n• Even concessions (signals weakness)\n• Accepting the first counter\n• Ignoring deadlines as leverage" },
      { topic: "Voice & presence", responseType: "text", content: "Slow down 20% at key moments. Mirror their last 2–3 words. Silence after a counter is your most powerful tool." },
    ],
    suggestions: ["How to handle aggressive push-back?", "Best anchor for SaaS deals?", "Explain ZOPA vs BATNA"],
  };

  if (/python|oop|class|inherit|object/.test(q)) return {
    mainAnswer: "Python OOP models the world as objects with state (attributes) and behaviour (methods). The four pillars — Encapsulation, Inheritance, Polymorphism, Abstraction — build on top of each other.",
    branches: [
      { topic: "Class vs Instance", responseType: "text", content: "A class is the blueprint. An instance is a concrete object. `__init__` sets initial state via `self.attr = value` and runs at creation." },
      { topic: "Inheritance", responseType: "table", content: '[["Concept","What it does"],["class B(A)","Inherit all A methods"],["super()","Call parent __init__"],["@override","Replace parent method"],["MRO","C3 linearisation order"]]' },
      { topic: "Dunder methods", responseType: "text", content: "__str__ → print\n__eq__ → ==\n__len__ → len()\n__iter__ → for loops\n\nMakes your classes feel like built-ins." },
      { topic: "Common pitfalls", responseType: "text", content: "• Mutable defaults in __init__\n• Shallow copy of nested objects\n• Diamond problem in multiple inheritance\n• @classmethod vs @staticmethod confusion" },
    ],
    suggestions: ["Real-world class hierarchy example", "What's a metaclass?", "Composition vs inheritance?"],
  };

  if (/kubernetes|k8s|deploy|pod|container|docker/.test(q)) return {
    mainAnswer: "Kubernetes orchestrates containers across a cluster, ensuring services run reliably, scale on demand, and self-heal when pods fail.",
    branches: [
      { topic: "Core objects", responseType: "table", content: '[["Object","Purpose"],["Pod","Runs 1+ containers on a node"],["Deployment","Manages pod replicas + rollout"],["Service","Stable network endpoint"],["ConfigMap","Inject config as env/volume"],["PVC","Persistent storage"]]' },
      { topic: "Rolling deploy", responseType: "text", content: "Deployments replace pods gradually — old pod stays alive until readinessProbe passes. `maxSurge` / `maxUnavailable` tune speed vs safety." },
      { topic: "Debug flow", responseType: "text", content: "1. kubectl get pods → find failing pod\n2. kubectl describe pod <name> → see Events\n3. kubectl logs <pod> → app logs\n4. kubectl exec -it <pod> -- sh → shell inside" },
      { topic: "Auto-scaling", responseType: "text", content: "HPA watches CPU/memory → adjusts replicas. VPA adjusts resource requests. KEDA scales on custom metrics like queue depth." },
    ],
    suggestions: ["How does ingress routing work?", "Explain PVCs", "What's a Helm chart?"],
  };

  if (/rabbit|queue|message|pubsub|broker|amqp/.test(q)) return {
    mainAnswer: "RabbitMQ decouples producers from consumers via exchanges, queues, and bindings. Flow: Producer → Exchange → Queue → Consumer.",
    branches: [
      { topic: "Exchange types", responseType: "table", content: '[["Type","Routing logic","Use case"],["Direct","Exact routing key","Task queues"],["Topic","Pattern (*.error.#)","Event fan-out"],["Fanout","All bound queues","Broadcast"],["Headers","Header attributes","Complex routing"]]' },
      { topic: "Dead Letter Queue", responseType: "text", content: "Rejected, expired, or overflowed messages route to a DLX. DLQs let you inspect failures without losing data. Always configure in prod." },
      { topic: "Reliability", responseType: "text", content: "• Publisher confirms: broker acks persistence\n• Consumer acks: ack only after processing\n• Durable queues + persistent messages survive restarts\n• Quorum queues for HA" },
      { topic: "Mistakes", responseType: "text", content: "• Auto-ack before processing (data loss)\n• No DLQ (silent black hole)\n• Large prefetch → uneven load\n• Not monitoring queue depth" },
    ],
    suggestions: ["Scale consumers horizontally?", "Quorum vs classic queues", "Producer/consumer pattern?"],
  };

  if (/sql|database|index|query|postgres|mysql|performance/.test(q)) return {
    mainAnswer: "SQL query performance lives and dies by indexes. An index trades write cost for read speed — knowing when to add one (and when it hurts) is the core skill.",
    branches: [
      { topic: "EXPLAIN ANALYZE", responseType: "text", content: "Always run EXPLAIN ANALYZE first.\n• Seq Scan on large table → missing index\n• Nested Loop on huge sets → missing join index\n• Row estimate way off → run ANALYZE" },
      { topic: "Index types", responseType: "table", content: '[["Type","Best for","Trade-off"],["B-tree","Equality + range","Low write cost"],["Hash","Exact equality","Slightly faster reads"],["GIN","JSONB / arrays","High write cost"],["BRIN","Time-series, huge tables","Very small size"]]' },
      { topic: "Index patterns", responseType: "text", content: "• High-cardinality cols first in compound index\n• Covering index: include all SELECT cols\n• Partial index: WHERE is_active = true (smaller)\n• Avoid functions on indexed col" },
      { topic: "Anti-patterns", responseType: "text", content: "• SELECT * (reads cols you don't need)\n• N+1 queries (use JOIN or eager load)\n• LIKE '%term' (can't use index)\n• Index on low-cardinality col (3 distinct values = useless)" },
    ],
    suggestions: ["Find slow queries in Postgres?", "When does an index hurt?", "Query plan caching?"],
  };

  if (/design|ux|ui|user|interface|figma|wireframe/.test(q)) return {
    mainAnswer: "Good design solves a real problem clearly and quickly. The core loop: understand the user's mental model → remove friction → provide feedback → build trust.",
    branches: [
      { topic: "Design principles", responseType: "table", content: '[["Principle","What it means"],["Affordance","Looks like what it does"],["Feedback","Confirms every action"],["Consistency","Same pattern = same result"],["Hierarchy","Eyes land on what matters first"]]' },
      { topic: "Visual hierarchy", responseType: "text", content: "F-pattern and Z-pattern scanning: users read top-left first. Put the primary action there. Use size, weight, and contrast — not colour alone — to signal importance." },
      { topic: "Common UX mistakes", responseType: "text", content: "• Hiding the primary action\n• Too many choices at once\n• Form fields with no inline validation\n• Modal dialogs for non-critical info\n• Placeholder text as labels" },
      { topic: "Design tokens", responseType: "text", content: "Tokens are named decisions: color/brand/primary = #5B6EF5. A token layer between design and code means one change cascades everywhere — spacing, radius, shadow, typography." },
    ],
    suggestions: ["How to run a usability test?", "Explain Gestalt principles", "What makes great onboarding?"],
  };

  const short = question.length > 44 ? question.slice(0, 41) + "…" : question;
  return {
    mainAnswer: `Here's a structured breakdown of "${short}" — split into core concepts, applications, and common pitfalls so you build a complete mental model.`,
    branches: [
      { topic: "Core concept", responseType: "text", content: "Start from first principles — understand the underlying model and why it was designed that way before memorising patterns." },
      { topic: "Key terms", responseType: "table", content: '[["Term","What it means"],["Foundation","The primary building block"],["Mechanism","How the parts interact"],["Output","The expected result or behaviour"]]' },
      { topic: "Common mistakes", responseType: "text", content: "1. Skipping fundamentals to copy patterns\n2. Over-engineering before understanding\n3. Not practising with realistic examples\n4. Ignoring edge cases" },
      { topic: "Practice path", responseType: "text", content: "→ Study the concept (15 min)\n→ Reproduce a simple example from scratch\n→ Apply to a real project\n→ Teach it back (the ultimate test)" },
    ],
    suggestions: [`Give me a concrete example of "${short}"`, "What are the advanced topics?", "How do I practise this quickly?"],
  };
}

/* ── Helpers ────────────────────────────────────────────── */
let _uid = 1;
const uid = () => "n" + (_uid++);

function renderTableInline(content) {
  try {
    const rows = JSON.parse(content);
    return (
      <div className="tc-table-wrap">
        <table className="tc-table">
          <thead><tr>{rows[0].map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{rows.slice(1).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    );
  } catch { return <p className="tc-text">{content}</p>; }
}

/* ── Canvas node ────────────────────────────────────────── */
function TcNode({ node, onDragStart, onSuggestion }) {
  const cls = "tc-node" +
    (node.role === "user" ? " tc-node--user" :
     node.role === "branch" ? " tc-node--branch" : " tc-node--ai");
  return (
    <div className={cls}
      style={{ left: node.x, top: node.y, transform: "translate(-50%,-50%)" }}
      onMouseDown={(e) => { e.stopPropagation(); onDragStart(e, node.id); }}>
      <div className="tc-node__who">{node.role === "user" ? "👤 You" : node.role === "branch" ? node.topic : "🧠 Tutor"}</div>
      {node.status === "loading"
        ? <div className="tc-loading"><span /><span /><span /><span className="muted small">Thinking…</span></div>
        : node.dataType === "table"
          ? renderTableInline(node.content)
          : <p className="tc-text">{node.content}</p>}
      {node.suggestions?.length > 0 && (
        <div className="tc-suggestions">
          {node.suggestions.map((s, i) => (
            <button key={i} className="tc-sug" onClick={(e) => { e.stopPropagation(); onSuggestion(s, node.id); }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── SVG edge ───────────────────────────────────────────── */
function TcEdge({ source, target }) {
  if (!source || !target) return null;
  const dx = target.x - source.x, dy = target.y - source.y;
  const h = Math.abs(dx) > Math.abs(dy);
  const c1x = h ? source.x + dx / 2 : source.x, c1y = h ? source.y : source.y + dy / 2;
  const c2x = h ? target.x - dx / 2 : target.x, c2y = h ? target.y : target.y - dy / 2;
  return (
    <path d={`M${source.x} ${source.y} C${c1x} ${c1y},${c2x} ${c2y},${target.x} ${target.y}`}
      fill="none" stroke="var(--line-strong,#334155)" strokeWidth="2" strokeDasharray="5 5"
      markerEnd="url(#tc-arrow)" />
  );
}

/* ── Text view ──────────────────────────────────────────── */
function TextView({ messages, onSuggestion, msgRef }) {
  return (
    <div className="tc-textview" ref={msgRef}>
      {messages.map((m, i) => (
        <div key={i} className={"tc-bubble tc-bubble--" + m.role}>
          {m.role !== "user" && <div className="tc-bubble__who">{m.role === "branch" ? "📌 " + m.topic : "🧠 Tutor"}</div>}
          {m.status === "loading"
            ? <div className="tc-loading"><span /><span /><span /><span className="muted small">Thinking…</span></div>
            : m.dataType === "table"
              ? renderTableInline(m.content)
              : <p className="tc-text" style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>}
          {m.suggestions?.length > 0 && (
            <div className="tc-suggestions" style={{ marginTop: 8 }}>
              {m.suggestions.map((s, j) => (
                <button key={j} className="tc-sug" onClick={() => onSuggestion(s)}>{s}</button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Main screen ────────────────────────────────────────── */
const ROOT_X = 460, ROOT_Y = 280;

const INIT_NODES = [{
  id: "root", role: "ai", dataType: "text", status: "done",
  content: "Hello! I'm your Doty Tutor.\n\nAsk me anything — I'll map the answer visually so you can explore each branch. Try a suggestion below.",
  x: ROOT_X, y: ROOT_Y,
  suggestions: ["Explain BTNA negotiation framework", "How does Python OOP work?", "What is a Dead Letter Queue?"],
}];

const INIT_MSGS = [{
  role: "ai", dataType: "text", status: "done",
  content: "Hello! I'm your Doty Tutor.\n\nAsk me anything — I'll break the answer into branches you can explore. Try a suggestion below.",
  suggestions: ["Explain BTNA negotiation framework", "How does Python OOP work?", "What is a Dead Letter Queue?"],
}];

export default function TutorCanvas() {
  const store = useStore();

  /* view toggle */
  const [view, setView] = useState("canvas");

  /* canvas state */
  const [nodes, setNodes] = useState(INIT_NODES);
  const [edges, setEdges] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const activeNode = useRef("root");

  /* text state */
  const [messages, setMessages] = useState(INIT_MSGS);
  const msgRef = useRef(null);

  /* shared input */
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const wrapRef = useRef(null);

  /* setup: block wheel from propagating + voice */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const stopWheel = (e) => e.stopPropagation();
    wrap.addEventListener("wheel", stopWheel, { passive: true });
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const r = new SR();
      r.continuous = false; r.interimResults = false;
      r.onresult = (ev) => { setInput(ev.results[0][0].transcript); setListening(false); };
      r.onerror = () => setListening(false);
      r.onend = () => setListening(false);
      recRef.current = r;
    }
    return () => wrap.removeEventListener("wheel", stopWheel);
  }, []);

  /* auto-scroll text view */
  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [messages]);

  /* canvas pan/zoom/drag */
  const onWheel = (e) => {
    if (view !== "canvas") return;
    const nz = Math.min(3, Math.max(0.2, zoom * (1 - e.deltaY * 0.001)));
    const mx = e.clientX, my = e.clientY;
    setPan({ x: mx - (mx - pan.x) * (nz / zoom), y: my - (my - pan.y) * (nz / zoom) });
    setZoom(nz);
  };
  const onMouseDown = (e) => {
    if (view !== "canvas" || dragging) return;
    setDragging("canvas"); lastPos.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e) => {
    if (!dragging || view !== "canvas") return;
    const dx = e.clientX - lastPos.current.x, dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    if (dragging === "canvas") setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    else setNodes((ns) => ns.map((n) => n.id === dragging ? { ...n, x: n.x + dx / zoom, y: n.y + dy / zoom } : n));
  };
  const onMouseUp = () => setDragging(null);

  const startNodeDrag = (e, id) => {
    setDragging(id); activeNode.current = id; lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const recenter = () => {
    setZoom(1);
    const w = wrapRef.current;
    setPan({ x: (w ? w.clientWidth / 2 : 500) - ROOT_X, y: (w ? w.clientHeight / 2 : 300) - ROOT_Y });
  };

  /* save topic folder to learnTree */
  const saveTopic = useCallback((question, resp) => {
    const topicName = question.length > 50 ? question.slice(0, 47) + "…" : question;
    const fid = "tf-" + Date.now();
    store.update((d) => {
      if (!d.learnTree) d.learnTree = [];
      let shelf = d.learnTree.find((n) => n.id === "tutor-notes");
      if (!shelf) {
        shelf = { id: "tutor-notes", type: "folder", name: "📚 Tutor Notes", open: true, children: [] };
        d.learnTree.unshift(shelf);
      }
      shelf.children = [
        {
          id: fid, type: "folder", name: topicName, open: false,
          children: resp.branches.map((b, i) => ({
            id: fid + "-" + i, type: "lesson", name: b.topic, route: "#/tutor",
          })),
        },
        ...(shelf.children || []),
      ];
    });
    store.showToast("📚 Saved to Learning: " + topicName);
  }, [store]);

  /* submit — shared between both views */
  const submit = useCallback(async (text, sourceId = null) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    setInput(""); setBusy(true);

    /* ── canvas: add user + loading node ── */
    const parent = nodes.find((n) => n.id === (sourceId || activeNode.current)) || nodes[nodes.length - 1];
    const spX = 380, spY = (Math.random() - 0.5) * 140;
    const uId = uid(), aId = uid();
    const uNode = { id: uId, role: "user", dataType: "text", status: "done", content: q, x: parent.x + spX, y: parent.y + spY };
    const aNode = { id: aId, role: "ai", dataType: "text", status: "loading", content: "", x: uNode.x + spX, y: uNode.y };
    setNodes((ns) => [...ns, uNode, aNode]);
    setEdges((es) => [...es,
      { id: uid(), src: parent.id, tgt: uId },
      { id: uid(), src: uId, tgt: aId },
    ]);
    activeNode.current = aId;
    if (view === "canvas") setPan((p) => ({ x: p.x - spX * zoom * 1.4, y: p.y - spY * zoom }));

    /* ── text: add user + loading bubble ── */
    setMessages((ms) => [...ms,
      { role: "user", dataType: "text", status: "done", content: q },
      { role: "ai", dataType: "text", status: "loading", content: "" },
    ]);

    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));

    const resp = mockAI(q);

    /* ── canvas: update ai node + add branches ── */
    const branchNodes = resp.branches.map((b, i) => {
      const bId = uid();
      return { id: bId, role: "branch", topic: b.topic, dataType: b.responseType, status: "done", content: b.content, x: aNode.x + 380, y: aNode.y + (i - (resp.branches.length - 1) / 2) * 200 };
    });
    setNodes((ns) => [
      ...ns.map((n) => n.id === aId ? { ...n, status: "done", content: resp.mainAnswer, suggestions: resp.suggestions } : n),
      ...branchNodes,
    ]);
    setEdges((es) => [...es, ...branchNodes.map((bn) => ({ id: uid(), src: aId, tgt: bn.id }))]);

    /* ── text: replace loading bubble + add branches ── */
    setMessages((ms) => [
      ...ms.slice(0, -1), // remove loading bubble
      { role: "ai", dataType: "text", status: "done", content: resp.mainAnswer, suggestions: resp.suggestions },
      ...resp.branches.map((b) => ({ role: "branch", topic: b.topic, dataType: b.responseType, status: "done", content: b.content })),
    ]);

    /* ── save folder in learnTree ── */
    saveTopic(q, resp);
    setBusy(false);
  }, [input, busy, nodes, view, zoom, saveTopic]);

  const toggleVoice = () => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); setListening(false); }
    else { recRef.current.start(); setListening(true); }
  };

  return (
    <div ref={wrapRef} className="tc-wrap"
      onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove}
      onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

      {/* dot grid (canvas only) */}
      {view === "canvas" && <div className="tc-dots" style={{
        backgroundSize: `${36 * zoom}px ${36 * zoom}px`,
        backgroundPosition: `${pan.x % (36 * zoom)}px ${pan.y % (36 * zoom)}px`,
      }} />}

      {/* canvas layer */}
      {view === "canvas" && (
        <div className="tc-stage" style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
          <svg className="tc-svg" overflow="visible">
            <defs>
              <marker id="tc-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="var(--line-strong,#334155)" />
              </marker>
            </defs>
            {edges.map((e) => (
              <TcEdge key={e.id} source={nodes.find((n) => n.id === e.src)} target={nodes.find((n) => n.id === e.tgt)} />
            ))}
          </svg>
          {nodes.map((n) => (
            <TcNode key={n.id} node={n} onDragStart={startNodeDrag} onSuggestion={(t, id) => submit(t, id)} />
          ))}
        </div>
      )}

      {/* text view */}
      {view === "text" && (
        <TextView messages={messages} onSuggestion={(t) => submit(t)} msgRef={msgRef} />
      )}

      {/* toolbar */}
      <div className="tc-toolbar">
        <span className="tc-brand">👨‍🏫 Tutor</span>
        <div className="segmented" style={{ fontSize: 12 }}>
          <button className={"seg" + (view === "text" ? " is-active" : "")} onClick={() => setView("text")}>📋 Text</button>
          <button className={"seg" + (view === "canvas" ? " is-active" : "")} onClick={() => setView("canvas")}>🗺 Canvas</button>
        </div>
        {view === "canvas" && <button className="iconbtn" onClick={recenter} title="Re-centre">⊕</button>}
        <button className="btn btn--ghost btn--sm" onClick={() => navigate("#/upskilling")}>← Upskilling</button>
      </div>

      {/* input bar */}
      <div className="tc-inputbar">
        <div className="tc-inputwrap">
          <input className="tc-input" placeholder="Ask anything — Tutor maps the answer…"
            value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()} disabled={busy} />
          {recRef.current && (
            <button className={"tc-mic" + (listening ? " is-active" : "")} onClick={toggleVoice}
              title={listening ? "Stop listening" : "Speak your question"}>
              {listening ? "🔴" : "🎤"}
            </button>
          )}
          <button className={"btn btn--primary" + (busy || !input.trim() ? " btn--disabled" : "")}
            disabled={busy || !input.trim()} onClick={() => submit()}>
            {busy ? <span className="tc-spin" /> : "Send"}
          </button>
        </div>
        <p className="tc-hint muted small">
          {view === "canvas" ? "Drag canvas to pan · scroll to zoom · drag nodes to arrange" : "Answers also appear in canvas view — switch anytime"}
        </p>
      </div>
    </div>
  );
}

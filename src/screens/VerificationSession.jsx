import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/store.jsx";
import { navigate } from "../lib/router.js";

/* ── Questions per skill ────────────────────────────────── */
const SKILL_QS = {
  "sk-btna": [
    { q: "Describe the four phases of the BTNA framework in order.", hint: "Open → Explore → Concede → Close" },
    { q: "How do you set an effective anchor, and what's the psychological principle behind it?", hint: "First number sets the negotiation range. State your ideal boldly." },
    { q: "What's the difference between a position and an interest in negotiation?", hint: "Position = what you say you want. Interest = why you want it." },
    { q: "Why should concessions never be even-sized? What signal does it send to the other side?", hint: "Decreasing concessions signal you're approaching your walk-away point." },
    { q: "The buyer anchors first at 40% below your target. Walk me through your recovery.", hint: "Label it, reframe with your own anchor — don't split the difference." },
  ],
  "sk-sysdesign": [
    { q: "Explain the CAP theorem. What does 'partition tolerance' mean in a real distributed system?", hint: "You can only guarantee 2 of: Consistency, Availability, Partition tolerance." },
    { q: "Compare eventual consistency vs strong consistency. When would you choose each?", hint: "Strong: banking, inventory. Eventual: social feeds, DNS caches." },
    { q: "Design a rate limiter for an API handling 100k requests per minute. Walk me through your approach.", hint: "Token bucket vs sliding window. Redis INCR + TTL is a common impl." },
    { q: "What trade-offs would you weigh when choosing between SQL and NoSQL for a new service?", hint: "Schema flexibility, ACID requirements, query patterns, scale." },
    { q: "How would you build a distributed job queue that guarantees at-least-once delivery?", hint: "Message broker with acks, idempotent consumers, DLQ for failures." },
  ],
  "sk-async": [
    { q: "What are the 5 canonical patterns for handling async errors in JavaScript?", hint: "try/catch, .catch(), error boundaries, global handler, retry logic." },
    { q: "When should you use try/catch vs .catch() on a Promise? What's the difference?", hint: "try/catch works in async functions; .catch() is for the Promise chain." },
    { q: "Explain unhandledRejection and why it matters in a Node.js production service.", hint: "Unhandled rejections silently swallow failures — always handle them." },
    { q: "How would you implement retry-with-backoff for a flaky external API call?", hint: "Exponential delays, max attempts, jitter to avoid thundering herd." },
  ],
};

function getQuestions(skillId, skillName) {
  if (SKILL_QS[skillId]) return SKILL_QS[skillId];
  return [
    { q: `Explain the core concept of "${skillName}" in your own words.`, hint: "Start from first principles." },
    { q: `What are the most common mistakes practitioners make with "${skillName}"?`, hint: "Think about what beginners typically get wrong." },
    { q: `Give a real example where you applied "${skillName}" successfully.`, hint: "Context → action → result." },
    { q: `How would you explain "${skillName}" to someone with no background in it?`, hint: "Use an analogy or a simple scenario." },
    { q: `What are the advanced or nuanced aspects of "${skillName}" most people overlook?`, hint: "Think about edge cases and trade-offs." },
  ];
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* ── Component ──────────────────────────────────────────── */
export default function VerificationSession({ id }) {
  const store = useStore();
  const { db, update, showToast } = store;

  const req = (db.verifyRequests || []).find((r) => r.id === id);
  const user = db.user || { name: "You" };
  const questions = req ? getQuestions(req.skillId, req.skillName) : [];

  const [phase, setPhase] = useState("lobby"); // lobby | session | done
  const [qIdx, setQIdx] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const recRef = useRef(null);
  const timerRef = useRef(null);
  const txRef = useRef(null);

  /* auto-scroll transcript */
  useEffect(() => {
    if (txRef.current) txRef.current.scrollTop = txRef.current.scrollHeight;
  }, [transcript, interim]);

  /* timer */
  useEffect(() => {
    if (phase !== "session") return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  /* speech recognition */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = true; r.interimResults = true;
    r.onresult = (e) => {
      let final = "", inter = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else inter += e.results[i][0].transcript;
      }
      setInterim(inter);
      if (final.trim()) {
        setTranscript((t) => [...t, { role: "user", text: final.trim() }]);
        setInterim("");
      }
    };
    r.onerror = () => { setListening(false); setInterim(""); };
    r.onend = () => { setListening(false); setInterim(""); };
    recRef.current = r;
  }, []);

  const toggleMic = () => {
    if (!recRef.current) { showToast("Microphone not available — type your answer below"); return; }
    if (listening) { recRef.current.stop(); setListening(false); }
    else { recRef.current.start(); setListening(true); }
  };

  const startSession = () => {
    setTranscript([{ role: "ai", text: questions[0].q }]);
    setQIdx(0); setShowHint(false); setPhase("session");
  };

  const nextQ = () => {
    if (listening) { recRef.current?.stop(); setListening(false); }
    if (qIdx >= questions.length - 1) { finish(); return; }
    const next = questions[qIdx + 1];
    setTranscript((t) => [...t, { role: "ai", text: next.q }]);
    setQIdx((q) => q + 1);
    setShowHint(false);
  };

  const finish = () => {
    if (listening) { recRef.current?.stop(); setListening(false); }
    clearInterval(timerRef.current);
    update((d) => {
      const r = (d.verifyRequests || []).find((x) => x.id === id);
      if (r) r.status = "completed";
    });
    setPhase("done");
  };

  if (!req) return (
    <div className="view"><p className="muted">Verification request not found.</p>
      <button className="btn btn--ghost" onClick={() => navigate("#/upskilling")}>← Back</button></div>
  );

  const answered = transcript.filter((t) => t.role === "user").length;
  const currentQ = questions[qIdx];

  /* ── Lobby ── */
  if (phase === "lobby") return (
    <div className="vslobby-wrap">
      <div className="vslobby">
        <div className="vslobby__icon">🔵</div>
        <h2 style={{ margin: 0 }}>Skill Verification</h2>
        <div className="vslobby__skill">{req.skillName}</div>
        <div className="muted small">{req.category}</div>
        {req.note && (
          <div className="card vslobby__note">
            <p className="muted small" style={{ margin: "0 0 4px" }}>"{req.note}"</p>
            <span className="muted small">— {req.requestedBy}</span>
          </div>
        )}
        <div className="vslobby__meta">
          <span>📋 {questions.length} questions</span>
          <span>⏱ ~{questions.length * 2} min</span>
          <span>🎤 Speak or type answers</span>
        </div>
        <button className="btn btn--primary vslobby__start" onClick={startSession}>Start Session →</button>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate("#/upskilling")}>← Back</button>
      </div>
    </div>
  );

  /* ── Done ── */
  if (phase === "done") return (
    <div className="vslobby-wrap">
      <div className="vslobby">
        <div className="vslobby__icon">✅</div>
        <h2 style={{ margin: 0 }}>Session Complete</h2>
        <div className="vslobby__skill">{req.skillName}</div>
        <div className="vslobby__meta">
          <span>📋 {answered} answer{answered !== 1 ? "s" : ""} recorded</span>
          <span>⏱ {fmt(elapsed)}</span>
        </div>
        <div className="vslobby__tx-review">
          <div className="vslobby__tx-head">📝 Transcript</div>
          {transcript.map((t, i) => (
            <div key={i} className={"vstx vstx--" + t.role}>
              <span className="vstx__who">{t.role === "ai" ? "🤖 Doty" : "👤 " + user.name}</span>
              <span className="vstx__text">{t.text}</span>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ textAlign: "center" }}>
          Doty will review your answers and update your skill status.
        </p>
        <button className="btn btn--primary" onClick={() => navigate("#/upskilling")}>← Back to Upskilling</button>
      </div>
    </div>
  );

  /* ── Active session ── */
  return (
    <div className="vsess">

      {/* Header */}
      <header className="vsess__header">
        <span className="vsrec-dot" />
        <span className="vsess__title">Verifying: <strong>{req.skillName}</strong></span>
        <div className="vsess__progress">
          {questions.map((_, i) => (
            <span key={i} className={"vsess__pdot" + (i < qIdx ? " done" : i === qIdx ? " active" : "")} />
          ))}
        </div>
        <span className="vsess__timer">{fmt(elapsed)}</span>
        <button className="btn btn--sm" style={{ background: "#e53e3e22", color: "#e53e3e", border: "1px solid #e53e3e44" }} onClick={finish}>End session</button>
      </header>

      {/* Main area */}
      <div className="vsess__main">

        {/* Screen — current question */}
        <div className="vsess__screen">
          <div className="vsess__qnum">Question {qIdx + 1} <span className="muted">of {questions.length}</span></div>
          <div className="vsess__qtext">{currentQ.q}</div>
          {showHint
            ? <div className="vsess__hint"><span className="vsess__hint-ico">💡</span>{currentQ.hint}</div>
            : <button className="btn btn--ghost btn--sm vsess__hint-btn" onClick={() => setShowHint(true)}>💡 Show hint</button>}
        </div>

        {/* Tiles — Doty + User */}
        <div className="vsess__tiles">
          <div className="vstile vstile--ai">
            <div className="vstile__avatar">🤖</div>
            <div className="vstile__name">Doty AI</div>
            <div className="vstile__status vstile__status--ai">● Interviewing</div>
          </div>
          <div className={"vstile vstile--user" + (listening ? " vstile--live" : "")}>
            <div className="vstile__avatar">{user.initials || "👤"}</div>
            <div className="vstile__name">{user.name}</div>
            <div className={"vstile__status" + (listening ? " vstile__status--live" : "")}>
              {listening ? "● Speaking…" : "● Ready"}
            </div>
            {(interim || listening) && (
              <div className="vstile__interim">{interim || "…"}</div>
            )}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="vsess__transcript" ref={txRef}>
        <div className="vsess__tx-head">📝 Transcript</div>
        {transcript.map((t, i) => (
          <div key={i} className={"vstx vstx--" + t.role}>
            <span className="vstx__who">{t.role === "ai" ? "🤖 Doty" : "👤 " + user.name}</span>
            <span className="vstx__text">{t.text}</span>
          </div>
        ))}
        {interim && (
          <div className="vstx vstx--user vstx--interim">
            <span className="vstx__who">👤 {user.name}</span>
            <span className="vstx__text">{interim}<span className="vstx__cursor">|</span></span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="vsess__controls">
        <button className={"vsess__mic" + (listening ? " vsess__mic--on" : "")} onClick={toggleMic}>
          {listening ? <><span className="vsrec-dot" style={{ marginRight: 6 }} />Stop</>  : "🎤 Speak"}
        </button>
        <button className="btn btn--ghost" onClick={nextQ}>
          {qIdx < questions.length - 1 ? "Next question →" : "Finish →"}
        </button>
        <button className="btn btn--primary" onClick={finish}>✅ Finish &amp; Score</button>
      </div>

    </div>
  );
}

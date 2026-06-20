import { useState, useRef, useEffect } from "react";
import { useStore } from "../store/store.jsx";

const STATUS_COLOR = { online: "#22c55e", away: "#f59e0b", offline: "#6b7280" };

const AI_REPLIES = [
  "Got it! I am on it.",
  "That is a great point. Let me think about this for a moment.",
  "Based on the context in your Company Brain, I would suggest reviewing the pipeline first.",
  "Noted. I will add this to your action queue.",
  "Interesting — want me to create a learning box for this topic?",
  "I have scanned your recent documents. Here is what I found relevant to that question.",
  "Confirmed. I will schedule a reminder for you.",
];

/* ── Small sub-components ──────────────────────────────────── */

function DmAvatar({ name, avatar, size = 28 }) {
  const letter = avatar && avatar.length <= 2 ? avatar : (name || "?")[0].toUpperCase();
  return (
    <div
      className="msg-dm-av"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {letter}
    </div>
  );
}

function StatusDot({ status }) {
  return (
    <span
      className="msg-status-dot"
      style={{ background: STATUS_COLOR[status] || STATUS_COLOR.offline }}
    />
  );
}

/* ── Sidebar ───────────────────────────────────────────────── */
function Sidebar({ channels, dms, activeId, onSelect }) {
  const totalUnread = [...(channels||[]), ...(dms||[])].reduce((n, x) => n + (x.unread || 0), 0);

  return (
    <aside className="msg-sidebar">
      <div className="msg-ws">
        <span className="msg-ws__name">Doty</span>
        <div className="msg-ws__online"><StatusDot status="online" /><span>Online</span></div>
      </div>

      <div className="msg-section">
        <div className="msg-section__head">
          <span>Channels</span>
          <button className="msg-add-btn" title="Add channel">＋</button>
        </div>
        {(channels || []).map(ch => (
          <button
            key={ch.id}
            className={"msg-item" + (activeId === ch.id ? " msg-item--active" : "") + (ch.unread ? " msg-item--unread" : "")}
            onClick={() => onSelect(ch.id)}
          >
            <span className="msg-item__hash">#</span>
            <span className="msg-item__name">{ch.name}</span>
            {ch.unread > 0 && <span className="msg-badge">{ch.unread}</span>}
          </button>
        ))}
      </div>

      <div className="msg-section">
        <div className="msg-section__head">
          <span>Direct Messages</span>
          <button className="msg-add-btn" title="New DM">＋</button>
        </div>
        {(dms || []).map(dm => (
          <button
            key={dm.id}
            className={"msg-item" + (activeId === dm.id ? " msg-item--active" : "") + (dm.unread ? " msg-item--unread" : "")}
            onClick={() => onSelect(dm.id)}
          >
            <DmAvatar name={dm.name} avatar={dm.avatar} size={22} />
            <StatusDot status={dm.status} />
            <span className="msg-item__name">{dm.name}</span>
            {dm.unread > 0 && <span className="msg-badge">{dm.unread}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ── Message row ───────────────────────────────────────────── */
function MsgRow({ msg, onReact }) {
  const [hover, setHover] = useState(false);
  const QUICK = ["👍","✅","🔥","💡","🎯"];

  return (
    <div
      className={"msg-row" + (msg.grouped ? " msg-row--grouped" : "")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Avatar column */}
      {!msg.grouped
        ? <DmAvatar name={msg.sender} avatar={msg.avatar} size={34} />
        : <div className="msg-av-gap" />
      }

      {/* Content */}
      <div className="msg-body">
        {!msg.grouped && (
          <div className="msg-meta">
            <span className={"msg-sender" + (msg.isOwn ? " msg-sender--own" : "")}>{msg.sender}</span>
            <span className="msg-time">{msg.time}</span>
          </div>
        )}
        <div className="msg-text">{msg.text}</div>

        {/* Reactions */}
        {(msg.reactions || []).length > 0 && (
          <div className="msg-reactions">
            {msg.reactions.map(r => (
              <button key={r.emoji} className="msg-reaction" onClick={() => onReact(msg.id, r.emoji)}>
                {r.emoji} <span>{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover quick-react toolbar */}
      {hover && (
        <div className="msg-quick-react">
          {QUICK.map(e => (
            <button key={e} className="msg-qr-btn" onClick={() => onReact(msg.id, e)}>{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main screen ───────────────────────────────────────────── */
export default function Messaging() {
  const { db, update, showToast } = useStore();
  const [activeId, setActiveId] = useState("ch-general");
  const [input, setInput]       = useState("");
  const listRef  = useRef(null);
  const inputRef = useRef(null);

  const messaging = db.messaging || { channels: [], dms: [], messages: {} };
  const { channels, dms, messages } = messaging;

  const user         = db.user || { name: "Osama", initials: "OA" };
  const activeChannel = (channels || []).find(c => c.id === activeId);
  const activeDm      = (dms     || []).find(d => d.id === activeId);
  const rawMessages   = messages?.[activeId] || [];

  /* Tag consecutive same-sender messages */
  const msgs = rawMessages.map((m, i) => ({
    ...m,
    grouped: i > 0 && rawMessages[i-1].sender === m.sender,
  }));

  /* Auto-scroll to bottom on channel switch or new message */
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [activeId, rawMessages.length]);

  /* Focus input on channel switch */
  useEffect(() => { inputRef.current?.focus(); }, [activeId]);

  /* Auto-resize textarea */
  const autoResize = (el) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const selectChannel = (id) => {
    setActiveId(id);
    update(d => {
      const ch = (d.messaging?.channels || []).find(c => c.id === id);
      const dm = (d.messaging?.dms     || []).find(x => x.id === id);
      if (ch) ch.unread = 0;
      if (dm) dm.unread = 0;
    });
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;

    const newMsg = {
      id: "msg-" + Date.now(),
      sender: user.name,
      avatar: user.initials || user.name[0],
      time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      text,
      reactions: [],
      isOwn: true,
    };

    update(d => {
      if (!d.messaging.messages) d.messaging.messages = {};
      if (!d.messaging.messages[activeId]) d.messaging.messages[activeId] = [];
      d.messaging.messages[activeId].push(newMsg);
    });
    setInput("");
    if (inputRef.current) { inputRef.current.style.height = "auto"; }

    /* Doty AI auto-reply */
    if (activeId === "dm-flowna") {
      const delay = 900 + Math.random() * 700;
      setTimeout(() => {
        const reply = {
          id: "ai-" + Date.now(),
          sender: "Doty AI",
          avatar: "AI",
          time: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          text: AI_REPLIES[Math.floor(Math.random() * AI_REPLIES.length)],
          reactions: [],
          isOwn: false,
        };
        update(d => { d.messaging.messages["dm-flowna"].push(reply); });
      }, delay);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const addReaction = (msgId, emoji) => {
    update(d => {
      const list = d.messaging?.messages?.[activeId] || [];
      const msg  = list.find(m => m.id === msgId);
      if (!msg) return;
      if (!msg.reactions) msg.reactions = [];
      const existing = msg.reactions.find(r => r.emoji === emoji);
      if (existing) existing.count++;
      else msg.reactions.push({ emoji, count: 1 });
    });
  };

  const placeholder = activeChannel
    ? "Message #" + activeChannel.name
    : "Message " + (activeDm?.name || "");

  return (
    <div className="msg-wrap">

      {/* ── Sidebar ── */}
      <Sidebar
        channels={channels}
        dms={dms}
        activeId={activeId}
        onSelect={selectChannel}
      />

      {/* ── Main pane ── */}
      <div className="msg-main">

        {/* Header */}
        <header className="msg-header">
          <div className="msg-header__id">
            {activeChannel && <span className="msg-header__hash">#</span>}
            {activeDm      && <DmAvatar name={activeDm.name} avatar={activeDm.avatar} size={28} />}
            {activeDm      && <StatusDot status={activeDm.status} />}
            <strong className="msg-header__title">
              {activeChannel?.name || activeDm?.name}
            </strong>
          </div>
          {activeChannel?.desc && (
            <span className="msg-header__desc">{activeChannel.desc}</span>
          )}
          {activeChannel?.members && (
            <span className="msg-header__members">👥 {activeChannel.members}</span>
          )}
        </header>

        {/* Message list */}
        <div className="msg-list" ref={listRef}>
          {msgs.length === 0 && (
            <div className="msg-empty">
              <div className="msg-empty__ico">{activeChannel ? "#" : "💬"}</div>
              <p>This is the very beginning of <strong>{activeChannel ? "#" + activeChannel.name : activeDm?.name}</strong>.</p>
            </div>
          )}
          {msgs.map(m => (
            <MsgRow key={m.id} msg={m} onReact={addReaction} />
          ))}
        </div>

        {/* Input bar */}
        <div className="msg-input-bar">
          <div className="msg-input-wrap">
            <div className="msg-input-tools msg-input-tools--left">
              <button className="msg-tool" title="Attach">📎</button>
            </div>
            <textarea
              ref={inputRef}
              className="msg-input"
              placeholder={placeholder}
              value={input}
              rows={1}
              onChange={e => { setInput(e.target.value); autoResize(e.target); }}
              onKeyDown={onKeyDown}
            />
            <div className="msg-input-tools msg-input-tools--right">
              <button className="msg-tool" title="Emoji" onClick={() => { setInput(v => v + "😊"); inputRef.current?.focus(); }}>😊</button>
              <button
                className={"msg-send" + (input.trim() ? " msg-send--active" : "")}
                disabled={!input.trim()}
                onClick={send}
                title="Send (Enter)"
              >
                ↑
              </button>
            </div>
          </div>
          <p className="msg-hint">Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </div>
  );
}

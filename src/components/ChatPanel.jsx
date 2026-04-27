import { useState, useRef, useEffect } from "react";

export default function ChatPanel({ thread = [], faultId, user, onSend, readOnly = false }) {
  const [msg, setMsg] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const send = () => {
    if (!msg.trim()) return;
    onSend(faultId, msg.trim());
    setMsg("");
  };

  const isHub = user.role === "supervisor" || user.role === "mechanic";

  return (
    <div className="chat-wrap" style={{ border: "1px solid #E5C99A", borderRadius: 4, background: "var(--cream)" }}>
      <div className="chat-msgs">
        {thread.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 12, textAlign: "center", marginTop: 20 }}>
            Nog geen berichten. Start een gesprek over deze melding.
          </div>
        )}
        {thread.map(m => (
          <div key={m.id} className={`msg ${m.from === "hub" ? "msg-hub" : "msg-loc"}`}>
            <div className="msg-sender">{m.sender} · {m.time}</div>
            <div className="msg-bubble">{m.text}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {!readOnly && (
        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="Typ een bericht…"
            value={msg}
            onChange={e => setMsg(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
          />
          <button className="btn btn-red btn-sm" onClick={send}>Sturen</button>
        </div>
      )}
      {readOnly && (
        <div style={{ padding: "8px 12px", fontSize: 11, color: "var(--muted)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 1, borderTop: "1px solid #E5C99A" }}>
          SUPERVISOR WEERGAVE — ALLEEN LEZEN
        </div>
      )}
    </div>
  );
}

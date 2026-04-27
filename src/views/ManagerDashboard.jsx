import { useState } from "react";
import { vehicles, faults, chatThreads, supervisorRanking } from "../data.js";
import ChatPanel from "../components/ChatPanel.jsx";

const statusBadge = (s) => {
  if (s === "Fault")      return <span className="badge badge-red">Storing</span>;
  if (s === "Start Fix")  return <span className="badge badge-gold">Bezig</span>;
  if (s === "Ready")      return <span className="badge badge-green">Klaar</span>;
  return null;
};

const typeIcon = { ebike: "🔴", scooter: "🔵", car: "⚫", bus: "🟡" };

export default function ManagerDashboard({ user, onReport, toast }) {
  const [tab, setTab]           = useState("dashboard");
  const [openChat, setOpenChat] = useState(null);
  const [threads, setThreads]   = useState(chatThreads);

  const myVehicles    = vehicles.filter(v => v.location === user.location);
  const myFaults      = faults.filter(f => f.location === user.location);
  const totalBikes    = myVehicles.filter(v => v.type === "ebike").length;
  const totalScooters = myVehicles.filter(v => v.type === "scooter").length;
  const activeFaults  = myFaults.filter(f => f.status !== "Ready").length;
  const myRank        = supervisorRanking.findIndex(r => r.manager === user.name) + 1;

  const sendMsg = (faultId, text) => {
    const time = new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    setThreads(prev => ({
      ...prev,
      [faultId]: [...(prev[faultId] || []), {
        id: Date.now(), from: "loc", sender: user.name, text, time,
      }],
    }));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex-between mb16">
        <div>
          <div className="page-title">{user.locationName}</div>
          <div className="page-sub">Manager · {user.name} · Welkom terug</div>
        </div>
        <button className="btn btn-red" onClick={onReport}>
          ⚠ Storing melden
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>Dashboard</button>
        <button className={`tab ${tab === "faults" ? "active" : ""}`} onClick={() => setTab("faults")}>
          Storingen {activeFaults > 0 && <span style={{ background: "var(--red)", color: "white", borderRadius: "50%", padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{activeFaults}</span>}
        </button>
        <button className={`tab ${tab === "ranking" ? "active" : ""}`} onClick={() => setTab("ranking")}>Ranking</button>
      </div>

      {/* ── DASHBOARD TAB ── */}
      {tab === "dashboard" && (
        <>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num">{totalBikes}</div>
              <div className="stat-label">🔴 E-Bikes</div>
            </div>
            <div className="stat-card green">
              <div className="stat-num green">{totalScooters}</div>
              <div className="stat-label">🔵 Scooters</div>
            </div>
            <div className="stat-card" style={{ borderTopColor: activeFaults > 0 ? "var(--red)" : "var(--green)" }}>
              <div className="stat-num" style={{ color: activeFaults > 0 ? "var(--red)" : "var(--green)" }}>{activeFaults}</div>
              <div className="stat-label">Actieve storingen</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-num gold">{myRank > 0 ? `#${myRank}` : "—"}</div>
              <div className="stat-label">Ranking storingen</div>
            </div>
          </div>

          {/* Last hub visit */}
          <div className="card" style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 2, color: "var(--muted)", marginBottom: 4 }}>LAATSTE HUB BEZOEK</div>
              <div style={{ fontFamily: "'Playfair Display'", fontSize: 18, fontWeight: 700 }}>24 april 2026</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>F-024 afgeleverd · F-001 opgehaald</div>
            </div>
            <div style={{ fontSize: 36 }}>🚐</div>
          </div>

          {/* Quick faults */}
          <div className="section-head">
            <h2>Recente storingen</h2>
            <div className="rule" />
            <button className="btn btn-ghost btn-sm" onClick={() => setTab("faults")}>Alle storingen →</button>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {myFaults.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                ✓ Geen actieve storingen — goed bezig!
              </div>
            ) : (
              myFaults.map(f => (
                <div key={f.id} className="fault-item">
                  <div className={`fault-icon ${f.type}`}>{typeIcon[f.type]}</div>
                  <div className="fault-meta">
                    <div className="fault-vehicle">{f.vehicle}</div>
                    <div className="fault-detail">{f.faultType} · {f.reported}</div>
                  </div>
                  {statusBadge(f.status)}
                  <button className="btn btn-ghost btn-sm" onClick={() => { setOpenChat(f.id); setTab("faults"); }}>
                    💬 Chat
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── FAULTS TAB ── */}
      {tab === "faults" && (
        <>
          <div className="section-head"><h2>Storingenlog</h2><div className="rule" /></div>
          {myFaults.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
              ✓ Geen storingen voor {user.locationName}
            </div>
          ) : (
            myFaults.map(f => (
              <div key={f.id} className="card" style={{ marginBottom: 14 }}>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{typeIcon[f.type]}</span>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 17 }}>{f.vehicle}</div>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, color: "var(--muted)" }}>{f.reported}</div>
                    </div>
                  </div>
                  {statusBadge(f.status)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12, fontSize: 13 }}>
                  <div><span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>STORING TYPE</span><br />{f.faultType}</div>
                  <div><span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>FOTO'S</span><br />{f.photos} foto{f.photos !== 1 ? "'s" : ""} geüpload</div>
                </div>
                {f.notes && (
                  <div style={{ background: "var(--cream)", border: "1px solid #E5C99A", borderRadius: 3, padding: "8px 12px", fontSize: 13, marginBottom: 12, fontStyle: "italic", color: "var(--muted)" }}>
                    "{f.notes}"
                  </div>
                )}
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 2, color: "var(--muted)", marginBottom: 6 }}>
                  CHAT MET HUB
                </div>
                <ChatPanel
                  thread={threads[f.id] || []}
                  faultId={f.id}
                  user={user}
                  onSend={sendMsg}
                />
              </div>
            ))
          )}
        </>
      )}

      {/* ── RANKING TAB ── */}
      {tab === "ranking" && (
        <>
          <div className="section-head"><h2>Locatie Ranking — Storingen</h2><div className="rule" /></div>
          <div className="card" style={{ padding: 0 }}>
            {supervisorRanking.map((r, i) => (
              <div key={r.location} className="rank-row" style={{
                padding: "10px 16px",
                background: r.manager === user.name ? "#FFF3D6" : "transparent",
              }}>
                <div className={`rank-num ${i === 0 ? "gold-num" : ""}`}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="rank-location" style={{ color: r.manager === user.name ? "var(--gold)" : "var(--ink)" }}>
                    {r.location} {r.manager === user.name && "← jij"}
                  </div>
                  <div className="rank-manager">{r.manager}</div>
                </div>
                <div className="rank-faults">{r.faults} storingen</div>
              </div>
            ))}
          </div>

          <div className="section-head mt24"><h2>Kwaliteit meldingen ★</h2><div className="rule" /></div>
          <div className="card" style={{ padding: 0 }}>
            {[...supervisorRanking].sort((a, b) => b.qualityScore - a.qualityScore).map((r, i) => (
              <div key={r.location} className="rank-row" style={{ padding: "10px 16px" }}>
                <div className={`rank-num ${i === 0 ? "gold-num" : ""}`}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="rank-location">{r.location}</div>
                  <div className="rank-manager">{r.manager}</div>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>
                  {r.qualityScore.toFixed(1)} ★
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

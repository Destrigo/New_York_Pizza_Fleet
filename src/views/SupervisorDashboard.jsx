import { useState } from "react";
import { vehicles, faults, chatThreads, supervisorRanking, locations } from "../data.js";
import ChatPanel from "../components/ChatPanel.jsx";

const statusBadge = (s) => {
  if (s === "Fault")      return <span className="badge badge-red">Storing</span>;
  if (s === "Start Fix")  return <span className="badge badge-gold">Bezig</span>;
  if (s === "Ready")      return <span className="badge badge-green">Klaar</span>;
  return null;
};
const typeIcon = { ebike: "🔴", scooter: "🔵", car: "⚫", bus: "🟡" };

export default function SupervisorDashboard({ user }) {
  const [tab, setTab]         = useState("overview");
  const [openFault, setOpen]  = useState(null);
  const [threads, setThreads] = useState(chatThreads);

  const totalBikes    = vehicles.filter(v => v.type === "ebike").length;
  const totalScooters = vehicles.filter(v => v.type === "scooter").length;
  const totalCars     = vehicles.filter(v => v.type === "car").length;
  const totalBuses    = vehicles.filter(v => v.type === "bus").length;
  const totalFaults   = faults.filter(f => f.status !== "Ready").length;
  const readyCount    = faults.filter(f => f.status === "Ready").length;

  const openFaultData = faults.find(f => f.id === openFault);

  return (
    <div>
      <div className="flex-between mb16">
        <div>
          <div className="page-title">Supervisor Dashboard</div>
          <div className="page-sub">Volledige vlootoverzicht · {user.name}</div>
        </div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 2, color: "var(--muted)" }}>
          26 APRIL 2026
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === "overview" ? "active" : ""}`}  onClick={() => setTab("overview")}>Overzicht</button>
        <button className={`tab ${tab === "faults"   ? "active" : ""}`}  onClick={() => setTab("faults")}>
          Storingen <span style={{ background: "var(--red)", color: "white", borderRadius: "50%", padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{totalFaults}</span>
        </button>
        <button className={`tab ${tab === "ranking"  ? "active" : ""}`}  onClick={() => setTab("ranking")}>Rankings</button>
        <button className={`tab ${tab === "chat"     ? "active" : ""}`}  onClick={() => setTab("chat")}>Chat</button>
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <>
          {/* Fleet totals */}
          <div className="stats-row">
            <div className="stat-card"><div className="stat-num">{totalBikes}</div><div className="stat-label">🔴 E-Bikes</div></div>
            <div className="stat-card green"><div className="stat-num green">{totalScooters}</div><div className="stat-label">🔵 Scooters</div></div>
            <div className="stat-card black"><div className="stat-num black">{totalCars}</div><div className="stat-label">⚫ Auto's</div></div>
            <div className="stat-card gold"><div className="stat-num gold">{totalBuses}</div><div className="stat-label">🟡 Bussen</div></div>
            <div className="stat-card" style={{ borderTopColor: "var(--red)" }}>
              <div className="stat-num">{totalFaults}</div>
              <div className="stat-label">Actieve storingen</div>
            </div>
            <div className="stat-card" style={{ borderTopColor: "var(--green)" }}>
              <div className="stat-num" style={{ color: "var(--green)" }}>{readyCount}</div>
              <div className="stat-label">Klaar voor ophaling</div>
            </div>
          </div>

          {/* Location overview */}
          <div className="section-head"><h2>Locatie Overzicht</h2><div className="rule" /></div>
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Locatie</th>
                  <th>Manager(s)</th>
                  <th>E-Bikes</th>
                  <th>Scooters</th>
                  <th>Storingen</th>
                </tr>
              </thead>
              <tbody>
                {locations.filter(l => !l.id.startsWith("hub")).map(loc => {
                  const locFaults = faults.filter(f => f.location === loc.id && f.status !== "Ready").length;
                  return (
                    <tr key={loc.id}>
                      <td style={{ fontWeight: 600 }}>{loc.name}</td>
                      <td style={{ color: "var(--muted)", fontSize: 13 }}>{loc.managers.join(", ")}</td>
                      <td>{vehicles.filter(v => v.location === loc.id && v.type === "ebike").length}</td>
                      <td>{vehicles.filter(v => v.location === loc.id && v.type === "scooter").length}</td>
                      <td>
                        {locFaults > 0
                          ? <span className="badge badge-red">{locFaults}</span>
                          : <span style={{ color: "var(--green)", fontSize: 13 }}>✓</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── FAULTS ── */}
      {tab === "faults" && (
        <>
          <div className="section-head"><h2>Alle Storingen</h2><div className="rule" /></div>
          {faults.map(f => (
            <div key={f.id} className="card" style={{ marginBottom: 14, cursor: "pointer", borderTopColor: f.status === "Ready" ? "var(--green)" : f.status === "Start Fix" ? "var(--gold)" : "var(--red)" }}
              onClick={() => setOpen(openFault === f.id ? null : f.id)}>
              <div className="flex-between">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{typeIcon[f.type]}</span>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 16 }}>{f.vehicle}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{f.locationName} · {f.manager}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {statusBadge(f.status)}
                  <span style={{ color: "var(--muted)", fontSize: 18 }}>{openFault === f.id ? "▲" : "▼"}</span>
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
                {f.faultType} · {f.reported} · {f.photos} foto's
              </div>
              {openFault === f.id && (
                <div style={{ marginTop: 14 }}>
                  {f.notes && <div style={{ fontStyle: "italic", fontSize: 13, color: "var(--ink)", marginBottom: 10, background: "var(--cream)", padding: "8px 12px", borderRadius: 3 }}>"{f.notes}"</div>}
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 2, color: "var(--muted)", marginBottom: 6 }}>CHATGESCHIEDENIS</div>
                  <ChatPanel thread={threads[f.id] || []} faultId={f.id} user={user} onSend={() => {}} readOnly={true} />
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── RANKINGS ── */}
      {tab === "ranking" && (
        <>
          <div className="section-head"><h2>Ranking — Meeste Storingen</h2><div className="rule" /></div>
          <div className="card" style={{ padding: 0 }}>
            {supervisorRanking.map((r, i) => (
              <div key={r.location} className="rank-row" style={{ padding: "12px 16px" }}>
                <div className={`rank-num ${i === 0 ? "gold-num" : ""}`}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="rank-location">{r.location}</div>
                  <div className="rank-manager">{r.manager}</div>
                </div>
                <div className="rank-faults">{r.faults}</div>
              </div>
            ))}
          </div>

          <div className="section-head mt24"><h2>Ranking — Kwaliteit Meldingen ★</h2><div className="rule" /></div>
          <div className="card" style={{ padding: 0 }}>
            {[...supervisorRanking].sort((a, b) => b.qualityScore - a.qualityScore).map((r, i) => (
              <div key={r.location} className="rank-row" style={{ padding: "12px 16px" }}>
                <div className={`rank-num ${i === 0 ? "gold-num" : ""}`}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div className="rank-location">{r.location}</div>
                  <div className="rank-manager">{r.manager}</div>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>{r.qualityScore.toFixed(1)} ★</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── CHAT ── */}
      {tab === "chat" && (
        <>
          <div className="section-head"><h2>Alle Chatgesprekken</h2><div className="rule" /></div>
          <div style={{ background: "#FFF3D6", border: "1px solid #D6B87A", borderRadius: 4, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--gold)", fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
            ◆ SUPERVISOR WEERGAVE — Alle gesprekken worden vastgelegd. Geen telefonisch contact toegestaan.
          </div>
          {faults.map(f => (
            <div key={f.id} className="card" style={{ marginBottom: 14 }}>
              <div className="flex-between" style={{ marginBottom: 10 }}>
                <div style={{ fontFamily: "'Playfair Display'", fontWeight: 700 }}>{f.vehicle} — {f.faultType}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{f.locationName} · {f.manager}</div>
              </div>
              <ChatPanel thread={threads[f.id] || []} faultId={f.id} user={user} onSend={() => {}} readOnly={true} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

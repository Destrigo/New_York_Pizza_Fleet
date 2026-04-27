import { useState } from "react";
import { faults as initialFaults, vehicles, driverSchedule } from "../data.js";

const nextStatus = { "Fault": "Start Fix", "Start Fix": "Ready", "Ready": "Ready" };
const statusBadge = (s) => {
  if (s === "Fault")      return <span className="badge badge-red">Storing</span>;
  if (s === "Start Fix")  return <span className="badge badge-gold">Bezig</span>;
  if (s === "Ready")      return <span className="badge badge-green">Klaar ✓</span>;
};
const typeIcon = { ebike: "🔴", scooter: "🔵", car: "⚫", bus: "🟡" };
const actionLabel = { "Fault": "Start Fix →", "Start Fix": "Markeer Klaar →", "Ready": "✓ Klaar" };

export default function HubDashboard({ user, toast }) {
  const [tab, setTab]       = useState("queue");
  const [faults, setFaults] = useState(initialFaults);

  const updateStatus = (id) => {
    setFaults(prev => prev.map(f => f.id === id ? { ...f, status: nextStatus[f.status] } : f));
  };

  const hubVehicles = vehicles.filter(v => v.location === "hub-hfd" || v.location === "hub-ens");
  const faultCount  = faults.filter(f => f.status === "Fault").length;
  const fixCount    = faults.filter(f => f.status === "Start Fix").length;
  const readyCount  = faults.filter(f => f.status === "Ready").length;

  return (
    <div>
      <div className="flex-between mb16">
        <div>
          <div className="page-title">Hub Operations</div>
          <div className="page-sub">Monteur Dashboard · {user.name}</div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === "queue" ? "active" : ""}`} onClick={() => setTab("queue")}>
          Wachtrij <span style={{ background: "var(--red)", color: "white", borderRadius: "50%", padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{faultCount}</span>
        </button>
        <button className={`tab ${tab === "vehicles" ? "active" : ""}`} onClick={() => setTab("vehicles")}>Hub Voertuigen</button>
        <button className={`tab ${tab === "schedule" ? "active" : ""}`} onClick={() => setTab("schedule")}>Planning</button>
      </div>

      {/* ── QUEUE ── */}
      {tab === "queue" && (
        <>
          <div className="stats-row">
            <div className="stat-card"><div className="stat-num">{faultCount}</div><div className="stat-label">🔴 Storing</div></div>
            <div className="stat-card gold"><div className="stat-num gold">{fixCount}</div><div className="stat-label">🟡 Bezig</div></div>
            <div className="stat-card green"><div className="stat-num green">{readyCount}</div><div className="stat-label">✓ Klaar</div></div>
          </div>

          <div className="section-head"><h2>Reparatiewachtrij</h2><div className="rule" /></div>

          {["Fault", "Start Fix", "Ready"].map(group => {
            const grouped = faults.filter(f => f.status === group);
            if (grouped.length === 0) return null;
            return (
              <div key={group} style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
                  {group === "Fault" ? "🔴 Wacht op reparatie" : group === "Start Fix" ? "🟡 In behandeling" : "✅ Gereed"}
                </div>
                {grouped.map(f => (
                  <div key={f.id} className="card" style={{ marginBottom: 10, borderTopColor: group === "Fault" ? "var(--red)" : group === "Start Fix" ? "var(--gold)" : "var(--green)" }}>
                    <div className="flex-between">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{typeIcon[f.type]}</span>
                        <div>
                          <div style={{ fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 16 }}>{f.vehicle}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{f.locationName} · {f.manager} · {f.faultType}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>{f.photos} foto's · {f.reported}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {statusBadge(f.status)}
                        {f.status !== "Ready" && (
                          <button
                            className={`btn btn-sm ${f.status === "Fault" ? "btn-red" : "btn-green"}`}
                            onClick={() => updateStatus(f.id)}
                          >
                            {actionLabel[f.status]}
                          </button>
                        )}
                      </div>
                    </div>
                    {f.notes && (
                      <div style={{ marginTop: 8, fontStyle: "italic", fontSize: 12, color: "var(--muted)", background: "var(--cream)", padding: "6px 10px", borderRadius: 3 }}>
                        "{f.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {/* ── HUB VEHICLES ── */}
      {tab === "vehicles" && (
        <>
          <div className="section-head"><h2>Voertuigen in Hub</h2><div className="rule" /></div>
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Type</th><th>Locatie</th><th>Status</th></tr>
              </thead>
              <tbody>
                {hubVehicles.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 700, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>{v.id}</td>
                    <td>{typeIcon[v.type]} {v.type}</td>
                    <td>{v.location === "hub-hfd" ? "Hub · Hoofddorp" : "Hub · Enschede"}</td>
                    <td>
                      {v.status === "ok"    && <span className="badge badge-green">Beschikbaar</span>}
                      {v.status === "fix"   && <span className="badge badge-gold">In reparatie</span>}
                      {v.status === "ready" && <span className="badge badge-green">Klaar</span>}
                      {v.status === "fault" && <span className="badge badge-red">Storing</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── SCHEDULE ── */}
      {tab === "schedule" && (
        <>
          <div className="section-head"><h2>Chauffeurs Planning — Vandaag</h2><div className="rule" /></div>
          {Object.entries(driverSchedule).map(([driver, schedule]) => (
            <div key={driver} className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 16, marginBottom: 12, color: "var(--green)" }}>
                🚐 {driver.charAt(0).toUpperCase() + driver.slice(1)}
              </div>
              {schedule.map(s => (
                <div key={s.id} className="schedule-item">
                  <div className="schedule-time">{s.time.split("–")[0]}</div>
                  <div className="schedule-meta">
                    <div className="schedule-loc">{s.to}</div>
                    <div className="schedule-detail">{s.vehicle} · {s.action}</div>
                    {s.note && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>📝 {s.note}</div>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Barlow Condensed'", letterSpacing: 1, textAlign: "right" }}>
                    {s.time.split("–")[1]}<br />einde
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

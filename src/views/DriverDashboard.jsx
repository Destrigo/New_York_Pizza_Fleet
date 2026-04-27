import { driverSchedule, vehicles } from "../data.js";

const typeIcon = { ebike: "🔴", scooter: "🔵", car: "⚫", bus: "🟡" };

export default function DriverDashboard({ user }) {
  const schedule = driverSchedule[user.name.toLowerCase()] || [];

  return (
    <div>
      <div className="flex-between mb16">
        <div>
          <div className="page-title">Jouw Planning</div>
          <div className="page-sub">Chauffeur · {user.name} · 26 April 2026</div>
        </div>
        <div style={{ fontSize: 36 }}>🚐</div>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: 24 }}>
        <div className="stat-card green">
          <div className="stat-num green">{schedule.length}</div>
          <div className="stat-label">Ritten vandaag</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{schedule.reduce((acc, s) => {
            const [start, end] = s.time.split("–").map(t => {
              const [h, m] = t.split(":").map(Number);
              return h * 60 + m;
            });
            return acc + (end - start);
          }, 0)} min</div>
          <div className="stat-label">Totale rijtijd</div>
        </div>
      </div>

      {/* Schedule */}
      <div className="section-head">
        <h2>Dagplanning</h2>
        <div className="rule" />
      </div>

      {schedule.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
          Geen ritten ingepland voor vandaag.
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          {/* Timeline line */}
          <div style={{ position: "absolute", left: 38, top: 14, bottom: 14, width: 2, background: "#E5C99A", zIndex: 0 }} />

          {schedule.map((s, i) => {
            const vehicle = vehicles.find(v => v.id === s.vehicle);
            return (
              <div key={s.id} style={{ position: "relative", zIndex: 1, display: "flex", gap: 16, marginBottom: 16 }}>
                {/* Timeline dot */}
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: "var(--green)", border: "3px solid var(--cream)",
                  marginTop: 18, flexShrink: 0, marginLeft: 30,
                  boxShadow: "0 0 0 3px var(--green)",
                }} />
                <div className="card" style={{ flex: 1, borderTopColor: "var(--green)" }}>
                  <div className="flex-between" style={{ marginBottom: 10 }}>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>
                      {s.time}
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, color: "var(--muted)" }}>
                      RIT {i + 1} VAN {schedule.length}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, letterSpacing: 2, color: "var(--muted)", marginBottom: 2 }}>VAN</div>
                      <div style={{ fontWeight: 600 }}>{s.from}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 10, letterSpacing: 2, color: "var(--muted)", marginBottom: 2 }}>NAAR</div>
                      <div style={{ fontWeight: 600 }}>{s.to}</div>
                    </div>
                  </div>

                  <div style={{ background: "var(--cream)", border: "1px solid #E5C99A", borderRadius: 3, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{vehicle ? typeIcon[vehicle.type] : "🚲"}</span>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>{s.vehicle}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.action}</div>
                    </div>
                  </div>

                  {s.note && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)", display: "flex", gap: 6 }}>
                      <span>📝</span> <span>{s.note}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card card-green" style={{ marginTop: 8, textAlign: "center", padding: "12px" }}>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 2, color: "var(--green)" }}>
          📵 GEEN TELEFONISCH CONTACT — Gebruik alleen de Hi Tom Fleet app voor communicatie
        </div>
      </div>
    </div>
  );
}

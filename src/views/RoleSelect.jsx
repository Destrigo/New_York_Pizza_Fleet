import { useState } from "react";
import { userProfiles } from "../data.js";

const roleGroups = [
  {
    role: "manager",
    title: "Locatie Manager",
    emoji: "📍",
    desc: "Beheer je locatie, meld storingen, bekijk jouw fietsoverzicht.",
    color: "red",
    users: ["ayoub", "nadir", "bryan", "alex", "marco"],
  },
  {
    role: "supervisor",
    title: "Supervisor",
    emoji: "◆",
    desc: "Volledig overzicht, alle locaties, rankings en chatgeschiedenis.",
    color: "gold",
    users: ["karim", "arjen", "amine"],
  },
  {
    role: "mechanic",
    title: "Hub Monteur",
    emoji: "🔧",
    desc: "Storingswachtrij, reparatiestatus en ritinplanning.",
    color: "green",
    users: ["mechanic"],
  },
  {
    role: "driver",
    title: "Chauffeur",
    emoji: "🚐",
    desc: "Jouw dagplanning en voertuiginformatie voor ritten.",
    color: "",
    users: ["mike", "isaac", "hassan"],
  },
];

export default function RoleSelect({ onLogin }) {
  const [selected, setSelected] = useState({});

  const login = (roleKey, userId) => {
    if (!userId) return;
    onLogin(userProfiles[userId]);
  };

  return (
    <div className="role-page">
      {/* Logo */}
      <div className="role-header">
        <div className="role-logo">
          🍕 Hi Tom <em>Fleet</em>
        </div>
        <div className="role-tagline">Fleet Management — Amsterdam & Enschede</div>
        <div className="ornament" style={{ marginTop: 16 }}>✦ ✦ ✦</div>
      </div>

      {/* Cards */}
      <div className="role-cards">
        {roleGroups.map(g => (
          <div key={g.role} className={`role-card ${g.color === "green" ? "green-card" : g.color === "gold" ? "gold-card" : ""}`}>
            <div className="role-emoji">{g.emoji}</div>
            <div className="role-title">{g.title}</div>
            <div className="role-desc">{g.desc}</div>
            <div className="role-select-wrap">
              <select
                className="role-select"
                value={selected[g.role] || ""}
                onChange={e => setSelected(s => ({ ...s, [g.role]: e.target.value }))}
              >
                <option value="">— Kies naam —</option>
                {g.users.map(uid => (
                  <option key={uid} value={uid}>{userProfiles[uid].name}</option>
                ))}
              </select>
              <button
                className="btn btn-red mt8"
                style={{ width: "100%", marginTop: 10, background: g.color === "green" ? "var(--green)" : g.color === "gold" ? "var(--gold)" : undefined }}
                onClick={() => login(g.role, selected[g.role])}
              >
                Inloggen →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, textAlign: "center" }}>
        <div className="ornament">— Demo MVP —</div>
        <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "'Barlow Condensed'", letterSpacing: 2, marginTop: 6 }}>
          KIES EEN ROL EN NAAM OM DE INTERFACE TE VERKENNEN
        </div>
      </div>
    </div>
  );
}

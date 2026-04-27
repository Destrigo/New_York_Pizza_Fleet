export default function Nav({ user, onLogout, onNavigate, currentPage }) {
  const roleLabel = {
    manager:    "Locatie Manager",
    supervisor: "Supervisor",
    mechanic:   "Hub Monteur",
    driver:     "Chauffeur",
  }[user.role] || user.role;

  return (
    <>
      <div className="checkered" />
      <nav className="nav">
        <div className="nav-brand">
          🍕 <span>Hi Tom</span> Fleet
        </div>
        <div className="nav-right">
          <div className="nav-role">{roleLabel} · {user.name}</div>
          <button className="nav-logout" onClick={onLogout}>Uitloggen</button>
        </div>
      </nav>
    </>
  );
}

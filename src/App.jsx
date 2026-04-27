import { useState } from "react";
import RoleSelect        from "./views/RoleSelect.jsx";
import ManagerDashboard  from "./views/ManagerDashboard.jsx";
import SupervisorDashboard from "./views/SupervisorDashboard.jsx";
import HubDashboard      from "./views/HubDashboard.jsx";
import DriverDashboard   from "./views/DriverDashboard.jsx";
import FaultForm         from "./views/FaultForm.jsx";
import Nav               from "./components/Nav.jsx";
import Toast             from "./components/Toast.jsx";

export default function App() {
  const [user,    setUser]    = useState(null);
  const [page,    setPage]    = useState("home");
  const [toast,   setToast]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
  };

  const login  = (profile) => { setUser(profile); setPage("home"); };
  const logout  = () => { setUser(null); setPage("home"); };

  const handleFaultSubmit = (data) => {
    showToast(`Beste ${user.name}, bedankt voor je melding. We bezoeken je locatie zo snel mogelijk. — Hi Tom Fleet`);
  };

  if (!user) return <RoleSelect onLogin={login} />;

  const renderPage = () => {
    if (page === "fault-form") {
      return (
        <FaultForm
          user={user}
          onSubmit={(data) => { handleFaultSubmit(data); setPage("home"); }}
          onBack={() => setPage("home")}
        />
      );
    }
    if (user.role === "manager")    return <ManagerDashboard    user={user} onReport={() => setPage("fault-form")} toast={showToast} />;
    if (user.role === "supervisor") return <SupervisorDashboard user={user} toast={showToast} />;
    if (user.role === "mechanic")   return <HubDashboard        user={user} toast={showToast} />;
    if (user.role === "driver")     return <DriverDashboard     user={user} />;
    return <div>Onbekende rol</div>;
  };

  return (
    <div className="app-shell">
      <Nav user={user} onLogout={logout} currentPage={page} onNavigate={setPage} />

      <main className="page">
        {renderPage()}
      </main>

      <footer className="footer">
        <div className="checkered" style={{ marginBottom: 16 }} />
        <div className="footer-brand">Hi Tom Fleet</div>
        <div className="footer-sub">Amsterdam & Enschede · Demo MVP · 2026</div>
      </footer>

      {toast && (
        <Toast
          message={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

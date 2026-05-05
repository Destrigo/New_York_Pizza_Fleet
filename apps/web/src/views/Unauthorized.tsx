import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40,
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
      <div className="htf-title">Geen toegang</div>
      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: 2, color: 'var(--muted)', margin: '8px 0 32px', maxWidth: 340 }}>
        Je hebt geen toegang tot deze pagina. Neem contact op met je supervisor.
      </div>
      <Link to="/" className="btn btn-ghost">← Terug naar dashboard</Link>
    </div>
  )
}

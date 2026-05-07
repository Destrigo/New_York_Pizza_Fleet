import { Link, useLocation } from 'react-router-dom'

const ADMIN_LINKS = [
  { to: '/admin/users',     label: 'Gebruikers' },
  { to: '/admin/locations', label: 'Locaties' },
  { to: '/admin/vehicles',  label: 'Voertuigen' },
  { to: '/admin/reserves',  label: 'Reserve targets' },
]

export default function AdminNav() {
  const { pathname } = useLocation()
  if (!pathname.startsWith('/admin')) return null

  return (
    <div style={{
      display: 'flex', gap: 6, marginBottom: 20, paddingBottom: 16,
      borderBottom: '1px solid var(--bdr)',
    }}>
      <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', alignSelf: 'center', marginRight: 6 }}>
        Admin
      </span>
      {ADMIN_LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className={`btn btn-sm ${pathname === l.to ? 'btn-red' : 'btn-muted'}`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  )
}

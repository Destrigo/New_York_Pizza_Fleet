import { Link, useLocation } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'

export default function AdminNav() {
  const { pathname } = useLocation()
  const { t } = useI18n()

  if (!pathname.startsWith('/admin')) return null

  const ADMIN_LINKS = [
    { to: '/admin/users',     label: t('adminNavUsers') },
    { to: '/admin/locations', label: t('tabLocations') },
    { to: '/admin/vehicles',  label: t('vehicles') },
    { to: '/admin/reserves',  label: t('reserveTargets') },
  ]

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

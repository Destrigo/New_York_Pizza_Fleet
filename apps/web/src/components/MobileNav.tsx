import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useNotifications } from '@/hooks/useNotifications'

export default function MobileNav() {
  const { user, signOut } = useAuth()
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()

  if (!user || user.role !== 'manager') return null

  const isActive = (path: string) => location.pathname.startsWith(path)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const items = [
    { to: '/dashboard',      icon: '🏠', label: t('tabDashboard') },
    { to: '/report',         icon: '⚠',  label: t('mobileNavReport') },
    { to: '/notifications',  icon: '🔔', label: t('navNotifications'), badge: unreadCount },
    { to: '/profile',        icon: '👤', label: t('navProfile') },
  ] as const

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--red)', borderTop: '2px solid #8B1212',
      display: 'flex', zIndex: 200,
    }} className="htf-mobile-nav">
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 4px 10px',
            color: isActive(item.to) ? '#fff' : 'rgba(255,255,255,0.6)',
            textDecoration: 'none', position: 'relative',
            borderTop: isActive(item.to) ? '2px solid #fff' : '2px solid transparent',
          }}
        >
          <span style={{ fontSize: 20, marginBottom: 2 }}>
            {item.icon}
            {'badge' in item && (item.badge as number) > 0 && (
              <span style={{
                position: 'absolute', top: 4, left: '50%',
                background: '#FBBF24', color: '#1A0800',
                borderRadius: '50%', width: 16, height: 16,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, transform: 'translateX(4px)',
              }}>
                {(item.badge as number) > 9 ? '9+' : item.badge}
              </span>
            )}
          </span>
          <span style={{ fontSize: 10, fontFamily: "'Barlow Condensed'", letterSpacing: 1, textTransform: 'uppercase' }}>
            {item.label}
          </span>
        </Link>
      ))}
      <button
        onClick={handleLogout}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '8px 4px 10px', background: 'none', border: 'none',
          borderTop: '2px solid transparent',
          color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 20, marginBottom: 2 }}>🚪</span>
        <span style={{ fontSize: 10, fontFamily: "'Barlow Condensed'", letterSpacing: 1, textTransform: 'uppercase' }}>
          {t('navLogout')}
        </span>
      </button>
    </nav>
  )
}

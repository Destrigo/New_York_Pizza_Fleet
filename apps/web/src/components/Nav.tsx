import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { useI18n } from '@/context/I18nContext'
import { roleLabel } from '@/lib/utils'
import { MOCK_MODE } from '@/lib/supabase'
import { MOCK_LOC_MAP } from '@/lib/mock'

export default function Nav() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { unreadCount } = useNotifications()
  const { lang, setLang } = useI18n()

  if (!user) return null

  const loc     = MOCK_MODE ? MOCK_LOC_MAP[user.location_id] : user.location
  const locName = loc?.name ?? ''

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const dashPath = () => {
    if (user.role === 'manager')    return '/dashboard'
    if (user.role === 'supervisor') return '/supervisor'
    if (user.role === 'mechanic')   return '/hub'
    return '/driver/schedule'
  }

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <nav className="htf-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link to={dashPath()} className="htf-brand">
          🍕 <em>Hi Tom</em> Fleet
        </Link>

        {/* Role-based quick links */}
        {user.role === 'mechanic' && (
          <>
            <Link to="/hub/queue"    className="htf-nav-btn" style={{ opacity: isActive('/hub/queue') ? 1 : 0.7 }}>Queue</Link>
            <Link to="/hub/vehicles" className="htf-nav-btn" style={{ opacity: isActive('/hub/vehicles') ? 1 : 0.7 }}>Voertuigen</Link>
            <Link to="/hub/schedule" className="htf-nav-btn" style={{ opacity: isActive('/hub/schedule') ? 1 : 0.7 }}>Planning</Link>
          </>
        )}
        {user.role === 'supervisor' && (
          <>
            <Link to="/hub/queue"   className="htf-nav-btn" style={{ opacity: isActive('/hub/queue') ? 1 : 0.7 }}>Queue</Link>
            <Link to="/admin/users" className="htf-nav-btn" style={{ opacity: isActive('/admin') ? 1 : 0.7 }}>Admin</Link>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user.role === 'manager' && (
          <Link to="/report" className="htf-nav-btn" style={{ background: 'rgba(255,255,255,0.18)', fontWeight: 700 }}>
            ⚠ Storing melden
          </Link>
        )}

        {/* Notification bell with live badge */}
        <Link to="/notifications" className="htf-nav-btn" style={{ position: 'relative', padding: '4px 10px' }}>
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#FBBF24', color: '#1A0800',
              borderRadius: '50%', width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, fontFamily: "'Barlow Condensed'",
              border: '2px solid var(--red)',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="htf-role">
          {roleLabel[user.role]} · {user.full_name}
          {locName ? ` · ${locName}` : ''}
        </div>

        <button
          className="htf-nav-btn"
          onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}
          style={{ fontFamily: "'Barlow Condensed'", letterSpacing: 1, fontSize: 12, opacity: 0.75 }}
        >
          {lang === 'nl' ? '🇬🇧 EN' : '🇳🇱 NL'}
        </button>
        <Link to="/profile" className="htf-nav-btn">Profiel</Link>
        <button className="htf-nav-btn" onClick={handleLogout}>Uitloggen</button>
      </div>
    </nav>
  )
}

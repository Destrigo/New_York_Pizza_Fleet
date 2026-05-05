import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { roleLabel } from '@/lib/utils'
import { MOCK_MODE } from '@/lib/supabase'
import { MOCK_LOC_MAP } from '@/lib/mock'

export default function Nav() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const loc = MOCK_MODE ? MOCK_LOC_MAP[user.location_id] : user.location
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

  return (
    <nav className="htf-nav">
      <Link to={dashPath()} className="htf-brand">
        🍕 <em>Hi Tom</em> Fleet
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user.role === 'manager' && (
          <Link to="/report" className="htf-nav-btn" style={{ background: 'rgba(255,255,255,0.15)' }}>
            ⚠ Storing melden
          </Link>
        )}

        <Link to="/notifications" className="htf-nav-btn" style={{ position: 'relative' }}>
          🔔
        </Link>

        <div className="htf-role">
          {roleLabel[user.role]} · {user.full_name}
          {locName ? ` · ${locName}` : ''}
        </div>

        <Link to="/profile" className="htf-nav-btn">
          Profiel
        </Link>

        <button className="htf-nav-btn" onClick={handleLogout}>
          Uitloggen
        </button>
      </div>
    </nav>
  )
}

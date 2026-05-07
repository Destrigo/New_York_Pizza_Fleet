import { Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { usePresence } from '@/hooks/usePresence'
import Nav from './Nav'
import MobileNav from './MobileNav'
import AdminNav from './AdminNav'

export default function Layout() {
  const { user, loading } = useAuth()
  usePushNotifications(user?.id)
  usePresence(user?.id)

  if (loading) {
    return (
      <div className="htf-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Barlow Condensed'", letterSpacing: 3, fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase' }}>
          Laden…
        </div>
      </div>
    )
  }

  return (
    <div className="htf-shell">
      <div className="checkered" />
      <Nav />
      <main className="htf-page">
        <AdminNav />
        <Outlet />
      </main>
      <footer className="htf-footer">
        <div className="checkered" style={{ marginBottom: 16 }} />
        <div className="htf-footer-brand">Hi Tom Fleet</div>
        <div className="htf-footer-sub">Amsterdam & Enschede · 2026</div>
      </footer>
      <MobileNav />
    </div>
  )
}

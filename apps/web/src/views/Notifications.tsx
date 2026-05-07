import { Link } from 'react-router-dom'
import { useNotifications } from '@/hooks/useNotifications'
import { fmtAgo } from '@/lib/utils'

const typeIcon: Record<string, string> = {
  fault_new:     '⚠',
  fault_update:  '🔄',
  fault_received:'✅',
  pickup:        '🚐',
  chat:          '💬',
  vehicle:       '🛵',
}

export default function Notifications() {
  const { notifs, loading, unreadCount, markRead, markAllRead } = useNotifications()

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">Notificaties</div>
          <div className="htf-sub">{unreadCount > 0 ? `${unreadCount} ongelezen` : 'Alles gelezen'}</div>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Alles gelezen markeren</button>
        )}
      </div>

      <div className="htf-card" style={{ padding: 0 }}>
        {notifs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            Geen notificaties
          </div>
        ) : (
          notifs.map((n) => (
            <div
              key={n.id}
              style={{
                display: 'flex', gap: 14, padding: '14px 16px',
                borderBottom: '1px solid #F5E6CC',
                background: n.read_at ? 'transparent' : 'var(--cream2)',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onClick={() => markRead(n.id)}
            >
              <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>
                {typeIcon[n.type] ?? '🔔'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6, lineHeight: 1.5 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 1, display: 'flex', gap: 12, alignItems: 'center' }}>
                  {n.sent_at ? fmtAgo(n.sent_at) : ''}
                  {n.related_fault_id && (
                    <Link
                      to={`/faults/${n.related_fault_id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'var(--red)', textDecoration: 'none' }}
                    >
                      Bekijk storing →
                    </Link>
                  )}
                </div>
              </div>
              {!n.read_at && (
                <div style={{ width: 10, height: 10, background: 'var(--red)', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

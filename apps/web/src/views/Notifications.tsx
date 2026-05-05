import { useState } from 'react'
import { Link } from 'react-router-dom'
import { fmtAgo } from '@/lib/utils'
import type { Notification } from '@/types'

const MOCK_NOTIFS: Notification[] = [
  { id: 'n1', recipient_id: 'ayoub', type: 'fault_new', title: 'Storing ontvangen', body: 'Beste Ayoub, bedankt voor je melding. We bezoeken je locatie zo snel mogelijk. — Hi Tom Fleet', related_fault_id: 'f1', related_pickup_id: null, read_at: null, sent_at: '2026-04-25T08:14:00Z', created_at: '2026-04-25T08:14:00Z' },
  { id: 'n2', recipient_id: 'ayoub', type: 'pickup', title: 'Ophaalmoment gepland', body: 'Beste Bilderdijkstraat/Ayoub, je staat gepland voor een ophaalmoment op 25 april tussen 10:00-11:30. Geef aanvullende informatie snel door via de Hi Tom Fleet app.', related_fault_id: 'f1', related_pickup_id: 'p1', read_at: '2026-04-25T09:00:00Z', sent_at: '2026-04-25T08:50:00Z', created_at: '2026-04-25T08:50:00Z' },
  { id: 'n3', recipient_id: 'ayoub', type: 'chat', title: 'Nieuw bericht van Hub', body: 'Hub: Duidelijk. We plannen ophaalmoment voor 25/04 tussen 13:00–15:00.', related_fault_id: 'f1', related_pickup_id: null, read_at: null, sent_at: '2026-04-25T08:35:00Z', created_at: '2026-04-25T08:35:00Z' },
]

const typeIcon: Record<string, string> = {
  fault_new:    '⚠',
  fault_update: '🔄',
  pickup:       '🚐',
  chat:         '💬',
  vehicle:      '🛵',
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>(MOCK_NOTIFS)
  const unread = notifs.filter((n) => !n.read_at).length

  const markRead = (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    )
  }

  const markAllRead = () => {
    const now = new Date().toISOString()
    setNotifs((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">Notificaties</div>
          <div className="htf-sub">{unread} ongelezen</div>
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            Alles gelezen
          </button>
        )}
      </div>

      <div className="htf-card" style={{ padding: 0 }}>
        {notifs.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
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
                cursor: 'pointer',
              }}
              onClick={() => markRead(n.id)}
            >
              <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>
                {typeIcon[n.type] ?? '🔔'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 15, marginBottom: 2 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}>{n.body}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
                  {n.sent_at ? fmtAgo(n.sent_at) : ''}
                  {n.related_fault_id && (
                    <Link
                      to={`/faults/${n.related_fault_id}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ marginLeft: 12, color: 'var(--red)', textDecoration: 'none' }}
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

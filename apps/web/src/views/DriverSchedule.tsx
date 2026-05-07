import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { fmtDate } from '@/lib/utils'
import { MOCK_LOC_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useSchedules } from '@/hooks/useSchedules'

export default function DriverSchedule() {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)

  const { schedules, loading, complete } = useSchedules({ driverId: user?.id, date })

  if (!user) return null

  const myItems = schedules.filter((s) => s.status !== 'cancelled')

  const getLoc = (locId: string, joined?: { name: string } | null) =>
    MOCK_MODE ? MOCK_LOC_MAP[locId] : joined

  return (
    <div>
      <div className="htf-title">Mijn Schema</div>
      <div className="htf-sub">Chauffeur · {user.full_name}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <label className="lbl" style={{ marginBottom: 0 }}>Datum:</label>
        <input
          className="inp"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ maxWidth: 200 }}
        />
        <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
          {fmtDate(date)}
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>
      ) : myItems.length === 0 ? (
        <div className="htf-card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚐</div>
          <div style={{ fontSize: 16, fontFamily: "'Playfair Display'", fontWeight: 700, marginBottom: 8 }}>
            Geen ritten gepland
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            Er zijn geen ritten gepland voor {fmtDate(date)}.
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16, fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: 1, color: 'var(--muted)' }}>
            {myItems.length} rit{myItems.length !== 1 ? 'ten' : ''} vandaag
          </div>
          {myItems.map((s, idx) => {
            const from = getLoc(s.from_location_id, s.from_location)
            const to   = getLoc(s.to_location_id, s.to_location)
            const done = s.status === 'completed'
            return (
              <div key={s.id} className="sched-item" style={{
                borderLeftColor: done ? 'var(--green)' : 'var(--gold)',
                opacity: done ? 0.7 : 1,
              }}>
                <div style={{ minWidth: 30, fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 18, color: 'var(--muted)', paddingTop: 2 }}>
                  {idx + 1}.
                </div>
                <div className="sched-time">{s.time_from}<br />{s.time_to}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 2 }}>
                    {from?.name} → {to?.name}
                  </div>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>
                    <strong>{s.vehicle_id}</strong>
                    {s.vehicle_id === s.from_location_id ? ' — Ophalen' : ' — Afleveren'}
                  </div>
                  {s.notes && (
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>
                      📝 {s.notes}
                    </div>
                  )}
                </div>
                <div>
                  {done ? (
                    <span className="badge badge-green">✓ Voltooid</span>
                  ) : (
                    <button className="btn btn-green btn-sm" onClick={() => complete(s.id)}>
                      ✓ Voltooid
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </>
      )}

      <div className="policy-banner" style={{ borderRadius: 4, marginTop: 24 }}>
        📵 Communicatie verloopt uitsluitend via Hi Tom Fleet. Geen telefonisch contact.
      </div>
    </div>
  )
}

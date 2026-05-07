import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { FaultBadge } from '@/components/StatusBadge'
import { fmtDateTime, vehicleTypeIcon } from '@/lib/utils'
import { MOCK_LOC_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useFaults } from '@/hooks/useFaults'
import { useVehicles } from '@/hooks/useVehicles'
import { useSchedules } from '@/hooks/useSchedules'
import { useRanking } from '@/hooks/useRanking'

export default function ManagerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'dashboard' | 'faults' | 'ranking'>('dashboard')

  const { faults: myFaults, loading: fLoading } = useFaults({ locationId: user?.location_id })
  const { vehicles: myVehicles, loading: vLoading } = useVehicles({ locationId: user?.location_id })
  const { schedules: hubVisits } = useSchedules({ fromLocationId: user?.location_id, status: ['completed'] })
  const { byFaults, byQuality } = useRanking()

  if (!user) return null
  if (fLoading || vLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>

  const loc    = MOCK_MODE ? MOCK_LOC_MAP[user.location_id] : user.location
  const active = myFaults.filter((f) => f.status !== 'closed')

  const myRankIdx = byFaults.findIndex((r) => r.location_id === user.location_id)
  const myRank    = myRankIdx >= 0 ? myRankIdx + 1 : null

  const bikes    = myVehicles.filter((v) => v.type === 'ebike').length
  const scooters = myVehicles.filter((v) => v.type === 'scooter').length

  const getVehicleIcon = (vehicleId: string) => {
    const v = MOCK_MODE
      ? myVehicles.find((x) => x.id === vehicleId)
      : myFaults.find((f) => f.vehicle_id === vehicleId)?.vehicle
    return vehicleTypeIcon[v?.type ?? '']
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="htf-title">{loc?.name}</div>
          <div className="htf-sub">Manager · {user.full_name} · Welkom terug</div>
        </div>
        <button className="btn btn-red" onClick={() => navigate('/report')}>
          ⚠ Storing melden
        </button>
      </div>

      <div className="tabs">
        {(['dashboard', 'faults', 'ranking'] as const).map((t) => (
          <button key={t} className={`tab ${tab === t ? 'tab-on' : ''}`} onClick={() => setTab(t)}>
            {t === 'dashboard' ? 'Dashboard' : t === 'faults' ? `Storingen${active.length > 0 ? ` (${active.length})` : ''}` : 'Ranking'}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <>
          <div className="htf-stats">
            <div className="htf-stat"><div className="htf-stat-n">{bikes}</div><div className="htf-stat-l">🔴 E-Bikes</div></div>
            <div className="htf-stat" style={{ borderTopColor: 'var(--green)' }}><div className="htf-stat-n" style={{ color: 'var(--green)' }}>{scooters}</div><div className="htf-stat-l">🔵 Scooters</div></div>
            <div className="htf-stat" style={{ borderTopColor: active.length > 0 ? 'var(--red)' : 'var(--green)' }}>
              <div className="htf-stat-n" style={{ color: active.length > 0 ? 'var(--red)' : 'var(--green)' }}>{active.length}</div>
              <div className="htf-stat-l">Actieve storingen</div>
            </div>
            <div className="htf-stat" style={{ borderTopColor: 'var(--gold)' }}>
              <div className="htf-stat-n" style={{ color: 'var(--gold)' }}>{myRank ? `#${myRank}` : '—'}</div>
              <div className="htf-stat-l">Ranking</div>
            </div>
          </div>

          {(() => {
            const last = hubVisits[0]
            const lastFromName = last
              ? (MOCK_MODE ? MOCK_LOC_MAP[last.to_location_id]?.name : last.to_location?.name) ?? 'Hub'
              : null
            return (
              <div className="htf-card" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="lbl">Laatste Hub bezoek</div>
                  {last ? (
                    <>
                      <div style={{ fontFamily: "'Playfair Display'", fontSize: 18, fontWeight: 700 }}>
                        {last.scheduled_date}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {last.vehicle_id} → {lastFromName}
                        {last.notes ? ` · ${last.notes}` : ''}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 14, color: 'var(--muted)' }}>Geen Hub bezoeken gevonden</div>
                  )}
                </div>
                <div style={{ fontSize: 36 }}>🚐</div>
              </div>
            )
          })()}

          <div className="htf-sh">
            <h2>Recente storingen</h2>
            <div className="htf-rule" />
            <button className="btn btn-ghost btn-sm" onClick={() => setTab('faults')}>Alle storingen →</button>
          </div>
          <div className="htf-card" style={{ padding: 0 }}>
            {myFaults.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>✓ Geen actieve storingen — goed bezig!</div>
            ) : (
              myFaults.slice(0, 3).map((f) => (
                <Link key={f.id} to={`/faults/${f.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="fault-row">
                    <div className="v-icon">{getVehicleIcon(f.vehicle_id)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{f.vehicle_id}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>{f.fault_type} · {fmtDateTime(f.created_at)}</div>
                    </div>
                    <FaultBadge status={f.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </>
      )}

      {tab === 'faults' && (
        <>
          <div className="htf-sh"><h2>Storingenlog</h2><div className="htf-rule" /></div>
          {myFaults.length === 0 ? (
            <div className="htf-card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
              ✓ Geen storingen voor {loc?.name}
            </div>
          ) : (
            myFaults.map((f) => (
              <Link key={f.id} to={`/faults/${f.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 12 }}>
                <div className="htf-card" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 22 }}>{getVehicleIcon(f.vehicle_id)}</span>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 17 }}>{f.vehicle_id}</div>
                        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, color: 'var(--muted)' }}>{fmtDateTime(f.created_at)}</div>
                      </div>
                    </div>
                    <FaultBadge status={f.status} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, marginBottom: f.notes ? 10 : 0 }}>
                    <div><span className="lbl">Storing type</span>{f.fault_type}</div>
                    <div><span className="lbl">Foto's</span>{f.photo_count} geüpload · ★ {f.quality_score?.toFixed(1)}</div>
                  </div>
                  {f.notes && (
                    <div style={{ background: 'var(--cream)', border: '1px solid var(--bdr)', borderRadius: 3, padding: '6px 10px', fontSize: 13, fontStyle: 'italic', color: 'var(--muted)' }}>
                      "{f.notes}"
                    </div>
                  )}
                </div>
              </Link>
            ))
          )}
        </>
      )}

      {tab === 'ranking' && (
        <>
          <div className="htf-sh"><h2>Locatie Ranking — Storingen</h2><div className="htf-rule" /></div>
          <div className="htf-card" style={{ padding: 0, marginBottom: 24 }}>
            {byFaults.map((r, i) => {
              const isMe = r.location_id === user.location_id
              return (
                <div key={r.location_id} className="rank-row" style={{ background: isMe ? 'var(--cream2)' : 'transparent' }}>
                  <div className="rank-n" style={{ color: i === 0 ? 'var(--gold)' : '#D6B87A' }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: isMe ? 'var(--gold)' : 'var(--ink)' }}>
                      {r.location_name} {isMe && '← jij'}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: 'var(--red)' }}>{r.fault_count} storingen</div>
                </div>
              )
            })}
          </div>

          <div className="htf-sh"><h2>Kwaliteit meldingen ★</h2><div className="htf-rule" /></div>
          <div className="htf-card" style={{ padding: 0 }}>
            {byQuality.map((r, i) => (
              <div key={r.location_id} className="rank-row">
                <div className="rank-n" style={{ color: i === 0 ? 'var(--gold)' : '#D6B87A' }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{r.location_name}</div>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>
                  {r.quality_avg.toFixed(1)} ★
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

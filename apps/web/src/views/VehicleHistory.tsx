import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { FaultBadge, VehicleBadge } from '@/components/StatusBadge'
import { fmtDateTime, vehicleTypeIcon, vehicleTypeLabel } from '@/lib/utils'
import { MOCK_VEHICLES, MOCK_FAULTS, MOCK_LOG, MOCK_LOC_MAP, MOCK_USERS_MAP } from '@/lib/mock'

const EVENT_ICON: Record<string, string> = {
  moved:    '🚐',
  fault:    '⚠',
  repaired: '🔧',
  assigned: '📍',
}

export default function VehicleHistory() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  if (!user || !id) return null

  const vehicle = MOCK_VEHICLES.find((v) => v.id === id)
  if (!vehicle) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>Voertuig niet gevonden.</div>
  )

  const faults = MOCK_FAULTS.filter((f) => f.vehicle_id === id)
  const log    = MOCK_LOG.filter((l) => l.vehicle_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at))
  const loc    = MOCK_LOC_MAP[vehicle.location_id]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>{vehicleTypeIcon[vehicle.type]}</span>
            <div className="htf-title" style={{ marginBottom: 0 }}>{vehicle.id}</div>
            <VehicleBadge status={vehicle.status} />
          </div>
          <div className="htf-sub" style={{ marginBottom: 0 }}>
            {vehicleTypeLabel[vehicle.type]} · Huidige locatie: {loc?.name}
          </div>
        </div>
        <Link to="-1" onClick={(e) => { e.preventDefault(); history.back() }} className="btn btn-ghost btn-sm">
          ← Terug
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Fault history */}
        <div>
          <div className="htf-sh"><h2>Storingshistorie</h2><div className="htf-rule" /></div>
          {faults.length === 0 ? (
            <div className="htf-card" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              Geen storingen geregistreerd.
            </div>
          ) : faults.map((f) => (
            <Link key={f.id} to={`/faults/${f.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 10 }}>
              <div className="htf-card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.fault_type}</div>
                  <FaultBadge status={f.status} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>
                  {fmtDateTime(f.created_at)} · {f.photo_count} foto's · ★ {f.quality_score?.toFixed(1)}
                </div>
                {f.notes && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginTop: 6 }}>"{f.notes}"</div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Event timeline */}
        <div>
          <div className="htf-sh"><h2>Tijdlijn</h2><div className="htf-rule" /></div>
          {log.length === 0 ? (
            <div className="htf-card" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              Geen gebeurtenissen geregistreerd.
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {log.map((entry, idx) => {
                const performer = MOCK_USERS_MAP[entry.performed_by]
                const fromLoc   = entry.from_location_id ? MOCK_LOC_MAP[entry.from_location_id] : null
                const toLoc     = entry.to_location_id ? MOCK_LOC_MAP[entry.to_location_id] : null
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: idx < log.length - 1 ? '1px solid #F5E6CC' : 'none' }}>
                    <div style={{ width: 36, height: 36, background: 'var(--cream2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {EVENT_ICON[entry.event_type]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                        {entry.event_type === 'moved' ? 'Verplaatst'
                          : entry.event_type === 'fault' ? 'Storing gemeld'
                          : entry.event_type === 'repaired' ? 'Reparatie'
                          : 'Toegewezen'}
                      </div>
                      {fromLoc && toLoc && (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fromLoc.name} → {toLoc.name}</div>
                      )}
                      {entry.notes && (
                        <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 2 }}>{entry.notes}</div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5, marginTop: 4 }}>
                        {fmtDateTime(entry.created_at)} · {performer?.full_name ?? entry.performed_by}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

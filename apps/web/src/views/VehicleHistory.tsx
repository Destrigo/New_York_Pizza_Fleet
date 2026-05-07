import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { FaultBadge, VehicleBadge } from '@/components/StatusBadge'
import { fmtDateTime, vehicleTypeIcon, vehicleTypeLabel } from '@/lib/utils'
import { MOCK_LOC_MAP, MOCK_USERS_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useVehicle } from '@/hooks/useVehicles'
import { useFaults } from '@/hooks/useFaults'
import { useVehicleLog } from '@/hooks/useVehicleLog'

const EVENT_ICON: Record<string, string> = {
  moved:    '🚐',
  fault:    '⚠',
  repaired: '🔧',
  assigned: '📍',
}

const EVENT_LABEL: Record<string, string> = {
  moved:    'Verplaatst',
  fault:    'Storing gemeld',
  repaired: 'Reparatie',
  assigned: 'Toegewezen',
}

export default function VehicleHistory() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const { vehicle, loading: vLoading } = useVehicle(id)
  const { faults, loading: fLoading }  = useFaults({ vehicleId: id })
  const { log, loading: lLoading }     = useVehicleLog(id)

  if (!user || !id) return null
  if (vLoading || fLoading || lLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>
  if (!vehicle) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>Voertuig niet gevonden.</div>

  const loc = MOCK_MODE ? MOCK_LOC_MAP[vehicle.location_id] : vehicle.location

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

        <div>
          <div className="htf-sh"><h2>Tijdlijn</h2><div className="htf-rule" /></div>
          {log.length === 0 ? (
            <div className="htf-card" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              Geen gebeurtenissen geregistreerd.
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {log.map((entry, idx) => {
                const performerName = MOCK_MODE
                  ? MOCK_USERS_MAP[entry.performed_by]?.full_name
                  : entry.performer?.full_name
                const fromName = MOCK_MODE
                  ? (entry.from_location_id ? MOCK_LOC_MAP[entry.from_location_id]?.name : null)
                  : entry.from_location?.name
                const toName = MOCK_MODE
                  ? (entry.to_location_id ? MOCK_LOC_MAP[entry.to_location_id]?.name : null)
                  : entry.to_location?.name
                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: idx < log.length - 1 ? '1px solid #F5E6CC' : 'none' }}>
                    <div style={{ width: 36, height: 36, background: 'var(--cream2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {EVENT_ICON[entry.event_type]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                        {EVENT_LABEL[entry.event_type] ?? entry.event_type}
                      </div>
                      {fromName && toName && (
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{fromName} → {toName}</div>
                      )}
                      {entry.notes && (
                        <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 2 }}>{entry.notes}</div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5, marginTop: 4 }}>
                        {fmtDateTime(entry.created_at)} · {performerName ?? entry.performed_by}
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

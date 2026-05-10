import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { FaultBadge, VehicleBadge } from '@/components/StatusBadge'
import { exportCsv, fmtDateTime, vehicleTypeIcon, vehicleTypeLabel } from '@/lib/utils'
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

export default function VehicleHistory() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useI18n()

  const { vehicle, loading: vLoading } = useVehicle(id)
  const { faults, loading: fLoading }  = useFaults({ vehicleId: id })
  const { log, loading: lLoading }     = useVehicleLog(id)

  if (!user || !id) return null
  if (vLoading || fLoading || lLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div>
  if (!vehicle) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>{t('vehicleNotFound')}</div>

  const loc = MOCK_MODE ? MOCK_LOC_MAP[vehicle.location_id] : vehicle.location

  const eventLabel = (eventType: string) => {
    if (eventType === 'moved')    return t('eventMoved')
    if (eventType === 'fault')    return t('eventFault')
    if (eventType === 'repaired') return t('eventRepaired')
    if (eventType === 'assigned') return t('eventAssigned')
    return eventType
  }

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
            {vehicleTypeLabel[vehicle.type]} · {t('currentLocation')} {loc?.name}
          </div>
        </div>
        <Link to="-1" onClick={(e) => { e.preventDefault(); history.back() }} className="btn btn-ghost btn-sm">
          {t('back')}
        </Link>
      </div>

      <div className="grid-2">
        <div>
          <div className="htf-sh">
            <h2>{t('faultHistory')}</h2>
            <div className="htf-rule" />
            {faults.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => exportCsv(
                  faults.map((f) => ({
                    vehicle: f.vehicle_id,
                    type: f.fault_type,
                    status: f.status,
                    photos: f.photo_count,
                    quality: f.quality_score ?? '',
                    date: fmtDateTime(f.created_at),
                    notes: f.notes ?? '',
                  })),
                  `${id}-faults.csv`
                )}
              >
                {t('csv')}
              </button>
            )}
          </div>
          {faults.length === 0 ? (
            <div className="htf-card" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              {t('noFaultsReg')}
            </div>
          ) : faults.map((f) => (
            <Link key={f.id} to={`/faults/${f.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', marginBottom: 10 }}>
              <div className="htf-card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{f.fault_type}</div>
                  <FaultBadge status={f.status} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>
                  {fmtDateTime(f.created_at)} · {f.photo_count} {t('photoCountSuffix')} · ★ {f.quality_score?.toFixed(1)}
                </div>
                {f.notes && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginTop: 6 }}>"{f.notes}"</div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div>
          <div className="htf-sh"><h2>{t('timeline')}</h2><div className="htf-rule" /></div>
          {log.length === 0 ? (
            <div className="htf-card" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
              {t('noEventsReg')}
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
                        {eventLabel(entry.event_type)}
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

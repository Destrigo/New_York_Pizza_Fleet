import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useToast } from '@/components/Toast'
import { vehicleTypeLabel } from '@/lib/utils'
import { useLocations } from '@/hooks/useLocations'
import { useVehicles } from '@/hooks/useVehicles'
import { useReserves } from '@/hooks/useReserves'
import type { VehicleType } from '@/types'

const VEHICLE_TYPES: VehicleType[] = ['ebike', 'scooter', 'car', 'bus']

export default function AdminReserves() {
  const { user } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const { locations: locs, loading: locsLoading } = useLocations({ excludeHub: true })
  const { vehicles } = useVehicles()
  const { reserves, loading: resLoading, upsert } = useReserves()

  const getTarget = (locId: string, type: VehicleType) =>
    reserves.find((r) => r.location_id === locId && r.vehicle_type === type)?.target_count ?? 0

  const getActual = (locId: string, type: VehicleType) =>
    vehicles.filter((v) => v.location_id === locId && v.type === type && v.status === 'ok').length

  const handleChange = (locId: string, type: VehicleType, val: number) => {
    if (!user) return
    upsert(locId, type, val, user.id)
  }

  const saveAll = () => {
    toast(t('toastReservesSaved'))
  }

  if (locsLoading || resLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">{t('reserveTargets')}</div>
          <div className="htf-sub">{t('reserveSub')}</div>
        </div>
        <button className="btn btn-green" onClick={saveAll}>{t('save')}</button>
      </div>

      <div className="htf-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('colLocation')}</th>
              {VEHICLE_TYPES.map((vtype) => <th key={vtype}>{vehicleTypeLabel[vtype]}</th>)}
            </tr>
          </thead>
          <tbody>
            {locs.map((loc) => (
              <tr key={loc.id}>
                <td style={{ fontWeight: 600 }}>{loc.name}</td>
                {VEHICLE_TYPES.map((type) => {
                  const target = getTarget(loc.id, type)
                  const actual = getActual(loc.id, type)
                  const below  = actual < target
                  return (
                    <td key={type}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={target}
                          onChange={(e) => handleChange(loc.id, type, parseInt(e.target.value) || 0)}
                          style={{ width: 60, padding: '4px 8px', border: '1.5px solid var(--bdr)', borderRadius: 3, fontFamily: "'Barlow'", fontSize: 14, background: 'var(--cream)' }}
                        />
                        <span style={{ fontSize: 12, color: below ? 'var(--red)' : 'var(--green)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>
                          ({actual} {t('actualSuffix')}{below ? ' ⚠' : ' ✓'})
                        </span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { vehicleTypeLabel } from '@/lib/utils'
import { MOCK_LOCATIONS, MOCK_VEHICLES } from '@/lib/mock'
import type { VehicleType } from '@/types'

const VEHICLE_TYPES: VehicleType[] = ['ebike', 'scooter', 'car', 'bus']

interface ReserveTarget {
  location_id: string
  vehicle_type: VehicleType
  target: number
}

export default function AdminReserves() {
  const toast = useToast()

  const locs = MOCK_LOCATIONS.filter((l) => !l.is_hub)

  const [targets, setTargets] = useState<ReserveTarget[]>(() =>
    locs.flatMap((l) =>
      VEHICLE_TYPES.map((t) => ({
        location_id: l.id,
        vehicle_type: t,
        target: t === 'ebike' ? 5 : t === 'scooter' ? 2 : 0,
      }))
    )
  )

  const getTarget = (locId: string, type: VehicleType) =>
    targets.find((t) => t.location_id === locId && t.vehicle_type === type)?.target ?? 0

  const setTarget = (locId: string, type: VehicleType, val: number) => {
    setTargets((prev) =>
      prev.map((t) =>
        t.location_id === locId && t.vehicle_type === type ? { ...t, target: val } : t
      )
    )
  }

  const getActual = (locId: string, type: VehicleType) =>
    MOCK_VEHICLES.filter((v) => v.location_id === locId && v.type === type && v.status === 'ok').length

  const saveAll = () => {
    toast('Reserve targets opgeslagen.')
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">Reserve targets</div>
          <div className="htf-sub">Minimum voertuigen per locatie · Supervisor only</div>
        </div>
        <button className="btn btn-green" onClick={saveAll}>Opslaan</button>
      </div>

      <div className="htf-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Locatie</th>
              {VEHICLE_TYPES.map((t) => <th key={t}>{vehicleTypeLabel[t]}</th>)}
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
                          onChange={(e) => setTarget(loc.id, type, parseInt(e.target.value) || 0)}
                          style={{ width: 60, padding: '4px 8px', border: '1.5px solid var(--bdr)', borderRadius: 3, fontFamily: "'Barlow'", fontSize: 14, background: 'var(--cream)' }}
                        />
                        <span style={{ fontSize: 12, color: below ? 'var(--red)' : 'var(--green)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>
                          ({actual} huidig{below ? ' ⚠' : ' ✓'})
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

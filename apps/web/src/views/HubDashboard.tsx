import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { FaultBadge, VehicleBadge } from '@/components/StatusBadge'
import { fmtDateTime, vehicleTypeIcon } from '@/lib/utils'
import { MOCK_VEHICLES, MOCK_LOC_MAP, MOCK_USERS_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useFaults } from '@/hooks/useFaults'
import { useVehicles } from '@/hooks/useVehicles'
import { useSchedules } from '@/hooks/useSchedules'
import type { Fault, PickupSchedule } from '@/types'

export default function HubDashboard() {
  const { user } = useAuth()
  const { faults: activeFaults, loading: fLoading } = useFaults({ status: ['open', 'in_progress', 'ready'] })
  const { vehicles: hubVehicles, loading: vLoading } = useVehicles({ hubOnly: true })
  const { schedules, loading: sLoading } = useSchedules({})

  if (!user) return null
  if (fLoading || vLoading || sLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>

  const open       = activeFaults.filter((f) => f.status === 'open').length
  const inProgress = activeFaults.filter((f) => f.status === 'in_progress').length
  const ready      = activeFaults.filter((f) => f.status === 'ready').length

  const todayStr      = new Date().toISOString().split('T')[0]
  const todaySchedule = schedules
    .filter((s) => s.scheduled_date === todayStr && s.status === 'planned')
    .slice(0, 4)

  const getVehicleIcon = (f: Fault) =>
    vehicleTypeIcon[MOCK_MODE ? (MOCK_VEHICLES.find((v) => v.id === f.vehicle_id)?.type ?? '') : (f.vehicle?.type ?? '')]

  const getFaultLoc = (f: Fault) =>
    MOCK_MODE ? MOCK_LOC_MAP[f.location_id] : f.location

  const getScheduleInfo = (s: PickupSchedule) => ({
    driverName: MOCK_MODE ? MOCK_USERS_MAP[s.driver_id]?.full_name : s.driver?.full_name,
    fromName:   MOCK_MODE ? MOCK_LOC_MAP[s.from_location_id]?.name : s.from_location?.name,
    toName:     MOCK_MODE ? MOCK_LOC_MAP[s.to_location_id]?.name : s.to_location?.name,
  })

  return (
    <div>
      <div className="htf-title">Hub Dashboard</div>
      <div className="htf-sub">Hi Tom Fleet · Hub Operaties</div>

      <div className="htf-stats">
        <div className="htf-stat"><div className="htf-stat-n" style={{ color: 'var(--red)' }}>{open}</div><div className="htf-stat-l">Nieuwe storingen</div></div>
        <div className="htf-stat" style={{ borderTopColor: 'var(--gold)' }}><div className="htf-stat-n" style={{ color: 'var(--gold)' }}>{inProgress}</div><div className="htf-stat-l">In reparatie</div></div>
        <div className="htf-stat" style={{ borderTopColor: 'var(--green)' }}><div className="htf-stat-n" style={{ color: 'var(--green)' }}>{ready}</div><div className="htf-stat-l">Klaar voor ophaling</div></div>
        <div className="htf-stat" style={{ borderTopColor: 'var(--black)' }}><div className="htf-stat-n" style={{ color: 'var(--black)' }}>{hubVehicles.length}</div><div className="htf-stat-l">In Hub</div></div>
      </div>

      <div className="grid-2">
        <div>
          <div className="htf-sh">
            <h2>Actieve storingen</h2>
            <div className="htf-rule" />
            <Link to="/hub/queue" className="btn btn-ghost btn-sm">Queue →</Link>
          </div>
          <div className="htf-card" style={{ padding: 0 }}>
            {activeFaults.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Geen actieve storingen</div>
            ) : activeFaults.slice(0, 5).map((f) => (
              <Link key={f.id} to={`/faults/${f.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fault-row">
                  <div className="v-icon">{getVehicleIcon(f)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{f.vehicle_id} · {getFaultLoc(f)?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>{f.fault_type} · {fmtDateTime(f.created_at)}</div>
                  </div>
                  <FaultBadge status={f.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <div className="htf-sh">
            <h2>Ritten vandaag</h2>
            <div className="htf-rule" />
            <Link to="/hub/schedule" className="btn btn-ghost btn-sm">Planning →</Link>
          </div>
          <div className="htf-card" style={{ padding: 0, marginBottom: 20 }}>
            {todaySchedule.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Geen ritten gepland</div>
            ) : todaySchedule.map((s) => {
              const { driverName, fromName, toName } = getScheduleInfo(s)
              return (
                <div key={s.id} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #F5E6CC', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, fontFamily: "'Barlow Condensed'", letterSpacing: 1, color: 'var(--green)', minWidth: 80 }}>
                    {s.time_from}–{s.time_to}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.vehicle_id} · {driverName}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>
                      {fromName} → {toName}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="htf-sh">
            <h2>Hub inventaris</h2>
            <div className="htf-rule" />
            <Link to="/hub/vehicles" className="btn btn-ghost btn-sm">Beheer →</Link>
          </div>
          <div className="htf-card" style={{ padding: 0 }}>
            {hubVehicles.slice(0, 5).map((v) => (
              <div key={v.id} style={{ display: 'flex', gap: 10, padding: '8px 14px', borderBottom: '1px solid #F5E6CC', alignItems: 'center' }}>
                <span>{vehicleTypeIcon[v.type]}</span>
                <Link to={`/vehicles/${v.id}`} style={{ fontWeight: 600, flex: 1, textDecoration: 'none', color: 'var(--red)' }}>{v.id}</Link>
                <VehicleBadge status={v.status} />
              </div>
            ))}
            {hubVehicles.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Geen voertuigen in Hub</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

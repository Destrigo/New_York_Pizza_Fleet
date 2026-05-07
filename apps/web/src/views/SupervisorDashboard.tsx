import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { FaultBadge, VehicleBadge } from '@/components/StatusBadge'
import { fmtDateTime, vehicleTypeIcon, vehicleTypeLabel, exportCsv } from '@/lib/utils'
import { MOCK_LOCATIONS, MOCK_LOC_MAP, MOCK_RANKING } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useFaults } from '@/hooks/useFaults'
import { useVehicles } from '@/hooks/useVehicles'
import type { Fault, FaultStatus, Vehicle, VehicleType } from '@/types'

type RankPeriod = 'month' | 'prev' | 'ytd'

const STATUS_ORDER: FaultStatus[] = ['open', 'in_progress', 'ready', 'closed']

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const [tab, setTab]           = useState<'overview' | 'faults' | 'ranking' | 'locations'>('overview')
  const [rankPeriod, setRankPeriod] = useState<RankPeriod>('month')
  const [drillLoc, setDrillLoc] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FaultStatus | 'all'>('all')

  const { faults: allFaults, loading: fLoading } = useFaults()
  const { vehicles: allVehicles, loading: vLoading } = useVehicles()

  if (!user) return null
  if (fLoading || vLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>

  const activeFaults = allFaults.filter((f) => f.status !== 'closed')
  const hubVehicles  = allVehicles.filter((v) => v.location_id === 'hub-hfd' || v.location_id === 'hub-ens')

  const totalByType = (['ebike', 'scooter', 'car', 'bus'] as VehicleType[]).map((t) => ({
    type: t,
    total: allVehicles.filter((v) => v.type === t).length,
    ok:    allVehicles.filter((v) => v.type === t && v.status === 'ok').length,
    fault: allVehicles.filter((v) => v.type === t && (v.status === 'fault' || v.status === 'fix')).length,
  }))

  const filteredFaults = filterStatus === 'all'
    ? allFaults
    : allFaults.filter((f) => f.status === filterStatus)

  const drillFaults   = drillLoc ? allFaults.filter((f) => f.location_id === drillLoc) : []
  const drillVehicles = drillLoc ? allVehicles.filter((v) => v.location_id === drillLoc) : []

  const getFaultLoc = (f: Fault) => MOCK_MODE ? MOCK_LOC_MAP[f.location_id] : f.location
  const getFaultVehicleIcon = (f: Fault) => {
    const type = MOCK_MODE
      ? allVehicles.find((v) => v.id === f.vehicle_id)?.type
      : f.vehicle?.type
    return vehicleTypeIcon[type ?? '']
  }

  return (
    <div>
      <div className="htf-title">Supervisor Dashboard</div>
      <div className="htf-sub">{user.full_name} · Overzicht alle locaties</div>

      <div className="tabs">
        {(['overview', 'faults', 'ranking', 'locations'] as const).map((t) => (
          <button key={t} className={`tab ${tab === t ? 'tab-on' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Overzicht' : t === 'faults' ? 'Storingen' : t === 'ranking' ? 'Ranking' : 'Locaties'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          <div className="htf-sh"><h2>Vloot overzicht</h2><div className="htf-rule" /></div>
          <div className="htf-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
            {totalByType.map((t) => (
              <div key={t.type} className="htf-stat">
                <div style={{ fontSize: 24, marginBottom: 4 }}>{vehicleTypeIcon[t.type]}</div>
                <div className="htf-stat-n">{t.total}</div>
                <div className="htf-stat-l">{vehicleTypeLabel[t.type]}s</div>
                <div style={{ fontSize: 11, fontFamily: "'Barlow Condensed'", letterSpacing: 1, marginTop: 6 }}>
                  <span style={{ color: 'var(--green)' }}>{t.ok} ok</span>
                  {t.fault > 0 && <span style={{ color: 'var(--red)', marginLeft: 6 }}>{t.fault} storing</span>}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="htf-card">
              <div className="htf-sh"><h2>Actieve storingen</h2><div className="htf-rule" /></div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                {STATUS_ORDER.filter((s) => s !== 'closed').map((s) => {
                  const cnt = activeFaults.filter((f) => f.status === s).length
                  return (
                    <div key={s} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Playfair Display'", fontSize: 28, fontWeight: 900, color: s === 'open' ? 'var(--red)' : s === 'in_progress' ? 'var(--gold)' : 'var(--green)' }}>{cnt}</div>
                      <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed'", letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>
                        {s === 'open' ? 'Storing' : s === 'in_progress' ? 'Bezig' : 'Klaar'}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('faults')}>Alle storingen →</button>
            </div>

            <div className="htf-card htf-card-green">
              <div className="htf-sh"><h2>Hub inventaris</h2><div className="htf-rule" /></div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
                {hubVehicles.length} voertuigen in Hub
              </div>
              {hubVehicles.slice(0, 6).map((v: Vehicle) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #F5E6CC' }}>
                  <span>{vehicleTypeIcon[v.type]}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{v.id}</span>
                  <VehicleBadge status={v.status} />
                </div>
              ))}
              {hubVehicles.length > 6 && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>+ {hubVehicles.length - 6} meer</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── FAULTS ── */}
      {tab === 'faults' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            {(['all', 'open', 'in_progress', 'ready', 'closed'] as const).map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filterStatus === s ? 'btn-red' : 'btn-muted'}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === 'all' ? 'Alle' : s === 'open' ? 'Storing' : s === 'in_progress' ? 'Start Fix' : s === 'ready' ? 'Klaar' : 'Gesloten'}
              </button>
            ))}
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => exportCsv(
                filteredFaults.map((f) => ({
                  id: f.id,
                  voertuig: f.vehicle_id,
                  locatie: getFaultLoc(f)?.name ?? f.location_id,
                  type: f.fault_type,
                  status: f.status,
                  fotos: f.photo_count,
                  kwaliteit: f.quality_score ?? '',
                  datum: fmtDateTime(f.created_at),
                  notities: f.notes ?? '',
                })),
                `storingen-${new Date().toISOString().split('T')[0]}.csv`
              )}
            >
              ↓ CSV exporteren
            </button>
          </div>
          <div className="htf-card" style={{ padding: 0 }}>
            {filteredFaults.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>Geen storingen gevonden.</div>
            ) : filteredFaults.map((f) => (
              <Link key={f.id} to={`/faults/${f.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="fault-row">
                  <div className="v-icon">{getFaultVehicleIcon(f)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{f.vehicle_id} · {getFaultLoc(f)?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>
                      {f.fault_type} · {fmtDateTime(f.created_at)}
                    </div>
                  </div>
                  <FaultBadge status={f.status} />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── RANKING ── */}
      {tab === 'ranking' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['month', 'prev', 'ytd'] as const).map((p) => (
              <button key={p} className={`btn btn-sm ${rankPeriod === p ? 'btn-red' : 'btn-muted'}`} onClick={() => setRankPeriod(p)}>
                {p === 'month' ? 'Deze maand' : p === 'prev' ? 'Vorige maand' : 'Jaar tot nu'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div className="htf-sh"><h2>Ranking storingen</h2><div className="htf-rule" /></div>
              <div className="htf-card" style={{ padding: 0 }}>
                {MOCK_RANKING.map((r, i) => {
                  const rLoc = MOCK_LOC_MAP[r.location_id]
                  return (
                    <div key={r.location_id} className="rank-row" style={{ cursor: 'pointer' }} onClick={() => { setDrillLoc(r.location_id); setTab('locations') }}>
                      <div className="rank-n" style={{ color: i === 0 ? 'var(--gold)' : '#D6B87A' }}>{i + 1}</div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{rLoc?.name}</div></div>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 17, fontWeight: 700, color: 'var(--red)' }}>{r.fault_count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="htf-sh"><h2>Kwaliteit meldingen ★</h2><div className="htf-rule" /></div>
              <div className="htf-card" style={{ padding: 0 }}>
                {[...MOCK_RANKING].sort((a, b) => b.quality_avg - a.quality_avg).map((r, i) => {
                  const rLoc = MOCK_LOC_MAP[r.location_id]
                  return (
                    <div key={r.location_id} className="rank-row">
                      <div className="rank-n" style={{ color: i === 0 ? 'var(--gold)' : '#D6B87A' }}>{i + 1}</div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{rLoc?.name}</div></div>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{r.quality_avg.toFixed(1)} ★</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── LOCATIONS ── */}
      {tab === 'locations' && (
        <>
          {drillLoc ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setDrillLoc(null)}>← Alle locaties</button>
                <div style={{ fontFamily: "'Playfair Display'", fontSize: 22, fontWeight: 700 }}>
                  {MOCK_LOC_MAP[drillLoc]?.name}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  <div className="htf-sh"><h2>Voertuigen</h2><div className="htf-rule" /></div>
                  <div className="htf-card" style={{ padding: 0 }}>
                    {drillVehicles.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Geen voertuigen</div>
                    ) : drillVehicles.map((v) => (
                      <div key={v.id} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #F5E6CC', alignItems: 'center' }}>
                        <span style={{ fontSize: 18 }}>{vehicleTypeIcon[v.type]}</span>
                        <Link to={`/vehicles/${v.id}`} style={{ fontWeight: 600, flex: 1, textDecoration: 'none', color: 'var(--red)' }}>{v.id}</Link>
                        <VehicleBadge status={v.status} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="htf-sh"><h2>Storingen</h2><div className="htf-rule" /></div>
                  <div className="htf-card" style={{ padding: 0 }}>
                    {drillFaults.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>Geen storingen</div>
                    ) : drillFaults.map((f) => (
                      <Link key={f.id} to={`/faults/${f.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div className="fault-row">
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{f.vehicle_id}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>{f.fault_type}</div>
                          </div>
                          <FaultBadge status={f.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="htf-sh"><h2>Alle locaties</h2><div className="htf-rule" /></div>
              <div className="htf-card" style={{ padding: 0 }}>
                {MOCK_LOCATIONS.filter((l) => !l.is_hub).map((loc) => {
                  const faultCnt = allFaults.filter((f) => f.location_id === loc.id && f.status !== 'closed').length
                  const vCnt     = allVehicles.filter((v) => v.location_id === loc.id).length
                  return (
                    <div key={loc.id} className="fault-row" style={{ cursor: 'pointer' }} onClick={() => setDrillLoc(loc.id)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{loc.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>{loc.city} · {vCnt} voertuigen</div>
                      </div>
                      {faultCnt > 0 && <span className="badge badge-red">{faultCnt} storing{faultCnt !== 1 ? 'en' : ''}</span>}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

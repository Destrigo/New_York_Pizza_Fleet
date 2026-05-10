import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { FaultBadge, VehicleBadge } from '@/components/StatusBadge'
import { fmtDate, fmtDateTime, vehicleTypeIcon, vehicleTypeLabel, exportCsv } from '@/lib/utils'
import { MOCK_LOC_MAP, MOCK_USERS_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useFaults } from '@/hooks/useFaults'
import { useVehicles } from '@/hooks/useVehicles'
import { useLocations } from '@/hooks/useLocations'
import { useReserves } from '@/hooks/useReserves'
import { useSchedules } from '@/hooks/useSchedules'
import type { RankEntry } from '@/hooks/useRanking'
import type { Fault, FaultStatus, PickupSchedule, Vehicle, VehicleType } from '@/types'

type RankPeriod = 'month' | 'prev' | 'ytd'

const STATUS_ORDER: FaultStatus[] = ['open', 'in_progress', 'ready', 'closed']

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const { t } = useI18n()
  const [tab, setTab]           = useState<'overview' | 'faults' | 'ranking' | 'locations' | 'planning'>('overview')
  const [rankPeriod, setRankPeriod] = useState<RankPeriod>('month')
  const [drillLoc, setDrillLoc] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FaultStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [visibleFaults, setVisibleFaults] = useState(20)

  const { faults: allFaults, loading: fLoading } = useFaults()
  const { vehicles: allVehicles, loading: vLoading } = useVehicles()
  const { locations: nonHubLocations } = useLocations({ excludeHub: true })
  const { reserves } = useReserves()
  const { schedules: allSchedules } = useSchedules({})

  if (!user) return null
  if (fLoading || vLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div>

  const activeFaults = allFaults.filter((f) => f.status !== 'closed')
  const hubVehicles  = allVehicles.filter((v) => MOCK_MODE ? (v.location_id === 'hub-hfd' || v.location_id === 'hub-ens') : v.location?.is_hub)

  const shortages = nonHubLocations.flatMap((loc) =>
    (['ebike', 'scooter', 'car', 'bus'] as VehicleType[]).flatMap((vtype) => {
      const target = reserves.find((r) => r.location_id === loc.id && r.vehicle_type === vtype)?.target_count ?? 0
      if (target === 0) return []
      const actual = allVehicles.filter((v) => v.location_id === loc.id && v.type === vtype && v.status === 'ok').length
      if (actual >= target) return []
      return [{ locId: loc.id, locName: loc.name, type: vtype, actual, target, deficit: target - actual }]
    })
  ).sort((a, b) => b.deficit - a.deficit)

  const now = new Date()
  const getPeriodRange = (p: RankPeriod): [string, string] => {
    const y = now.getFullYear(), m = now.getMonth()
    if (p === 'month') return [`${y}-${String(m + 1).padStart(2, '0')}-01`, now.toISOString().split('T')[0]]
    if (p === 'prev') {
      const pm = m === 0 ? 12 : m, py = m === 0 ? y - 1 : y
      const lastDay = new Date(y, m, 0).getDate()
      return [`${py}-${String(pm).padStart(2, '0')}-01`, `${py}-${String(pm).padStart(2, '0')}-${lastDay}`]
    }
    return [`${y}-01-01`, now.toISOString().split('T')[0]]
  }
  const [rangeFrom, rangeTo] = getPeriodRange(rankPeriod)
  const periodFaults = allFaults.filter((f) =>
    f.created_at >= rangeFrom && f.created_at.substring(0, 10) <= rangeTo
  )

  const rankGroups: Record<string, { name: string; count: number; scores: number[] }> = {}
  for (const f of periodFaults) {
    const locId = f.location_id
    const name  = MOCK_MODE ? (MOCK_LOC_MAP[locId]?.name ?? locId) : (f.location?.name ?? locId)
    if (!rankGroups[locId]) rankGroups[locId] = { name, count: 0, scores: [] }
    rankGroups[locId].count++
    if (f.quality_score != null) rankGroups[locId].scores.push(f.quality_score)
  }
  const rankEntries: RankEntry[] = Object.entries(rankGroups).map(([locId, g]) => ({
    location_id:   locId,
    location_name: g.name,
    fault_count:   g.count,
    quality_avg:   g.scores.length > 0 ? g.scores.reduce((a, b) => a + b, 0) / g.scores.length : 0,
  }))
  const rankByFaults  = [...rankEntries].sort((a, b) => b.fault_count - a.fault_count)
  const rankByQuality = [...rankEntries].sort((a, b) => b.quality_avg - a.quality_avg)

  const getDrillLocName = (locId: string) =>
    MOCK_MODE ? (MOCK_LOC_MAP[locId]?.name ?? locId) : (nonHubLocations.find((l) => l.id === locId)?.name ?? locId)

  const totalByType = (['ebike', 'scooter', 'car', 'bus'] as VehicleType[]).map((vtype) => ({
    type:  vtype,
    total: allVehicles.filter((v) => v.type === vtype).length,
    ok:    allVehicles.filter((v) => v.type === vtype && v.status === 'ok').length,
    fault: allVehicles.filter((v) => v.type === vtype && (v.status === 'fault' || v.status === 'fix')).length,
  }))

  const filteredFaults = allFaults.filter((f) => {
    if (filterStatus !== 'all' && f.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const locName = MOCK_MODE ? (MOCK_LOC_MAP[f.location_id]?.name ?? '') : (f.location?.name ?? '')
      if (!f.vehicle_id.toLowerCase().includes(q) &&
          !f.fault_type.toLowerCase().includes(q) &&
          !locName.toLowerCase().includes(q)) return false
    }
    return true
  })

  const drillFaults   = drillLoc ? allFaults.filter((f) => f.location_id === drillLoc) : []
  const drillVehicles = drillLoc ? allVehicles.filter((v) => v.location_id === drillLoc) : []

  const closedWithTime = allFaults.filter((f) => f.status === 'closed' && f.closed_at)
  const avgResolutionHours = closedWithTime.length > 0
    ? closedWithTime.reduce((sum, f) => sum + (new Date(f.closed_at!).getTime() - new Date(f.created_at).getTime()) / 3_600_000, 0) / closedWithTime.length
    : null

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
      <div className="htf-sub">{user.full_name} · {t('supSub')}</div>

      <div className="tabs">
        {(['overview', 'faults', 'ranking', 'locations', 'planning'] as const).map((tabKey) => (
          <button key={tabKey} className={`tab ${tab === tabKey ? 'tab-on' : ''}`} onClick={() => setTab(tabKey)}>
            {tabKey === 'overview' ? t('tabOverview') : tabKey === 'faults' ? t('tabFaults') : tabKey === 'ranking' ? t('tabRanking') : tabKey === 'locations' ? t('tabLocations') : t('tabPlanning')}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          <div className="htf-sh"><h2>{t('fleetOverview')}</h2><div className="htf-rule" /></div>
          <div className="htf-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
            {totalByType.map((stat) => (
              <div key={stat.type} className="htf-stat">
                <div style={{ fontSize: 24, marginBottom: 4 }}>{vehicleTypeIcon[stat.type]}</div>
                <div className="htf-stat-n">{stat.total}</div>
                <div className="htf-stat-l">{vehicleTypeLabel[stat.type]}s</div>
                <div style={{ fontSize: 11, fontFamily: "'Barlow Condensed'", letterSpacing: 1, marginTop: 6 }}>
                  <span style={{ color: 'var(--green)' }}>{stat.ok} ok</span>
                  {stat.fault > 0 && <span style={{ color: 'var(--red)', marginLeft: 6 }}>{stat.fault} {stat.fault !== 1 ? t('faults') : t('faultSingular')}</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            <div className="htf-card">
              <div className="htf-sh"><h2>{t('activeFaultsSup')}</h2><div className="htf-rule" /></div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                {STATUS_ORDER.filter((s) => s !== 'closed').map((s) => {
                  const cnt = activeFaults.filter((f) => f.status === s).length
                  return (
                    <div key={s} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Playfair Display'", fontSize: 28, fontWeight: 900, color: s === 'open' ? 'var(--red)' : s === 'in_progress' ? 'var(--gold)' : 'var(--green)' }}>{cnt}</div>
                      <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed'", letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>
                        {t(`badgeFault_${s}` as Parameters<typeof t>[0])}
                      </div>
                    </div>
                  )
                })}
                {avgResolutionHours !== null && (
                  <div style={{ textAlign: 'center', marginLeft: 'auto' }}>
                    <div style={{ fontFamily: "'Playfair Display'", fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>
                      {avgResolutionHours < 24 ? `${avgResolutionHours.toFixed(0)}u` : `${(avgResolutionHours / 24).toFixed(1)}d`}
                    </div>
                    <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed'", letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>
                      {t('avgDuration')}
                    </div>
                  </div>
                )}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('faults')}>{t('allFaultsBtn')}</button>
            </div>

            <div className="htf-card htf-card-green">
              <div className="htf-sh"><h2>{t('hubInventory')}</h2><div className="htf-rule" /></div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>
                {hubVehicles.length} {t('vehiclesInHub')}
              </div>
              {hubVehicles.slice(0, 6).map((v: Vehicle) => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #F5E6CC' }}>
                  <span>{vehicleTypeIcon[v.type]}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{v.id}</span>
                  <VehicleBadge status={v.status} />
                </div>
              ))}
              {hubVehicles.length > 6 && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>+ {hubVehicles.length - 6} {t('moreVehicles')}</div>
              )}
            </div>
          </div>

          {shortages.length > 0 && (
            <>
              <div className="htf-sh" style={{ marginTop: 24 }}>
                <h2>{t('reserveShortage')}</h2>
                <div className="htf-rule" />
                <Link to="/admin/reserves" className="btn btn-ghost btn-sm">{t('manageReserves')}</Link>
              </div>
              <div className="htf-card" style={{ padding: 0, borderTop: '3px solid var(--red)' }}>
                {shortages.map((s, i) => (
                  <div
                    key={i}
                    className="fault-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => { setDrillLoc(s.locId); setTab('locations') }}
                  >
                    <span style={{ fontSize: 20 }}>{vehicleTypeIcon[s.type]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.locName}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>
                        {vehicleTypeLabel[s.type]}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 16, fontWeight: 700, color: 'var(--red)' }}>
                        {s.actual} / {s.target}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--red)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>
                        -{s.deficit} {t('deficit')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── FAULTS ── */}
      {tab === 'faults' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="inp"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleFaults(20) }}
              style={{ maxWidth: 240, height: 32 }}
            />
            {(['all', 'open', 'in_progress', 'ready', 'closed'] as const).map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${filterStatus === s ? 'btn-red' : 'btn-muted'}`}
                onClick={() => { setFilterStatus(s); setVisibleFaults(20) }}
              >
                {s === 'all' ? t('all') : t(`badgeFault_${s}` as Parameters<typeof t>[0])}
              </button>
            ))}
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => exportCsv(
                filteredFaults.map((f) => ({
                  id: f.id,
                  vehicle: f.vehicle_id,
                  location: getFaultLoc(f)?.name ?? f.location_id,
                  type: f.fault_type,
                  status: f.status,
                  photos: f.photo_count,
                  quality: f.quality_score ?? '',
                  date: fmtDateTime(f.created_at),
                  notes: f.notes ?? '',
                  repair: f.repair_notes ?? '',
                })),
                `faults-${new Date().toISOString().split('T')[0]}.csv`
              )}
            >
              {t('exportCsv')}
            </button>
          </div>
          <div className="htf-card" style={{ padding: 0 }}>
            {filteredFaults.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>{t('noFaultsFound')}</div>
            ) : filteredFaults.slice(0, visibleFaults).map((f) => (
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
          {visibleFaults < filteredFaults.length && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setVisibleFaults((n) => n + 20)}>
                {t('loadMore')} ({filteredFaults.length - visibleFaults} {t('remaining')}) →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── RANKING ── */}
      {tab === 'ranking' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {(['month', 'prev', 'ytd'] as const).map((p) => (
              <button key={p} className={`btn btn-sm ${rankPeriod === p ? 'btn-red' : 'btn-muted'}`} onClick={() => setRankPeriod(p)}>
                {p === 'month' ? t('thisMonth') : p === 'prev' ? t('prevMonth') : t('ytd')}
              </button>
            ))}
            {rankEntries.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => exportCsv(
                  rankByFaults.map((r, i) => ({
                    rank: i + 1,
                    location: r.location_name,
                    faults: r.fault_count,
                    quality: r.quality_avg.toFixed(1),
                  })),
                  `ranking-${rankPeriod}-${new Date().toISOString().split('T')[0]}.csv`
                )}
              >
                {t('csv')}
              </button>
            )}
          </div>

          <div className="grid-2">
            <div>
              <div className="htf-sh"><h2>{t('rankFaults')}</h2><div className="htf-rule" /></div>
              <div className="htf-card" style={{ padding: 0 }}>
                {rankByFaults.map((r, i) => (
                  <div key={r.location_id} className="rank-row" style={{ cursor: 'pointer' }} onClick={() => { setDrillLoc(r.location_id); setTab('locations') }}>
                    <div className="rank-n" style={{ color: i === 0 ? 'var(--gold)' : '#D6B87A' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{r.location_name}</div></div>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 17, fontWeight: 700, color: 'var(--red)' }}>{r.fault_count}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="htf-sh"><h2>{t('rankingQuality')}</h2><div className="htf-rule" /></div>
              <div className="htf-card" style={{ padding: 0 }}>
                {rankByQuality.map((r, i) => (
                  <div key={r.location_id} className="rank-row">
                    <div className="rank-n" style={{ color: i === 0 ? 'var(--gold)' : '#D6B87A' }}>{i + 1}</div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13 }}>{r.location_name}</div></div>
                    <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 17, fontWeight: 700, color: 'var(--gold)' }}>{r.quality_avg.toFixed(1)} ★</div>
                  </div>
                ))}
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
                <button className="btn btn-ghost btn-sm" onClick={() => setDrillLoc(null)}>{t('backToLocations')}</button>
                <div style={{ fontFamily: "'Playfair Display'", fontSize: 22, fontWeight: 700 }}>
                  {getDrillLocName(drillLoc)}
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <div className="htf-sh"><h2>{t('vehicles')}</h2><div className="htf-rule" /></div>
                  <div className="htf-card" style={{ padding: 0 }}>
                    {drillVehicles.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>{t('noVehiclesAtLoc')}</div>
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
                  <div className="htf-sh"><h2>{t('faults')}</h2><div className="htf-rule" /></div>
                  <div className="htf-card" style={{ padding: 0 }}>
                    {drillFaults.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)' }}>{t('noFaultsAtLoc')}</div>
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
              <div className="htf-sh"><h2>{t('allLocations')}</h2><div className="htf-rule" /></div>
              <div className="htf-card" style={{ padding: 0 }}>
                {nonHubLocations.map((loc) => {
                  const faultCnt = allFaults.filter((f) => f.location_id === loc.id && f.status !== 'closed').length
                  const vCnt     = allVehicles.filter((v) => v.location_id === loc.id).length
                  return (
                    <div key={loc.id} className="fault-row" style={{ cursor: 'pointer' }} onClick={() => setDrillLoc(loc.id)}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{loc.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>{loc.city} · {vCnt} {t('vehiclesSuffix')}</div>
                      </div>
                      {faultCnt > 0 && <span className="badge badge-red">{faultCnt} {faultCnt !== 1 ? t('faults') : t('faultSingular')}</span>}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ── PLANNING ── */}
      {tab === 'planning' && (() => {
        const grouped = allSchedules.reduce((acc, s) => {
          if (!acc[s.scheduled_date]) acc[s.scheduled_date] = []
          acc[s.scheduled_date].push(s)
          return acc
        }, {} as Record<string, PickupSchedule[]>)

        const getSchedDriverName = (s: PickupSchedule) =>
          MOCK_MODE ? (MOCK_USERS_MAP[s.driver_id]?.full_name ?? s.driver_id) : (s.driver?.full_name ?? s.driver_id)
        const getSchedFromName = (s: PickupSchedule) =>
          MOCK_MODE ? (MOCK_LOC_MAP[s.from_location_id]?.name ?? s.from_location_id) : (s.from_location?.name ?? s.from_location_id)
        const getSchedToName = (s: PickupSchedule) =>
          MOCK_MODE ? (MOCK_LOC_MAP[s.to_location_id]?.name ?? s.to_location_id) : (s.to_location?.name ?? s.to_location_id)

        return (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: 'var(--muted)', letterSpacing: 1 }}>
                {allSchedules.filter((s) => s.status === 'planned').length} {t('planned')} · {allSchedules.filter((s) => s.status === 'completed').length} {t('completed')}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => exportCsv(
                  allSchedules.map((s) => ({
                    date: s.scheduled_date,
                    from: getSchedFromName(s),
                    to: getSchedToName(s),
                    vehicle: s.vehicle_id,
                    driver: getSchedDriverName(s),
                    time: `${s.time_from}–${s.time_to}`,
                    status: s.status,
                    notes: s.notes ?? '',
                  })),
                  `schedule-${new Date().toISOString().split('T')[0]}.csv`
                )}
              >
                {t('csv')}
              </button>
            </div>

            {Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
              <div key={date} style={{ marginBottom: 24 }}>
                <div className="htf-sh">
                  <h2>{fmtDate(date)}</h2>
                  <div className="htf-rule" />
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, color: 'var(--muted)', letterSpacing: 1 }}>
                    {items.filter((s) => s.status === 'planned').length} {t('planned')} · {items.filter((s) => s.status === 'completed').length} {t('completed')}
                  </div>
                </div>
                <div className="htf-card" style={{ padding: 0 }}>
                  {items.map((s) => (
                    <div key={s.id} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderBottom: '1px solid #F5E6CC', alignItems: 'center', opacity: s.status === 'cancelled' ? 0.5 : 1 }}>
                      <div style={{ minWidth: 70, fontFamily: "'Barlow Condensed'", fontSize: 13, color: 'var(--muted)', letterSpacing: 0.5 }}>
                        {s.time_from}<br />{s.time_to}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{s.vehicle_id}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {getSchedFromName(s)} → {getSchedToName(s)} · {getSchedDriverName(s)}
                        </div>
                        {s.notes && <div style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>{s.notes}</div>}
                      </div>
                      <span className={`badge ${s.status === 'completed' ? 'badge-green' : s.status === 'cancelled' ? 'badge-muted' : 'badge-gold'}`}>
                        {t(`scheduleStatus_${s.status}` as Parameters<typeof t>[0])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(grouped).length === 0 && (
              <div className="htf-card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                {t('noSchedules')}
              </div>
            )}
          </>
        )
      })()}
    </div>
  )
}

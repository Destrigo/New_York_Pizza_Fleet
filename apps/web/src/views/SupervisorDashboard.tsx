import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { FaultBadge, VehicleBadge } from '@/components/StatusBadge'
import { fmtDateTime, vehicleTypeIcon, vehicleTypeLabel, exportCsv } from '@/lib/utils'
import { MOCK_LOC_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useFaults } from '@/hooks/useFaults'
import { useVehicles } from '@/hooks/useVehicles'
import { useLocations } from '@/hooks/useLocations'
import type { RankEntry } from '@/hooks/useRanking'
import type { Fault, FaultStatus, Vehicle, VehicleType } from '@/types'

type RankPeriod = 'month' | 'prev' | 'ytd'

const STATUS_ORDER: FaultStatus[] = ['open', 'in_progress', 'ready', 'closed']

export default function SupervisorDashboard() {
  const { user } = useAuth()
  const [tab, setTab]           = useState<'overview' | 'faults' | 'ranking' | 'locations'>('overview')
  const [rankPeriod, setRankPeriod] = useState<RankPeriod>('month')
  const [drillLoc, setDrillLoc] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FaultStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const { faults: allFaults, loading: fLoading } = useFaults()
  const { vehicles: allVehicles, loading: vLoading } = useVehicles()
  const { locations: nonHubLocations } = useLocations({ excludeHub: true })

  if (!user) return null
  if (fLoading || vLoading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>

  const activeFaults = allFaults.filter((f) => f.status !== 'closed')
  const hubVehicles  = allVehicles.filter((v) => v.location_id === 'hub-hfd' || v.location_id === 'hub-ens')

  // Period filter for ranking
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

  // Compute ranking from period-filtered faults
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

  const totalByType = (['ebike', 'scooter', 'car', 'bus'] as VehicleType[]).map((t) => ({
    type: t,
    total: allVehicles.filter((v) => v.type === t).length,
    ok:    allVehicles.filter((v) => v.type === t && v.status === 'ok').length,
    fault: allVehicles.filter((v) => v.type === t && (v.status === 'fault' || v.status === 'fix')).length,
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

          <div className="grid-2">
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
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              className="inp"
              placeholder="Zoek op voertuig, type, locatie…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 240, height: 32 }}
            />
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

          <div className="grid-2">
            <div>
              <div className="htf-sh"><h2>Ranking storingen</h2><div className="htf-rule" /></div>
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
              <div className="htf-sh"><h2>Kwaliteit meldingen ★</h2><div className="htf-rule" /></div>
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
                <button className="btn btn-ghost btn-sm" onClick={() => setDrillLoc(null)}>← Alle locaties</button>
                <div style={{ fontFamily: "'Playfair Display'", fontSize: 22, fontWeight: 700 }}>
                  {getDrillLocName(drillLoc)}
                </div>
              </div>
              <div className="grid-2">
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
                {nonHubLocations.map((loc) => {
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

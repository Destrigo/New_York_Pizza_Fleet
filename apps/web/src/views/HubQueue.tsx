import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/components/Toast'
import { fmtDateTime, vehicleTypeIcon, faultStatusLabel } from '@/lib/utils'
import { MOCK_FAULTS, MOCK_VEHICLES, MOCK_LOC_MAP } from '@/lib/mock'
import type { Fault, FaultStatus } from '@/types'

const STATUS_COLS: FaultStatus[] = ['open', 'in_progress', 'ready']

export default function HubQueue() {
  const toast = useToast()
  const [faults, setFaults] = useState(MOCK_FAULTS.filter((f) => f.status !== 'closed'))
  const [filterType, setFilterType] = useState<string>('all')

  const grouped = STATUS_COLS.reduce((acc, s) => {
    acc[s] = faults.filter((f) => f.status === s && (filterType === 'all' || MOCK_VEHICLES.find((v) => v.id === f.vehicle_id)?.type === filterType))
    return acc
  }, {} as Record<FaultStatus, Fault[]>)

  const advance = (fault: Fault) => {
    const next: FaultStatus = fault.status === 'open' ? 'in_progress' : fault.status === 'in_progress' ? 'ready' : 'closed'
    setFaults((prev) => prev.map((f) => f.id === fault.id ? { ...f, status: next } : f).filter((f) => f.status !== 'closed'))
    toast(`${fault.vehicle_id} → ${faultStatusLabel[next]}`)
  }

  const colColor: Record<FaultStatus, string> = {
    open: 'var(--red)', in_progress: 'var(--gold)', ready: 'var(--green)', closed: 'var(--muted)',
  }

  return (
    <div>
      <div className="htf-title">Storing Queue</div>
      <div className="htf-sub">Hub operaties · Live overzicht</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'ebike', 'scooter', 'car', 'bus'].map((t) => (
          <button key={t} className={`btn btn-sm ${filterType === t ? 'btn-red' : 'btn-muted'}`} onClick={() => setFilterType(t)}>
            {t === 'all' ? 'Alle' : t}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {STATUS_COLS.map((status) => (
          <div key={status}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: colColor[status] }} />
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: colColor[status] }}>
                {faultStatusLabel[status]}
              </div>
              <div style={{ background: colColor[status], color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                {grouped[status].length}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped[status].length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 13, border: '2px dashed var(--bdr)', borderRadius: 4 }}>
                  Leeg
                </div>
              ) : grouped[status].map((f) => {
                const vehicle = MOCK_VEHICLES.find((v) => v.id === f.vehicle_id)
                const loc     = MOCK_LOC_MAP[f.location_id]
                const canAdv  = f.status !== 'ready'
                return (
                  <div key={f.id} className="htf-card" style={{ padding: 14, borderTopColor: colColor[status] }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{vehicleTypeIcon[vehicle?.type ?? '']}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'Playfair Display'", fontWeight: 700, fontSize: 16 }}>{f.vehicle_id}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>{loc?.name}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, marginBottom: 6 }}>{f.fault_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", marginBottom: 10 }}>
                      {fmtDateTime(f.created_at)} · {f.photo_count} foto's
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/faults/${f.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                        💬 Detail
                      </Link>
                      {canAdv && (
                        <button className="btn btn-sm" style={{ flex: 1, background: colColor[f.status === 'open' ? 'in_progress' : 'ready'], color: '#fff' }} onClick={() => advance(f)}>
                          {f.status === 'open' ? '▶ Start Fix' : '✓ Klaar'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

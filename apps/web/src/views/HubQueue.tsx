import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'
import { useToast } from '@/components/Toast'
import { fmtDateTime, vehicleTypeIcon } from '@/lib/utils'
import { MOCK_VEHICLES, MOCK_LOC_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useFaults } from '@/hooks/useFaults'
import type { Fault, FaultStatus } from '@/types'

function slaAge(createdAt: string): string {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${hours.toFixed(0)}u`
  return `${(hours / 24).toFixed(1)}d`
}

function slaColor(createdAt: string, status: FaultStatus): string {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  if (status === 'open' && hours > 4) return 'var(--red)'
  if (status === 'in_progress' && hours > 24) return 'var(--red)'
  if (hours > 8) return 'var(--gold)'
  return 'var(--muted)'
}

const STATUS_COLS: FaultStatus[] = ['open', 'in_progress', 'ready']

const colColor: Record<FaultStatus, string> = {
  open: 'var(--red)', in_progress: 'var(--gold)', ready: 'var(--green)', closed: 'var(--muted)',
}

export default function HubQueue() {
  const { t } = useI18n()
  const toast = useToast()
  const { faults, loading, updateStatus } = useFaults({ status: ['open', 'in_progress', 'ready'] })
  const [filterType, setFilterType] = useState<string>('all')

  const getVehicle = (f: Fault) =>
    MOCK_MODE ? MOCK_VEHICLES.find((v) => v.id === f.vehicle_id) : f.vehicle

  const getLoc = (f: Fault) =>
    MOCK_MODE ? MOCK_LOC_MAP[f.location_id] : f.location

  const filtered = filterType === 'all'
    ? faults
    : faults.filter((f) => getVehicle(f)?.type === filterType)

  const grouped = STATUS_COLS.reduce((acc, s) => {
    acc[s] = filtered.filter((f) => f.status === s)
    return acc
  }, {} as Record<FaultStatus, Fault[]>)

  const advance = (fault: Fault) => {
    const next: FaultStatus = fault.status === 'open' ? 'in_progress' : fault.status === 'in_progress' ? 'ready' : 'closed'
    updateStatus(fault.id, next)
    toast(`${fault.vehicle_id} → ${t(`badgeFault_${next}` as Parameters<typeof t>[0])}`)
  }

  const readyFaults = grouped['ready'] ?? []
  const closeAllReady = async () => {
    if (readyFaults.length === 0) return
    const label = readyFaults.length !== 1 ? t('readyFaultPlural') : t('readyFaultSingular')
    if (!confirm(`${readyFaults.length} ${label} ${t('confirmCloseReadySuffix')}`)) return
    for (const f of readyFaults) await updateStatus(f.id, 'closed')
    toast(`${readyFaults.length} ${t('toastFaultsClosedSuffix')}`)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
        <div>
          <div className="htf-title">{t('queueTitle')}</div>
          <div className="htf-sub">{t('queueSub')}</div>
        </div>
        {readyFaults.length > 0 && (
          <button className="btn btn-muted btn-sm" onClick={closeAllReady}>
            {t('closeAllReady')} ({readyFaults.length})
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'ebike', 'scooter', 'car', 'bus'].map((tp) => (
          <button key={tp} className={`btn btn-sm ${filterType === tp ? 'btn-red' : 'btn-muted'}`} onClick={() => setFilterType(tp)}>
            {tp === 'all' ? t('all') : tp}
          </button>
        ))}
      </div>

      <div className="grid-3">
        {STATUS_COLS.map((status) => (
          <div key={status}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: colColor[status] }} />
              <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: colColor[status] }}>
                {t(`badgeFault_${status}` as Parameters<typeof t>[0])}
              </div>
              <div style={{ background: colColor[status], color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                {grouped[status].length}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped[status].length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--muted)', fontSize: 13, border: '2px dashed var(--bdr)', borderRadius: 4 }}>
                  {t('empty')}
                </div>
              ) : grouped[status].map((f) => {
                const vehicle = getVehicle(f)
                const loc     = getLoc(f)
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'" }}>
                        {fmtDateTime(f.created_at)} · {f.photo_count} {t('photoCountSuffix')}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {f.quality_score != null && (
                          <span style={{ fontSize: 10, fontFamily: "'Barlow Condensed'", letterSpacing: 0.5, color: 'var(--gold)' }}>
                            ★ {f.quality_score.toFixed(1)}
                          </span>
                        )}
                        <span style={{ fontSize: 10, fontFamily: "'Barlow Condensed'", letterSpacing: 0.5, color: slaColor(f.created_at, f.status), fontWeight: 700 }}>
                          ⏱ {slaAge(f.created_at)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/faults/${f.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                        {t('detail')}
                      </Link>
                      {canAdv && (
                        <button
                          className="btn btn-sm"
                          style={{ flex: 1, background: colColor[f.status === 'open' ? 'in_progress' : 'ready'], color: '#fff' }}
                          onClick={() => advance(f)}
                        >
                          {f.status === 'open' ? t('startFix') : t('markReady')}
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

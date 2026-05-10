import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useToast } from '@/components/Toast'
import { FaultBadge } from '@/components/StatusBadge'
import ChatPanel from '@/components/ChatPanel'
import { fmtDate, fmtDateTime, vehicleTypeIcon, vehicleTypeLabel, printChatThread } from '@/lib/utils'
import { MOCK_VEHICLES, MOCK_LOC_MAP, MOCK_USERS_MAP } from '@/lib/mock'
import { MOCK_MODE, supabase } from '@/lib/supabase'
import { useFault } from '@/hooks/useFaults'
import { useMessages } from '@/hooks/useMessages'
import { useFaultPhotos } from '@/hooks/useFaultPhotos'
import { useFaultEvents, STATUS_ICON } from '@/hooks/useFaultEvents'
import { useSchedules } from '@/hooks/useSchedules'
import type { Fault } from '@/types'

export default function FaultDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { t } = useI18n()
  const toast = useToast()
  const [lightbox, setLightbox]       = useState<string | null>(null)
  const [repairInput, setRepairInput] = useState<string | null>(null)

  const { fault, loading, setFault } = useFault(id)
  const { messages, send } = useMessages(id)
  const { photos } = useFaultPhotos(id)
  const { events } = useFaultEvents(id)
  const { schedules: linkedSchedules } = useSchedules({ faultId: id })

  if (!user || !id) return null
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div>
  if (!fault) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>{t('faultNotFound')}</div>

  const vehicle  = MOCK_MODE ? MOCK_VEHICLES.find((v) => v.id === fault.vehicle_id) : fault.vehicle
  const loc      = MOCK_MODE ? MOCK_LOC_MAP[fault.location_id] : fault.location
  const reporter = MOCK_MODE ? MOCK_USERS_MAP[fault.reported_by] : fault.reporter
  const isHub    = user.role === 'mechanic' || user.role === 'supervisor'

  const handleSend = (_faultId: string, body: string) => {
    send(body, user.id, isHub).then(({ error }) => {
      if (error) toast(t('toastSendFailed'), 'error')
    })
  }

  const updateStatus = async (status: Fault['status'], repairNotes?: string) => {
    const patch: Partial<Fault> = { status }
    if (repairNotes !== undefined) patch.repair_notes = repairNotes
    setFault((prev) => prev ? { ...prev, ...patch } : prev)
    setRepairInput(null)
    if (MOCK_MODE) {
      toast(`${t('toastStatusUpdated')} ${status}`)
      return
    }
    await supabase!.from('faults').update(patch).eq('id', fault.id)
    toast(t('toastStatusUpdated'))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>{vehicleTypeIcon[vehicle?.type ?? '']}</span>
            <div className="htf-title" style={{ marginBottom: 0 }}>{fault.vehicle_id}</div>
            <FaultBadge status={fault.status} />
          </div>
          <div className="htf-sub" style={{ marginBottom: 0 }}>
            {vehicleTypeLabel[vehicle?.type ?? '']} · {loc?.name} · {fmtDateTime(fault.created_at)}
          </div>
        </div>
        <Link
          to={user.role === 'mechanic' ? '/hub/queue' : user.role === 'supervisor' ? '/supervisor' : user.role === 'driver' ? '/driver/schedule' : '/dashboard'}
          className="btn btn-ghost btn-sm"
        >
          {t('back')}
        </Link>
      </div>

      <div className="grid-2">
        <div>
          <div className="htf-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <div className="lbl">{t('faultType')}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{fault.fault_type}</div>
              </div>
              <div>
                <div className="lbl">{t('reportedBy')}</div>
                <div style={{ fontSize: 15 }}>{reporter?.full_name ?? fault.reported_by}</div>
              </div>
              <div>
                <div className="lbl">{t('photos')}</div>
                <div style={{ fontSize: 15 }}>{fault.photo_count} {t('uploaded')}</div>
              </div>
              <div>
                <div className="lbl">{t('qualityScore')}</div>
                <div style={{ fontSize: 15, color: 'var(--gold)', fontWeight: 600 }}>
                  {fault.quality_score?.toFixed(1) ?? '—'} ★
                </div>
              </div>
              {fault.closed_at && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="lbl">{t('closedAt')}</div>
                  <div style={{ fontSize: 15 }}>{fmtDateTime(fault.closed_at)}</div>
                </div>
              )}
            </div>
            {fault.notes && (
              <div style={{ background: 'var(--cream)', border: '1px solid var(--bdr)', borderRadius: 3, padding: '8px 12px', fontSize: 13, fontStyle: 'italic', color: 'var(--muted)', marginBottom: fault.repair_notes ? 8 : 0 }}>
                "{fault.notes}"
              </div>
            )}
            {fault.repair_notes && (
              <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 3, padding: '8px 12px', fontSize: 13 }}>
                <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, color: 'var(--green)', display: 'block', marginBottom: 2 }}>{t('repairNote')}</span>
                {fault.repair_notes}
              </div>
            )}
          </div>

          {(fault.photo_count > 0 || photos.length > 0) && (
            <div className="htf-card" style={{ marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>
                {t('photos')} ({MOCK_MODE ? fault.photo_count : photos.length})
              </div>
              {MOCK_MODE ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Array.from({ length: fault.photo_count }).map((_, i) => (
                    <div key={i} style={{ width: 80, height: 80, background: 'var(--cream2)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: 'var(--muted)' }}>
                      📷
                    </div>
                  ))}
                </div>
              ) : photos.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t('photosLoading')}</div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {photos.map((p) => (
                    <img
                      key={p.id}
                      src={p.signedUrl}
                      alt={t('faultPhotoAlt')}
                      onClick={() => setLightbox(p.signedUrl)}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--bdr)', cursor: 'zoom-in' }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {user.role !== 'driver' && linkedSchedules.length > 0 && (
            <div className="htf-card" style={{ marginBottom: 16, borderTop: '3px solid var(--gold)' }}>
              <div className="lbl" style={{ marginBottom: 8 }}>{t('pickupsLabel')}</div>
              {linkedSchedules.map((s) => {
                const fromName = MOCK_MODE ? MOCK_LOC_MAP[s.from_location_id]?.name : s.from_location?.name
                const toName   = MOCK_MODE ? MOCK_LOC_MAP[s.to_location_id]?.name : s.to_location?.name
                const driverName = MOCK_MODE ? null : s.driver?.full_name
                return (
                  <div key={s.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #F5E6CC', alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>🚐</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>
                        {fmtDate(s.scheduled_date)} · {s.time_from}–{s.time_to}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 0.5 }}>
                        {fromName} → {toName}
                        {driverName ? ` · ${driverName}` : ''}
                      </div>
                    </div>
                    <span className={`badge ${s.status === 'completed' ? 'badge-green' : s.status === 'cancelled' ? 'badge-muted' : 'badge-gold'}`}>
                      {t(`scheduleStatus_${s.status}` as Parameters<typeof t>[0])}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {events.length > 0 && (
            <div className="htf-card" style={{ marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>{t('statusTimeline')}</div>
              <div style={{ display: 'flex', gap: 0, alignItems: 'center', flexWrap: 'wrap', rowGap: 6 }}>
                {events.map((ev, i) => (
                  <span key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {i > 0 && <span style={{ fontSize: 11, color: 'var(--muted)', margin: '0 4px' }}>→</span>}
                    <span style={{ fontSize: 13 }}>{STATUS_ICON[ev.to_status]}</span>
                    <span style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, letterSpacing: 0.5, color: 'var(--ink)' }}>
                      {t(`badgeFault_${ev.to_status}` as Parameters<typeof t>[0])}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 2 }}>
                      {fmtDateTime(ev.created_at)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {isHub && fault.status !== 'closed' && (
            <div className="htf-card htf-card-green" style={{ marginBottom: 16 }}>
              <div className="lbl">{t('changeStatus')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {fault.status === 'open' && (
                  <button className="btn btn-gold btn-sm" onClick={() => updateStatus('in_progress')}>
                    {t('startFix')}
                  </button>
                )}
                {fault.status === 'in_progress' && repairInput === null && (
                  <button className="btn btn-green btn-sm" onClick={() => setRepairInput('')}>
                    {t('markReady')}
                  </button>
                )}
                {fault.status === 'ready' && (
                  <button className="btn btn-muted btn-sm" onClick={() => updateStatus('closed')}>
                    {t('close')}
                  </button>
                )}
              </div>
              {repairInput !== null && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    className="txa"
                    style={{ minHeight: 64, marginBottom: 8 }}
                    placeholder={t('repairNotesPH')}
                    value={repairInput}
                    onChange={(e) => setRepairInput(e.target.value)}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-green btn-sm" onClick={() => updateStatus('ready', repairInput || undefined)}>
                      {t('confirmReady')}
                    </button>
                    <button className="btn btn-muted btn-sm" onClick={() => setRepairInput(null)}>
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {user.role === 'supervisor' && fault.status === 'closed' && (
            <div className="htf-card" style={{ marginBottom: 16, borderTop: '3px solid var(--muted)' }}>
              <div className="lbl">{t('supActions')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-muted btn-sm"
                  onClick={() => {
                    if (confirm(`${fault.vehicle_id} ${t('confirmReopenSuffix')}`)) updateStatus('open')
                  }}
                >
                  {t('reopen')}
                </button>
              </div>
            </div>
          )}

          <Link to={`/vehicles/${fault.vehicle_id}`} className="btn btn-muted btn-sm" style={{ display: 'inline-block', marginBottom: 16 }}>
            {t('vehicleHistoryLink')} {fault.vehicle_id}
          </Link>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="lbl" style={{ marginBottom: 0 }}>{isHub ? t('chatWith_loc') : t('chatWith_hub')}</div>
            {user.role === 'supervisor' && messages.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => printChatThread(fault, messages)}
              >
                ↓ PDF
              </button>
            )}
          </div>
          <div className="policy-banner" style={{ borderRadius: '4px 4px 0 0', fontSize: 11 }}>
            {t('chatPolicy')}
          </div>
          <ChatPanel
            faultId={fault.id}
            messages={messages}
            readOnly={user.role === 'supervisor'}
            onSend={user.role !== 'supervisor' ? handleSend : undefined}
          />
        </div>
      </div>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, cursor: 'zoom-out',
          }}
        >
          <img
            src={lightbox}
            alt={t('faultPhotoAlt')}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 4, boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', borderRadius: '50%', width: 44, height: 44 }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

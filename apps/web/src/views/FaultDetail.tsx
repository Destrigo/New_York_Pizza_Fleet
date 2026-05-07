import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { FaultBadge } from '@/components/StatusBadge'
import ChatPanel from '@/components/ChatPanel'
import { fmtDateTime, vehicleTypeIcon, vehicleTypeLabel, printChatThread } from '@/lib/utils'
import { MOCK_VEHICLES, MOCK_LOC_MAP, MOCK_USERS_MAP } from '@/lib/mock'
import { MOCK_MODE, supabase } from '@/lib/supabase'
import { useFault } from '@/hooks/useFaults'
import { useMessages } from '@/hooks/useMessages'
import { useFaultPhotos } from '@/hooks/useFaultPhotos'
import type { Fault } from '@/types'

export default function FaultDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const toast = useToast()
  const [lightbox, setLightbox] = useState<string | null>(null)

  const { fault, loading, setFault } = useFault(id)
  const { messages, send } = useMessages(id)
  const { photos } = useFaultPhotos(id)

  if (!user || !id) return null
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>
  if (!fault) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>Storing niet gevonden.</div>

  const vehicle  = MOCK_MODE ? MOCK_VEHICLES.find((v) => v.id === fault.vehicle_id) : fault.vehicle
  const loc      = MOCK_MODE ? MOCK_LOC_MAP[fault.location_id] : fault.location
  const reporter = MOCK_MODE ? MOCK_USERS_MAP[fault.reported_by] : fault.reporter
  const isHub    = user.role === 'mechanic' || user.role === 'supervisor'

  const handleSend = (_faultId: string, body: string) => {
    send(body, user.id, isHub).then(({ error }) => {
      if (error) toast('Versturen mislukt.', 'error')
    })
  }

  const updateStatus = async (status: Fault['status']) => {
    setFault((prev) => prev ? { ...prev, status } : prev)
    if (MOCK_MODE) {
      toast(`Status bijgewerkt naar: ${status}`)
      return
    }
    await supabase!.from('faults').update({ status }).eq('id', fault.id)
    toast('Status bijgewerkt.')
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
        <Link to={isHub ? '/hub/queue' : '/dashboard'} className="btn btn-ghost btn-sm">
          ← Terug
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div className="htf-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <div className="lbl">Type storing</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{fault.fault_type}</div>
              </div>
              <div>
                <div className="lbl">Gemeld door</div>
                <div style={{ fontSize: 15 }}>{reporter?.full_name ?? fault.reported_by}</div>
              </div>
              <div>
                <div className="lbl">Foto's</div>
                <div style={{ fontSize: 15 }}>{fault.photo_count} geüpload</div>
              </div>
              <div>
                <div className="lbl">Kwaliteitscore</div>
                <div style={{ fontSize: 15, color: 'var(--gold)', fontWeight: 600 }}>
                  {fault.quality_score?.toFixed(1) ?? '—'} ★
                </div>
              </div>
            </div>
            {fault.notes && (
              <div style={{ background: 'var(--cream)', border: '1px solid var(--bdr)', borderRadius: 3, padding: '8px 12px', fontSize: 13, fontStyle: 'italic', color: 'var(--muted)' }}>
                "{fault.notes}"
              </div>
            )}
          </div>

          {(fault.photo_count > 0 || photos.length > 0) && (
            <div className="htf-card" style={{ marginBottom: 16 }}>
              <div className="lbl" style={{ marginBottom: 8 }}>
                Foto's ({MOCK_MODE ? fault.photo_count : photos.length})
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
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Foto's worden geladen…</div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {photos.map((p) => (
                    <img
                      key={p.id}
                      src={p.signedUrl}
                      alt="Storing foto"
                      onClick={() => setLightbox(p.signedUrl)}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--bdr)', cursor: 'zoom-in' }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {isHub && fault.status !== 'closed' && (
            <div className="htf-card htf-card-green" style={{ marginBottom: 16 }}>
              <div className="lbl">Status wijzigen</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {fault.status === 'open' && (
                  <button className="btn btn-gold btn-sm" onClick={() => updateStatus('in_progress')}>
                    ▶ Start Fix
                  </button>
                )}
                {fault.status === 'in_progress' && (
                  <button className="btn btn-green btn-sm" onClick={() => updateStatus('ready')}>
                    ✓ Klaar
                  </button>
                )}
                {fault.status === 'ready' && (
                  <button className="btn btn-muted btn-sm" onClick={() => updateStatus('closed')}>
                    Afsluiten
                  </button>
                )}
              </div>
            </div>
          )}

          <Link to={`/vehicles/${fault.vehicle_id}`} className="btn btn-muted btn-sm" style={{ display: 'inline-block', marginBottom: 16 }}>
            📋 Voertuighistorie {fault.vehicle_id}
          </Link>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="lbl" style={{ marginBottom: 0 }}>Chat met {isHub ? 'locatie' : 'Hub'}</div>
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
            📵 Communicatie verloopt uitsluitend via Hi Tom Fleet. Geen telefonisch contact.
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
            alt="Vergroot"
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

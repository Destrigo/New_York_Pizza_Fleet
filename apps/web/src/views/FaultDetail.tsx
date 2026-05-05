import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { FaultBadge } from '@/components/StatusBadge'
import ChatPanel from '@/components/ChatPanel'
import { fmtDateTime, vehicleTypeIcon, vehicleTypeLabel } from '@/lib/utils'
import { MOCK_FAULTS, MOCK_MESSAGES, MOCK_VEHICLES, MOCK_LOC_MAP, MOCK_USERS_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import type { Fault, ChatMessage } from '@/types'

export default function FaultDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const toast = useToast()

  const [fault, setFault]       = useState<Fault | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!id) return
    if (MOCK_MODE) {
      const f = MOCK_FAULTS.find((x) => x.id === id) ?? null
      setFault(f)
      setMessages(MOCK_MESSAGES[id] ?? [])
      setLoading(false)
      return
    }
    // Real: fetch fault + messages
    Promise.all([
      import('@/lib/supabase').then(({ supabase }) =>
        supabase!.from('faults').select('*, vehicle:vehicles(*), location:locations(*), reporter:users(*)').eq('id', id).single()
      ),
      import('@/lib/supabase').then(({ supabase }) =>
        supabase!.from('chat_messages').select('*, sender:users(*)').eq('fault_id', id).order('created_at')
      ),
    ]).then(([{ data: f }, { data: msgs }]) => {
      setFault(f)
      setMessages(msgs ?? [])
      setLoading(false)
    })
  }, [id])

  if (!user || !id) return null
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>
  if (!fault) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>Storing niet gevonden.</div>

  const vehicle = MOCK_MODE ? MOCK_VEHICLES.find((v) => v.id === fault.vehicle_id) : fault.vehicle
  const loc     = MOCK_MODE ? MOCK_LOC_MAP[fault.location_id] : fault.location
  const reporter = MOCK_MODE ? MOCK_USERS_MAP[fault.reported_by] : fault.reporter
  const isHub   = user.role === 'mechanic' || user.role === 'supervisor'
  const canChat = user.role !== 'supervisor'

  const sendMessage = (faultId: string, body: string) => {
    const msg: ChatMessage = {
      id: Date.now().toString(),
      fault_id: faultId,
      sender_id: user.id,
      body,
      is_hub_side: isHub,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, msg])
    toast('Bericht verstuurd.')
    // In real mode: supabase.from('chat_messages').insert(...)
  }

  const updateStatus = async (status: Fault['status']) => {
    if (MOCK_MODE) {
      setFault((prev) => prev ? { ...prev, status } : prev)
      toast(`Status bijgewerkt naar: ${status}`)
      return
    }
    // Real
    await import('@/lib/supabase').then(({ supabase }) =>
      supabase!.from('faults').update({ status }).eq('id', fault.id)
    )
    setFault((prev) => prev ? { ...prev, status } : prev)
    toast('Status bijgewerkt.')
  }

  return (
    <div>
      {/* Header */}
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
        {/* Left — fault info */}
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

          {/* Hub status controls */}
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

          {/* Vehicle link */}
          <Link to={`/vehicles/${fault.vehicle_id}`} className="btn btn-muted btn-sm" style={{ display: 'inline-block', marginBottom: 16 }}>
            📋 Voertuighistorie {fault.vehicle_id}
          </Link>
        </div>

        {/* Right — chat */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div className="lbl" style={{ marginBottom: 0 }}>Chat met {isHub ? 'locatie' : 'Hub'}</div>
          </div>
          <div className="policy-banner" style={{ borderRadius: '4px 4px 0 0', fontSize: 11 }}>
            📵 Communicatie verloopt uitsluitend via Hi Tom Fleet. Geen telefonisch contact.
          </div>
          <ChatPanel
            faultId={fault.id}
            messages={messages}
            readOnly={user.role === 'supervisor'}
            onSend={canChat ? sendMessage : undefined}
          />
        </div>
      </div>
    </div>
  )
}

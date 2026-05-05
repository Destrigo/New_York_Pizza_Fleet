import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '@/types'
import { fmtTime } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import { MOCK_USERS_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'

interface Props {
  faultId: string
  messages: ChatMessage[]
  readOnly?: boolean
  onSend?: (faultId: string, body: string) => void
}

export default function ChatPanel({ faultId, messages, readOnly = false, onSend }: Props) {
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!user) return null

  const isHubUser = user.role === 'mechanic' || user.role === 'supervisor'

  const handleSend = () => {
    const body = draft.trim()
    if (!body || !onSend) return
    onSend(faultId, body)
    setDraft('')
  }

  const resolveUser = (msg: ChatMessage) => {
    if (MOCK_MODE) return MOCK_USERS_MAP[msg.sender_id]?.full_name ?? 'Onbekend'
    return msg.sender?.full_name ?? 'Onbekend'
  }

  return (
    <div className="chat-wrap" style={{ border: '1px solid var(--bdr)', borderRadius: 4, background: '#fff' }}>
      <div className="chat-msgs">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, margin: 'auto' }}>
            Nog geen berichten in dit gesprek.
          </div>
        ) : (
          messages.map((msg) => {
            const fromHub = msg.is_hub_side
            const alignRight = isHubUser ? fromHub : !fromHub
            return (
              <div key={msg.id} className={`msg ${alignRight ? 'msg-hub' : 'msg-loc'}`}>
                <div className="msg-meta">
                  {resolveUser(msg)} · {fmtTime(msg.created_at)}
                </div>
                <div className="msg-bubble">{msg.body}</div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {!readOnly && onSend && (
        <div className="chat-footer">
          <input
            className="chat-inp"
            placeholder="Stuur een bericht…"
            value={draft}
            maxLength={1000}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <button className="btn btn-red btn-sm" onClick={handleSend} disabled={!draft.trim()}>
            Stuur
          </button>
        </div>
      )}

      {readOnly && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid var(--bdr)', background: 'var(--cream)' }}>
          <div className="policy-banner" style={{ borderRadius: 3 }}>
            📵 Communicatie verloopt uitsluitend via Hi Tom Fleet. Geen telefonisch contact.
          </div>
        </div>
      )}
    </div>
  )
}

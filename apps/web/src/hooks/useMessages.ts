import { useState, useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ChatMessage } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_MESSAGES } from '@/lib/mock'

export function useMessages(faultId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading]   = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!faultId) return

    if (MOCK_MODE) {
      setMessages(MOCK_MESSAGES[faultId] ?? [])
      setLoading(false)
      return
    }

    // Initial fetch
    supabase!
      .from('chat_messages')
      .select('*, sender:users(full_name, role)')
      .eq('fault_id', faultId)
      .order('created_at')
      .then(({ data }) => {
        setMessages(data ?? [])
        setLoading(false)
      })

    // Realtime subscription
    const channel = supabase!
      .channel(`messages-${faultId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `fault_id=eq.${faultId}` },
        (payload) => {
          const msg = payload.new as ChatMessage
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => {
      if (channelRef.current) supabase!.removeChannel(channelRef.current)
    }
  }, [faultId])

  const send = async (body: string, isSender: string, isHubSide: boolean) => {
    if (MOCK_MODE) {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        fault_id: faultId!,
        sender_id: isSender,
        body,
        is_hub_side: isHubSide,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, msg])
      return { error: null }
    }

    const { error } = await supabase!
      .from('chat_messages')
      .insert({ fault_id: faultId, sender_id: isSender, body, is_hub_side: isHubSide })
    return { error }
    // Realtime subscription will add the message to state
  }

  return { messages, loading, send }
}

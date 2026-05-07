import { useState, useEffect, useCallback } from 'react'
import type { Notification } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const MOCK_NOTIFS: Notification[] = [
  { id: 'n1', recipient_id: 'ayoub', type: 'fault_new', title: 'Storing ontvangen', body: 'Beste Ayoub, bedankt voor je melding. We bezoeken je locatie zo snel mogelijk. — Hi Tom Fleet', related_fault_id: 'f1', related_pickup_id: null, read_at: null, sent_at: '2026-04-25T08:14:00Z', created_at: '2026-04-25T08:14:00Z' },
  { id: 'n2', recipient_id: 'ayoub', type: 'pickup', title: 'Ophaalmoment gepland', body: 'Beste Bilderdijkstraat/Ayoub, je staat gepland voor een ophaalmoment op 25 april tussen 10:00-11:30.', related_fault_id: 'f1', related_pickup_id: 'p1', read_at: '2026-04-25T09:00:00Z', sent_at: '2026-04-25T08:50:00Z', created_at: '2026-04-25T08:50:00Z' },
  { id: 'n3', recipient_id: 'ayoub', type: 'chat', title: 'Nieuw bericht van Hub', body: 'Hub: Duidelijk. We plannen ophaalmoment voor 25/04 tussen 13:00–15:00.', related_fault_id: 'f1', related_pickup_id: null, read_at: null, sent_at: '2026-04-25T08:35:00Z', created_at: '2026-04-25T08:35:00Z' },
]

export function useNotifications() {
  const { user } = useAuth()
  const [notifs, setNotifs]   = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    if (MOCK_MODE) {
      setNotifs(MOCK_NOTIFS.filter((n) => n.recipient_id === user.id))
      setLoading(false)
      return
    }
    const { data } = await supabase!
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifs(data ?? [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => { load() }, [load])

  // Realtime: push new notifications live
  useEffect(() => {
    if (!user || MOCK_MODE) return
    const channel = supabase!
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        (payload) => setNotifs((prev) => [payload.new as Notification, ...prev])
      )
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [user?.id])

  const markRead = async (id: string) => {
    const now = new Date().toISOString()
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read_at: now } : n))
    if (!MOCK_MODE) {
      await supabase!.from('notifications').update({ read_at: now }).eq('id', id)
    }
  }

  const markAllRead = async () => {
    const now = new Date().toISOString()
    const unreadIds = notifs.filter((n) => !n.read_at).map((n) => n.id)
    setNotifs((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })))
    if (!MOCK_MODE && unreadIds.length > 0) {
      await supabase!.from('notifications').update({ read_at: now }).in('id', unreadIds)
    }
  }

  const unreadCount = notifs.filter((n) => !n.read_at).length

  return { notifs, loading, unreadCount, markRead, markAllRead }
}

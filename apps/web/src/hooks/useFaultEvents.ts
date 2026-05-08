import { useState, useEffect, useCallback } from 'react'
import type { FaultEvent, FaultStatus } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'

const MOCK_EVENTS: Record<string, FaultEvent[]> = {
  f1: [
    { id: 'e1', fault_id: 'f1', from_status: null,         to_status: 'open',        changed_by: null, created_at: '2026-05-07T08:00:00Z' },
    { id: 'e2', fault_id: 'f1', from_status: 'open',        to_status: 'in_progress', changed_by: null, created_at: '2026-05-07T09:30:00Z' },
    { id: 'e3', fault_id: 'f1', from_status: 'in_progress', to_status: 'ready',       changed_by: null, created_at: '2026-05-07T11:00:00Z' },
  ],
}

const STATUS_ICON: Record<FaultStatus, string> = {
  open: '🔴', in_progress: '🟡', ready: '🟢', closed: '⚫',
}

export { STATUS_ICON }

export function useFaultEvents(faultId: string | undefined) {
  const [events, setEvents]   = useState<FaultEvent[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!faultId) { setLoading(false); return }
    setLoading(true)

    if (MOCK_MODE) {
      setEvents(MOCK_EVENTS[faultId] ?? [])
      setLoading(false)
      return
    }

    const { data } = await supabase!
      .from('fault_events')
      .select('*')
      .eq('fault_id', faultId)
      .order('created_at')

    setEvents(data ?? [])
    setLoading(false)
  }, [faultId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!faultId || MOCK_MODE) return
    const channel = supabase!
      .channel(`fault-events-${faultId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fault_events', filter: `fault_id=eq.${faultId}` },
        (payload) => setEvents((prev) => [...prev, payload.new as FaultEvent])
      )
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [faultId, load])

  return { events, loading }
}

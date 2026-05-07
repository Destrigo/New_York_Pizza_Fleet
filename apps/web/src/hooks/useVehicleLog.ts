import { useState, useEffect, useCallback } from 'react'
import type { VehicleLog } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_LOG } from '@/lib/mock'

export function useVehicleLog(vehicleId: string | undefined) {
  const [log, setLog]         = useState<VehicleLog[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!vehicleId) return
    setLoading(true)
    if (MOCK_MODE) {
      setLog(MOCK_LOG.filter((l) => l.vehicle_id === vehicleId).sort((a, b) => b.created_at.localeCompare(a.created_at)))
      setLoading(false)
      return
    }
    const { data } = await supabase!
      .from('vehicle_log')
      .select('*, from_location:locations!from_location_id(*), to_location:locations!to_location_id(*), performer:users(full_name)')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
    setLog(data ?? [])
    setLoading(false)
  }, [vehicleId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!vehicleId || MOCK_MODE) return
    const channel = supabase!
      .channel(`vehicle-log-${vehicleId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicle_log', filter: `vehicle_id=eq.${vehicleId}` }, () => { load() })
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [vehicleId, load])

  return { log, loading }
}

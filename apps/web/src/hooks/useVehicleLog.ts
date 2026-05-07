import { useState, useEffect } from 'react'
import type { VehicleLog } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_LOG } from '@/lib/mock'

export function useVehicleLog(vehicleId: string | undefined) {
  const [log, setLog]         = useState<VehicleLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!vehicleId) return
    if (MOCK_MODE) {
      setLog(MOCK_LOG.filter((l) => l.vehicle_id === vehicleId).sort((a, b) => b.created_at.localeCompare(a.created_at)))
      setLoading(false)
      return
    }
    supabase!
      .from('vehicle_log')
      .select('*, from_location:locations!from_location_id(*), to_location:locations!to_location_id(*), performer:users(full_name)')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setLog(data ?? []); setLoading(false) })
  }, [vehicleId])

  return { log, loading }
}

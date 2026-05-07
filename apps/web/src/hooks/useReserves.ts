import { useState, useEffect } from 'react'
import type { Reserve, VehicleType } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_LOCATIONS } from '@/lib/mock'

const VEHICLE_TYPES: VehicleType[] = ['ebike', 'scooter', 'car', 'bus']

const DEFAULT_TARGET: Record<VehicleType, number> = {
  ebike: 5, scooter: 2, car: 0, bus: 0,
}

export function useReserves() {
  const [reserves, setReserves] = useState<Reserve[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (MOCK_MODE) {
      const locs = MOCK_LOCATIONS.filter((l) => !l.is_hub)
      const data: Reserve[] = locs.flatMap((l) =>
        VEHICLE_TYPES.map((t) => ({
          id: `${l.id}-${t}`,
          location_id: l.id,
          vehicle_type: t,
          target_count: DEFAULT_TARGET[t],
          updated_by: 'mock',
          updated_at: new Date().toISOString(),
        }))
      )
      setReserves(data)
      setLoading(false)
      return
    }

    supabase!
      .from('reserves')
      .select('*, location:locations(*)')
      .order('location_id')
      .then(({ data }) => { setReserves(data ?? []); setLoading(false) })
  }, [])

  const upsert = async (locationId: string, vehicleType: VehicleType, targetCount: number, updatedBy: string) => {
    if (MOCK_MODE) {
      setReserves((prev) =>
        prev.map((r) =>
          r.location_id === locationId && r.vehicle_type === vehicleType
            ? { ...r, target_count: targetCount }
            : r
        )
      )
      return { error: null }
    }
    const { error } = await supabase!.from('reserves').upsert({
      location_id: locationId,
      vehicle_type: vehicleType,
      target_count: targetCount,
      updated_by: updatedBy,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'location_id,vehicle_type' })
    if (!error) {
      setReserves((prev) =>
        prev.map((r) =>
          r.location_id === locationId && r.vehicle_type === vehicleType
            ? { ...r, target_count: targetCount, updated_by: updatedBy }
            : r
        )
      )
    }
    return { error }
  }

  return { reserves, loading, upsert }
}

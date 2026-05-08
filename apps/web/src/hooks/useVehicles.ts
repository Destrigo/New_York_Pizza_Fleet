import { useState, useEffect, useCallback } from 'react'
import type { Vehicle } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_VEHICLES } from '@/lib/mock'

interface Options {
  locationId?: string
  excludeStatus?: Vehicle['status'][]
  hubOnly?: boolean
}

export function useVehicles(opts: Options = {}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(() => {
    if (MOCK_MODE) {
      let data = [...MOCK_VEHICLES]
      if (opts.locationId)     data = data.filter((v) => v.location_id === opts.locationId)
      if (opts.hubOnly)        data = data.filter((v) => v.location_id === 'hub-hfd' || v.location_id === 'hub-ens')
      if (opts.excludeStatus)  data = data.filter((v) => !opts.excludeStatus!.includes(v.status))
      setVehicles(data)
      setLoading(false)
      return
    }

    let q = supabase!
      .from('vehicles')
      .select('*, location:locations(*)')
      .order('id')

    if (opts.locationId)  q = q.eq('location_id', opts.locationId)
    if (opts.hubOnly)     q = q.or('location_id.eq.hub-hfd,location_id.eq.hub-ens')
    if (opts.excludeStatus?.length) q = q.not('status', 'in', `(${opts.excludeStatus.join(',')})`)

    q.then(({ data }) => {
      setVehicles(data ?? [])
      setLoading(false)
    })
  }, [opts.locationId, opts.hubOnly, JSON.stringify(opts.excludeStatus)])

  useEffect(() => { load() }, [load])

  // Realtime subscription for vehicles
  useEffect(() => {
    if (MOCK_MODE) return
    const channel = supabase!
      .channel('vehicles-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, load)
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [load])

  const assign = async (vehicleId: string, targetLocationId: string, performedBy: string) => {
    if (MOCK_MODE) {
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId))
      return { error: null }
    }
    const currentVehicle = vehicles.find((v) => v.id === vehicleId)
    const { error } = await supabase!
      .from('vehicles')
      .update({ location_id: targetLocationId, status: 'ok' })
      .eq('id', vehicleId)

    if (!error) {
      await supabase!.from('vehicle_log').insert({
        vehicle_id: vehicleId,
        event_type: 'assigned',
        from_location_id: currentVehicle?.location_id ?? null,
        to_location_id: targetLocationId,
        performed_by: performedBy,
        notes: `Toegewezen aan ${targetLocationId}`,
      })
    }
    return { error }
  }

  return { vehicles, loading, assign, reload: load }
}

export function useVehicle(id: string | undefined) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    if (MOCK_MODE) {
      setVehicle(MOCK_VEHICLES.find((v) => v.id === id) ?? null)
      setLoading(false)
      return
    }
    const { data } = await supabase!
      .from('vehicles')
      .select('*, location:locations(*)')
      .eq('id', id)
      .single()
    setVehicle(data)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!id || MOCK_MODE) return
    const channel = supabase!
      .channel(`vehicle-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vehicles', filter: `id=eq.${id}` }, () => { load() })
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [id, load])

  return { vehicle, loading }
}

import { useState, useEffect } from 'react'
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

  useEffect(() => {
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

  const assign = async (vehicleId: string, targetLocationId: string, performedBy: string) => {
    if (MOCK_MODE) {
      setVehicles((prev) =>
        prev.filter((v) => v.id !== vehicleId)
      )
      return { error: null }
    }
    const { error } = await supabase!
      .from('vehicles')
      .update({ location_id: targetLocationId, status: 'ok' })
      .eq('id', vehicleId)

    if (!error) {
      await supabase!.from('vehicle_log').insert({
        vehicle_id: vehicleId,
        event_type: 'assigned',
        to_location_id: targetLocationId,
        performed_by: performedBy,
        notes: `Toegewezen aan ${targetLocationId}`,
      })
    }
    return { error }
  }

  return { vehicles, loading, assign }
}

export function useVehicle(id: string | undefined) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    if (MOCK_MODE) {
      setVehicle(MOCK_VEHICLES.find((v) => v.id === id) ?? null)
      setLoading(false)
      return
    }
    supabase!
      .from('vehicles')
      .select('*, location:locations(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setVehicle(data); setLoading(false) })
  }, [id])

  return { vehicle, loading }
}

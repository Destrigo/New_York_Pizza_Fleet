import { useState, useEffect, useCallback } from 'react'
import type { Fault, FaultStatus } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_FAULTS } from '@/lib/mock'

interface Options {
  locationId?: string
  status?: FaultStatus | FaultStatus[]
  vehicleId?: string
  limit?: number
}

export function useFaults(opts: Options = {}) {
  const [faults, setFaults]   = useState<Fault[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (MOCK_MODE) {
      let data = [...MOCK_FAULTS]
      if (opts.locationId) data = data.filter((f) => f.location_id === opts.locationId)
      if (opts.vehicleId)  data = data.filter((f) => f.vehicle_id === opts.vehicleId)
      if (opts.status) {
        const statuses = Array.isArray(opts.status) ? opts.status : [opts.status]
        data = data.filter((f) => statuses.includes(f.status))
      }
      if (opts.limit) data = data.slice(0, opts.limit)
      data.sort((a, b) => b.created_at.localeCompare(a.created_at))
      setFaults(data)
      setLoading(false)
      return
    }

    let q = supabase!
      .from('faults')
      .select('*, vehicle:vehicles(*), location:locations(*), reporter:users(full_name)')
      .order('created_at', { ascending: false })

    if (opts.locationId) q = q.eq('location_id', opts.locationId)
    if (opts.vehicleId)  q = q.eq('vehicle_id', opts.vehicleId)
    if (opts.status) {
      const statuses = Array.isArray(opts.status) ? opts.status : [opts.status]
      q = q.in('status', statuses)
    }
    if (opts.limit) q = q.limit(opts.limit)

    const { data, error: err } = await q
    if (err) setError(err.message)
    else setFaults(data ?? [])
    setLoading(false)
  }, [opts.locationId, opts.vehicleId, JSON.stringify(opts.status), opts.limit])

  useEffect(() => { load() }, [load])

  // Realtime subscription (Supabase only)
  useEffect(() => {
    if (MOCK_MODE) return

    const channel = supabase!
      .channel('faults-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'faults' }, () => {
        load()
      })
      .subscribe()

    return () => { supabase!.removeChannel(channel) }
  }, [load])

  const updateStatus = async (id: string, status: FaultStatus) => {
    if (MOCK_MODE) {
      setFaults((prev) => prev.map((f) => f.id === id ? { ...f, status } : f))
      return
    }
    await supabase!.from('faults').update({ status }).eq('id', id)
    // Realtime will refresh automatically
  }

  return { faults, loading, error, reload: load, updateStatus }
}

export function useFault(id: string | undefined) {
  const [fault, setFault]   = useState<Fault | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    if (MOCK_MODE) {
      setFault(MOCK_FAULTS.find((f) => f.id === id) ?? null)
      setLoading(false)
      return
    }
    supabase!
      .from('faults')
      .select('*, vehicle:vehicles(*), location:locations(*), reporter:users(full_name, role)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setFault(data); setLoading(false) })
  }, [id])

  // Realtime for single fault status changes
  useEffect(() => {
    if (!id || MOCK_MODE) return
    const channel = supabase!
      .channel(`fault-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'faults', filter: `id=eq.${id}` },
        (payload) => setFault((prev) => prev ? { ...prev, ...payload.new } : prev)
      )
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [id])

  return { fault, loading, setFault }
}

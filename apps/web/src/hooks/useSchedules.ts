import { useState, useEffect, useCallback } from 'react'
import type { PickupSchedule } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_SCHEDULES } from '@/lib/mock'

interface Options {
  driverId?: string
  date?: string
  fromLocationId?: string
  status?: PickupSchedule['status'][]
}

const SELECT_FIELDS = '*, driver:users(full_name), vehicle:vehicles(*), from_location:locations!from_location_id(*), to_location:locations!to_location_id(*)'

export function useSchedules(opts: Options = {}) {
  const [schedules, setSchedules] = useState<PickupSchedule[]>([])
  const [loading, setLoading]     = useState(true)

  const load = useCallback(() => {
    if (MOCK_MODE) {
      let data = [...MOCK_SCHEDULES]
      if (opts.driverId)        data = data.filter((s) => s.driver_id === opts.driverId)
      if (opts.date)            data = data.filter((s) => s.scheduled_date === opts.date)
      if (opts.fromLocationId)  data = data.filter((s) => s.from_location_id === opts.fromLocationId)
      if (opts.status)          data = data.filter((s) => opts.status!.includes(s.status))
      data.sort((a, b) => a.time_from.localeCompare(b.time_from))
      setSchedules(data)
      setLoading(false)
      return
    }

    let q = supabase!
      .from('pickup_schedules')
      .select(SELECT_FIELDS)
      .order('scheduled_date', { ascending: false })

    if (opts.driverId)       q = q.eq('driver_id', opts.driverId)
    if (opts.date)           q = q.eq('scheduled_date', opts.date)
    if (opts.fromLocationId) q = q.eq('from_location_id', opts.fromLocationId)
    if (opts.status?.length) q = q.in('status', opts.status)

    q.then(({ data }) => { setSchedules(data ?? []); setLoading(false) })
  }, [opts.driverId, opts.date, opts.fromLocationId, JSON.stringify(opts.status)])

  useEffect(() => { load() }, [load])

  // Realtime subscription
  useEffect(() => {
    if (MOCK_MODE) return
    const channel = supabase!
      .channel('schedules-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickup_schedules' }, load)
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [load])

  const complete = async (id: string) => {
    const schedule = schedules.find((s) => s.id === id)
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, status: 'completed' } : s))
    if (!MOCK_MODE && schedule) {
      await supabase!.from('pickup_schedules').update({ status: 'completed' }).eq('id', id)
      await supabase!.from('vehicle_log').insert({
        vehicle_id: schedule.vehicle_id,
        event_type: 'moved',
        from_location_id: schedule.from_location_id,
        to_location_id: schedule.to_location_id,
        performed_by: schedule.driver_id,
        notes: `Rit voltooid door chauffeur`,
      })
    }
  }

  const cancel = async (id: string) => {
    setSchedules((prev) => prev.map((s) => s.id === id ? { ...s, status: 'cancelled' } : s))
    if (!MOCK_MODE) {
      await supabase!.from('pickup_schedules').update({ status: 'cancelled' }).eq('id', id)
    }
  }

  const create = async (fields: Omit<PickupSchedule, 'id' | 'created_at' | 'status' | 'driver' | 'vehicle' | 'from_location' | 'to_location'>) => {
    if (MOCK_MODE) {
      const newItem: PickupSchedule = { ...fields, id: Date.now().toString(), status: 'planned', created_at: new Date().toISOString() }
      setSchedules((prev) => [...prev, newItem].sort((a, b) => a.time_from.localeCompare(b.time_from)))
      return { error: null }
    }
    const { data, error } = await supabase!
      .from('pickup_schedules')
      .insert({ ...fields, status: 'planned' })
      .select(SELECT_FIELDS)
      .single()
    if (!error && data) {
      setSchedules((prev) => [...prev, data as PickupSchedule].sort((a, b) => a.time_from.localeCompare(b.time_from)))
    }
    return { error }
  }

  return { schedules, loading, complete, cancel, create }
}

import { useState, useEffect, useCallback } from 'react'
import type { Location } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_LOCATIONS } from '@/lib/mock'

interface Options {
  hubOnly?: boolean
  excludeHub?: boolean
}

export function useLocations(opts: Options = {}) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (MOCK_MODE) {
      let data = [...MOCK_LOCATIONS]
      if (opts.hubOnly)    data = data.filter((l) => l.is_hub)
      if (opts.excludeHub) data = data.filter((l) => !l.is_hub)
      setLocations(data)
      setLoading(false)
      return
    }

    let q = supabase!.from('locations').select('*').order('name')
    if (opts.hubOnly)    q = q.eq('is_hub', true)
    if (opts.excludeHub) q = q.eq('is_hub', false)

    const { data } = await q
    setLocations(data ?? [])
    setLoading(false)
  }, [opts.hubOnly, opts.excludeHub])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (MOCK_MODE) return
    const channel = supabase!
      .channel('locations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' }, () => { load() })
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [load])

  return { locations, loading, reload: load }
}

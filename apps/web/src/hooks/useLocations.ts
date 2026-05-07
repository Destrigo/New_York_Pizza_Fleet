import { useState, useEffect } from 'react'
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

  useEffect(() => {
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

    q.then(({ data }) => { setLocations(data ?? []); setLoading(false) })
  }, [opts.hubOnly, opts.excludeHub])

  return { locations, loading }
}

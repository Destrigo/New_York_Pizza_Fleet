import { useState, useEffect, useCallback } from 'react'
import type { User, Role } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_USERS } from '@/lib/mock'

interface Options {
  role?: Role
  locationId?: string
}

export function useUsers(opts: Options = {}) {
  const [users, setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (MOCK_MODE) {
      let data = [...MOCK_USERS]
      if (opts.role)       data = data.filter((u) => u.role === opts.role)
      if (opts.locationId) data = data.filter((u) => u.location_id === opts.locationId)
      setUsers(data)
      setLoading(false)
      return
    }

    let q = supabase!
      .from('users')
      .select('*, location:locations(*)')
      .order('full_name')

    if (opts.role)       q = q.eq('role', opts.role)
    if (opts.locationId) q = q.eq('location_id', opts.locationId)

    const { data } = await q
    setUsers(data ?? [])
    setLoading(false)
  }, [opts.role, opts.locationId])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (MOCK_MODE) return
    const channel = supabase!
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => { load() })
      .subscribe()
    return () => { supabase!.removeChannel(channel) }
  }, [load])

  return { users, loading, reload: load }
}

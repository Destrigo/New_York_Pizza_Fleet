import { useEffect } from 'react'
import { supabase, MOCK_MODE } from '@/lib/supabase'

// Updates users.last_seen every 60s so the edge function can skip
// FCM push when the recipient has the app open.
export function usePresence(userId: string | undefined) {
  useEffect(() => {
    if (!userId || MOCK_MODE) return

    const update = () =>
      supabase!.from('users').update({ last_seen: new Date().toISOString() }).eq('id', userId)

    update()
    const timer = setInterval(update, 60_000)
    return () => clearInterval(timer)
  }, [userId])
}

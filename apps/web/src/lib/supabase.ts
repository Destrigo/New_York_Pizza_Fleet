import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const MOCK_MODE =
  import.meta.env.VITE_MOCK_MODE === 'true' || !url || !key

export const supabase = MOCK_MODE
  ? null
  : createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true },
    })

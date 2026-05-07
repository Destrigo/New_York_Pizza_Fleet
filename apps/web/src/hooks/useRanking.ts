import { useState, useEffect } from 'react'
import { supabase, MOCK_MODE } from '@/lib/supabase'
import { MOCK_RANKING, MOCK_LOC_MAP } from '@/lib/mock'

export interface RankEntry {
  location_id: string
  location_name: string
  fault_count: number
  quality_avg: number
}

export function useRanking() {
  const [byFaults,  setByFaults]  = useState<RankEntry[]>([])
  const [byQuality, setByQuality] = useState<RankEntry[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (MOCK_MODE) {
      const entries: RankEntry[] = MOCK_RANKING.map((r) => ({
        location_id:   r.location_id,
        location_name: MOCK_LOC_MAP[r.location_id]?.name ?? r.location_id,
        fault_count:   r.fault_count,
        quality_avg:   r.quality_avg,
      }))
      setByFaults(entries)
      setByQuality([...entries].sort((a, b) => b.quality_avg - a.quality_avg))
      setLoading(false)
      return
    }

    supabase!
      .from('faults')
      .select('location_id, quality_score, location:locations(name)')
      .then(({ data }) => {
        if (!data) { setLoading(false); return }

        const groups: Record<string, { name: string; count: number; scores: number[] }> = {}
        for (const row of data as any[]) {
          const locId = row.location_id as string
          if (!groups[locId]) groups[locId] = { name: (row.location as any)?.name ?? locId, count: 0, scores: [] }
          groups[locId].count++
          if (row.quality_score != null) groups[locId].scores.push(row.quality_score as number)
        }

        const entries: RankEntry[] = Object.entries(groups).map(([locId, g]) => ({
          location_id:   locId,
          location_name: g.name,
          fault_count:   g.count,
          quality_avg:   g.scores.length > 0 ? g.scores.reduce((a, b) => a + b, 0) / g.scores.length : 0,
        }))

        setByFaults([...entries].sort((a, b) => b.fault_count - a.fault_count))
        setByQuality([...entries].sort((a, b) => b.quality_avg - a.quality_avg))
        setLoading(false)
      })
  }, [])

  return { byFaults, byQuality, loading }
}

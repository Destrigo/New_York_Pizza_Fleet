import { useState, useEffect } from 'react'
import type { FaultPhoto } from '@/types'
import { supabase, MOCK_MODE } from '@/lib/supabase'

interface PhotoWithUrl extends FaultPhoto {
  signedUrl: string
}

export function useFaultPhotos(faultId: string | undefined) {
  const [photos, setPhotos]   = useState<PhotoWithUrl[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!faultId) { setLoading(false); return }

    if (MOCK_MODE) {
      setPhotos([])
      setLoading(false)
      return
    }

    const fetchPhotos = async () => {
      const { data: rows } = await supabase!
        .from('fault_photos')
        .select('*')
        .eq('fault_id', faultId)
        .order('created_at')

      if (!rows?.length) { setPhotos([]); setLoading(false); return }

      const withUrls = await Promise.all(
        rows.map(async (row: FaultPhoto) => {
          const { data } = await supabase!.storage
            .from('fault-photos')
            .createSignedUrl(row.storage_path, 3600)
          return { ...row, signedUrl: data?.signedUrl ?? '' }
        })
      )

      setPhotos(withUrls.filter((p) => p.signedUrl))
      setLoading(false)
    }

    fetchPhotos()
  }, [faultId])

  return { photos, loading }
}

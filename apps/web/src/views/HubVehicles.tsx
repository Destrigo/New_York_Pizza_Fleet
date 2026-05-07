import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { VehicleBadge } from '@/components/StatusBadge'
import { vehicleTypeIcon, vehicleTypeLabel } from '@/lib/utils'
import { MOCK_LOC_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useVehicles } from '@/hooks/useVehicles'
import { useLocations } from '@/hooks/useLocations'
import type { VehicleType } from '@/types'

export default function HubVehicles() {
  const { user } = useAuth()
  const toast = useToast()
  const { vehicles, loading, assign } = useVehicles({ hubOnly: true })
  const { locations: destLocations }  = useLocations({ excludeHub: true })
  const [selected, setSelected]     = useState<string[]>([])
  const [targetLoc, setTargetLoc]   = useState('')
  const [filterType, setFilterType] = useState<VehicleType | 'all'>('all')

  if (!user) return null

  const filtered = filterType === 'all' ? vehicles : vehicles.filter((v) => v.type === filterType)

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const assignAll = async () => {
    if (!targetLoc || selected.length === 0) return
    const loc = destLocations.find((l) => l.id === targetLoc)
    const locName = loc?.name ?? MOCK_LOC_MAP[targetLoc]?.name ?? targetLoc
    for (const vehicleId of selected) {
      await assign(vehicleId, targetLoc, user.id)
    }
    toast(`${selected.length} voertuig${selected.length !== 1 ? 'en' : ''} toegewezen aan ${locName}.`)
    setSelected([])
    setTargetLoc('')
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>

  return (
    <div>
      <div className="htf-title">Hub Voertuigen</div>
      <div className="htf-sub">Toewijzen aan locaties</div>

      {selected.length > 0 && (
        <div style={{ background: 'var(--cream2)', border: '1px solid var(--bdr)', borderRadius: 4, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: 1 }}>
            {selected.length} voertuig{selected.length !== 1 ? 'en' : ''} geselecteerd
          </div>
          <select className="sel" style={{ flex: 1, maxWidth: 280 }} value={targetLoc} onChange={(e) => setTargetLoc(e.target.value)}>
            <option value="">— Kies doellocatie —</option>
            {destLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <button className="btn btn-green btn-sm" onClick={assignAll} disabled={!targetLoc}>
            Toewijzen →
          </button>
          <button className="btn btn-muted btn-sm" onClick={() => setSelected([])}>Annuleren</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'ebike', 'scooter', 'car', 'bus'] as const).map((t) => (
          <button key={t} className={`btn btn-sm ${filterType === t ? 'btn-red' : 'btn-muted'}`} onClick={() => setFilterType(t)}>
            {t === 'all' ? 'Alle' : vehicleTypeLabel[t]}
          </button>
        ))}
      </div>

      <div className="htf-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input
                  type="checkbox"
                  onChange={(e) => setSelected(e.target.checked ? filtered.map((v) => v.id) : [])}
                  checked={selected.length === filtered.length && filtered.length > 0}
                />
              </th>
              <th>ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Hub</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const locName = MOCK_MODE ? MOCK_LOC_MAP[v.location_id]?.name : v.location?.name
              return (
                <tr key={v.id} style={{ background: selected.includes(v.id) ? 'var(--cream2)' : 'transparent' }}>
                  <td><input type="checkbox" checked={selected.includes(v.id)} onChange={() => toggle(v.id)} /></td>
                  <td>
                    <Link to={`/vehicles/${v.id}`} style={{ fontWeight: 600, color: 'var(--red)', textDecoration: 'none' }}>
                      {vehicleTypeIcon[v.type]} {v.id}
                    </Link>
                  </td>
                  <td>{vehicleTypeLabel[v.type]}</td>
                  <td><VehicleBadge status={v.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--muted)' }}>{locName}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected([v.id])}>
                      Toewijzen
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Geen voertuigen in Hub</div>
        )}
      </div>
    </div>
  )
}

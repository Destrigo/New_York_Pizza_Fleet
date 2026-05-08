import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { VehicleBadge } from '@/components/StatusBadge'
import { vehicleTypeIcon, vehicleTypeLabel, exportCsv } from '@/lib/utils'
import { MOCK_LOC_MAP } from '@/lib/mock'
import { MOCK_MODE, supabase } from '@/lib/supabase'
import { useVehicles } from '@/hooks/useVehicles'
import { useLocations } from '@/hooks/useLocations'
import type { VehicleType, VehicleStatus } from '@/types'

export default function AdminVehicles() {
  const { user } = useAuth()
  const toast = useToast()
  const { vehicles, loading } = useVehicles()
  const { locations } = useLocations({})
  const [filterType, setFilterType] = useState<VehicleType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | 'all'>('all')
  const [search, setSearch]             = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ id: '', type: 'ebike', location_id: '' })
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ color: '', notes: '' })

  if (!user) return null

  const filtered = vehicles.filter((v) =>
    (filterType === 'all' || v.type === filterType) &&
    (filterStatus === 'all' || v.status === filterStatus) &&
    (!search || v.id.toLowerCase().includes(search.toLowerCase()))
  )

  const addVehicle = async () => {
    if (MOCK_MODE) {
      toast(`Voertuig ${form.id} toegevoegd (demo: niet persistent).`)
    } else {
      await supabase!.from('vehicles').insert({ id: form.id, type: form.type, location_id: form.location_id, status: 'ok', color: null, notes: null })
      toast(`Voertuig ${form.id} toegevoegd.`)
    }
    setShowAdd(false)
    setForm({ id: '', type: 'ebike', location_id: '' })
  }

  const openEdit = (v: { id: string; color: string | null; notes: string | null }) => {
    setEditId(v.id)
    setEditForm({ color: v.color ?? '', notes: v.notes ?? '' })
  }

  const saveEdit = async () => {
    if (!editId) return
    if (MOCK_MODE) {
      toast(`${editId} bijgewerkt (demo).`)
    } else {
      await supabase!.from('vehicles').update({
        color: editForm.color || null,
        notes: editForm.notes || null,
      }).eq('id', editId)
      toast(`${editId} bijgewerkt.`)
    }
    setEditId(null)
  }

  const retireVehicle = async (vehicleId: string) => {
    if (!confirm(`${vehicleId} buiten dienst stellen? Dit zet de status naar 'hub'.`)) return
    if (MOCK_MODE) {
      toast(`${vehicleId} buiten dienst gesteld (demo).`)
      return
    }
    await supabase!.from('vehicles').update({ status: 'hub', notes: 'Buiten dienst' }).eq('id', vehicleId)
    toast(`${vehicleId} buiten dienst gesteld.`)
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">Voertuigbeheer</div>
          <div className="htf-sub">Admin · {vehicles.length} voertuigen totaal</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => exportCsv(
              filtered.map((v) => {
                const locName = MOCK_MODE ? MOCK_LOC_MAP[v.location_id]?.name : v.location?.name
                return { id: v.id, type: vehicleTypeLabel[v.type], locatie: locName ?? v.location_id, status: v.status }
              }),
              `voertuigen-${new Date().toISOString().split('T')[0]}.csv`
            )}
          >↓ CSV</button>
          <button className="btn btn-green" onClick={() => setShowAdd(true)}>+ Voertuig toevoegen</button>
        </div>
      </div>

      {showAdd && (
        <div className="htf-card htf-card-green" style={{ marginBottom: 24 }}>
          <div className="htf-sh"><h2>Nieuw voertuig</h2><div className="htf-rule" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="field"><label className="lbl">ID (bv. F-176)</label><input className="inp" value={form.id} onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))} /></div>
            <div className="field">
              <label className="lbl">Type</label>
              <select className="sel" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                {(['ebike', 'scooter', 'car', 'bus'] as const).map((t) => <option key={t} value={t}>{vehicleTypeLabel[t]}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Startlocatie</label>
              <select className="sel" value={form.location_id} onChange={(e) => setForm((p) => ({ ...p, location_id: e.target.value }))}>
                <option value="">— Kies locatie —</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-green" onClick={addVehicle} disabled={!form.id || !form.location_id}>Toevoegen →</button>
            <button className="btn btn-muted" onClick={() => setShowAdd(false)}>Annuleren</button>
          </div>
        </div>
      )}

      {editId && (
        <div className="htf-card" style={{ marginBottom: 16, borderTop: '3px solid var(--gold)' }}>
          <div className="htf-sh"><h2>Bewerk {editId}</h2><div className="htf-rule" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="field">
              <label className="lbl">Kleur <span style={{ color: 'var(--muted)' }}>(optioneel)</span></label>
              <input className="inp" value={editForm.color} placeholder="bv. Rood, #C41E1E" onChange={(e) => setEditForm((p) => ({ ...p, color: e.target.value }))} />
            </div>
            <div className="field">
              <label className="lbl">Notities <span style={{ color: 'var(--muted)' }}>(optioneel)</span></label>
              <input className="inp" value={editForm.notes} placeholder="Interne notitie…" onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-green btn-sm" onClick={saveEdit}>Opslaan</button>
            <button className="btn btn-muted btn-sm" onClick={() => setEditId(null)}>Annuleren</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        {(['all', 'ebike', 'scooter', 'car', 'bus'] as const).map((t) => (
          <button key={t} className={`btn btn-sm ${filterType === t ? 'btn-red' : 'btn-muted'}`} onClick={() => setFilterType(t)}>
            {t === 'all' ? 'Alle types' : vehicleTypeLabel[t]}
          </button>
        ))}
        <div style={{ width: 1, background: 'var(--bdr)' }} />
        {(['all', 'ok', 'fault', 'hub', 'fix', 'ready'] as const).map((s) => (
          <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-red' : 'btn-muted'}`} onClick={() => setFilterStatus(s)}>
            {s === 'all' ? 'Alle statussen' : s}
          </button>
        ))}
        <input
          className="inp"
          placeholder="Zoek ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 160, height: 32, marginLeft: 'auto' }}
        />
      </div>

      <div className="htf-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Locatie</th>
              <th>Status</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => {
              const locName = MOCK_MODE ? MOCK_LOC_MAP[v.location_id]?.name : v.location?.name
              return (
                <tr key={v.id}>
                  <td>
                    <Link to={`/vehicles/${v.id}`} style={{ fontWeight: 600, color: 'var(--red)', textDecoration: 'none' }}>
                      {vehicleTypeIcon[v.type]} {v.id}
                    </Link>
                  </td>
                  <td>{vehicleTypeLabel[v.type]}</td>
                  <td style={{ fontSize: 13 }}>{locName}</td>
                  <td><VehicleBadge status={v.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}>Bewerken</button>
                      <button className="btn btn-muted btn-sm" onClick={() => retireVehicle(v.id)}>Pensioneren</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ padding: '8px 12px', fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, color: 'var(--muted)' }}>
          {filtered.length} van {vehicles.length} voertuigen
        </div>
      </div>
    </div>
  )
}

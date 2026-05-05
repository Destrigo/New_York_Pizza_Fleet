import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '@/components/Toast'
import { VehicleBadge } from '@/components/StatusBadge'
import { vehicleTypeIcon, vehicleTypeLabel } from '@/lib/utils'
import { MOCK_VEHICLES, MOCK_LOC_MAP } from '@/lib/mock'
import type { VehicleType, VehicleStatus } from '@/types'

export default function AdminVehicles() {
  const toast = useToast()
  const [filterType, setFilterType] = useState<VehicleType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<VehicleStatus | 'all'>('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ id: '', type: 'ebike', location_id: '' })

  const filtered = MOCK_VEHICLES.filter((v) =>
    (filterType === 'all' || v.type === filterType) &&
    (filterStatus === 'all' || v.status === filterStatus)
  )

  const addVehicle = () => {
    toast(`Voertuig ${form.id} toegevoegd (demo: niet persistent).`)
    setShowAdd(false)
    setForm({ id: '', type: 'ebike', location_id: '' })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">Voertuigbeheer</div>
          <div className="htf-sub">Admin · {MOCK_VEHICLES.length} voertuigen totaal</div>
        </div>
        <button className="btn btn-green" onClick={() => setShowAdd(true)}>+ Voertuig toevoegen</button>
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
                {Object.values(MOCK_LOC_MAP).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-green" onClick={addVehicle} disabled={!form.id || !form.location_id}>Toevoegen →</button>
            <button className="btn btn-muted" onClick={() => setShowAdd(false)}>Annuleren</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
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
              const loc = MOCK_LOC_MAP[v.location_id]
              return (
                <tr key={v.id}>
                  <td>
                    <Link to={`/vehicles/${v.id}`} style={{ fontWeight: 600, color: 'var(--red)', textDecoration: 'none' }}>
                      {vehicleTypeIcon[v.type]} {v.id}
                    </Link>
                  </td>
                  <td>{vehicleTypeLabel[v.type]}</td>
                  <td style={{ fontSize: 13 }}>{loc?.name}</td>
                  <td><VehicleBadge status={v.status} /></td>
                  <td>
                    <button className="btn btn-muted btn-sm" onClick={() => toast(`${v.id} buiten dienst gesteld (demo).`)}>
                      Pensioneren
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ padding: '8px 12px', fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, color: 'var(--muted)' }}>
          {filtered.length} van {MOCK_VEHICLES.length} voertuigen
        </div>
      </div>
    </div>
  )
}

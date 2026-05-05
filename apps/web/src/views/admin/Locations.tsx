import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { MOCK_LOCATIONS, MOCK_VEHICLES, MOCK_USERS } from '@/lib/mock'

export default function AdminLocations() {
  const toast = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', address: '', is_hub: false })

  const save = () => {
    toast(`Locatie "${form.name}" aangemaakt (demo: niet persistent).`)
    setShowAdd(false)
    setForm({ name: '', city: '', address: '', is_hub: false })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">Locatiebeheer</div>
          <div className="htf-sub">Admin · {MOCK_LOCATIONS.length} locaties</div>
        </div>
        <button className="btn btn-green" onClick={() => setShowAdd(true)}>+ Locatie toevoegen</button>
      </div>

      {showAdd && (
        <div className="htf-card htf-card-green" style={{ marginBottom: 24 }}>
          <div className="htf-sh"><h2>Nieuwe locatie</h2><div className="htf-rule" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field"><label className="lbl">Naam</label><input className="inp" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="field"><label className="lbl">Stad</label><input className="inp" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label className="lbl">Adres</label><input className="inp" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>
            <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.is_hub} onChange={(e) => setForm((p) => ({ ...p, is_hub: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--red)' }} />
              <label className="lbl" style={{ marginBottom: 0 }}>Hub locatie</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-green" onClick={save} disabled={!form.name || !form.city}>Opslaan →</button>
            <button className="btn btn-muted" onClick={() => setShowAdd(false)}>Annuleren</button>
          </div>
        </div>
      )}

      <div className="htf-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Stad</th>
              <th>Managers</th>
              <th>Voertuigen</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_LOCATIONS.map((loc) => {
              const managers = MOCK_USERS.filter((u) => u.location_id === loc.id && u.role === 'manager').map((u) => u.full_name).join(', ')
              const vCnt     = MOCK_VEHICLES.filter((v) => v.location_id === loc.id).length
              return (
                <tr key={loc.id}>
                  <td style={{ fontWeight: 600 }}>{loc.name}</td>
                  <td style={{ fontSize: 13 }}>{loc.city}</td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{managers || '—'}</td>
                  <td>{vCnt}</td>
                  <td>{loc.is_hub ? <span className="badge badge-gold">Hub</span> : <span className="badge badge-muted">Locatie</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

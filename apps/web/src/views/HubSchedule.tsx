import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { fmtDate } from '@/lib/utils'
import { MOCK_LOC_MAP, MOCK_USERS_MAP } from '@/lib/mock'
import { MOCK_MODE } from '@/lib/supabase'
import { useSchedules } from '@/hooks/useSchedules'
import { useUsers } from '@/hooks/useUsers'
import { useLocations } from '@/hooks/useLocations'
import { useVehicles } from '@/hooks/useVehicles'
import { useFaults } from '@/hooks/useFaults'
import type { PickupSchedule } from '@/types'

export default function HubSchedule() {
  const { user } = useAuth()
  const toast = useToast()
  const { schedules, loading, cancel, create } = useSchedules({})
  const { users: drivers } = useUsers({ role: 'driver' })
  const { locations: allLocations } = useLocations({})
  const { faults: openFaults } = useFaults({ status: ['open', 'in_progress', 'ready'] })
  const [fromLocId, setFromLocId] = useState('')
  const { vehicles: fromVehicles } = useVehicles({ locationId: fromLocId || undefined })
  const [showForm, setShowForm]   = useState(false)
  const [filterDriver, setFilterDriver] = useState<string>('all')

  const [form, setForm] = useState({
    fault_id: '', driver_id: '', from_location_id: '', to_location_id: '',
    scheduled_date: '', time_from: '', time_to: '', vehicle_id: '', notes: '',
  })

  if (!user) return null

  const filtered = filterDriver === 'all'
    ? schedules
    : schedules.filter((s) => s.driver_id === filterDriver)

  const grouped = filtered.reduce((acc, s) => {
    const d = s.scheduled_date
    if (!acc[d]) acc[d] = []
    acc[d].push(s)
    return acc
  }, {} as Record<string, PickupSchedule[]>)

  const getDriverName = (s: PickupSchedule) =>
    MOCK_MODE ? MOCK_USERS_MAP[s.driver_id]?.full_name : s.driver?.full_name

  const getFromName = (s: PickupSchedule) =>
    MOCK_MODE ? MOCK_LOC_MAP[s.from_location_id]?.name : s.from_location?.name

  const getToName = (s: PickupSchedule) =>
    MOCK_MODE ? MOCK_LOC_MAP[s.to_location_id]?.name : s.to_location?.name

  const submitSchedule = async () => {
    const { error } = await create({
      fault_id: form.fault_id || null,
      driver_id: form.driver_id,
      assigned_by: user.id,
      from_location_id: form.from_location_id,
      to_location_id: form.to_location_id,
      scheduled_date: form.scheduled_date,
      time_from: form.time_from,
      time_to: form.time_to,
      vehicle_id: form.vehicle_id,
      notes: form.notes || null,
    })
    if (error) {
      toast('Aanmaken mislukt.', 'error')
      return
    }
    setShowForm(false)
    setForm({ fault_id: '', driver_id: '', from_location_id: '', to_location_id: '', scheduled_date: '', time_from: '', time_to: '', vehicle_id: '', notes: '' })
    toast('Ophaalmoment aangemaakt. Chauffeur en locatiebeheerder ontvangen een notificatie.')
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit ophaalmoment wilt annuleren?')) return
    await cancel(id)
    toast('Ophaalmoment geannuleerd.')
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">Ophaalplanning</div>
          <div className="htf-sub">Hub schedule · Alle chauffeurs</div>
        </div>
        <button className="btn btn-green" onClick={() => setShowForm(true)}>+ Ophaalmoment aanmaken</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`btn btn-sm ${filterDriver === 'all' ? 'btn-red' : 'btn-muted'}`} onClick={() => setFilterDriver('all')}>Alle chauffeurs</button>
        {drivers.map((d) => (
          <button key={d.id} className={`btn btn-sm ${filterDriver === d.id ? 'btn-red' : 'btn-muted'}`} onClick={() => setFilterDriver(d.id)}>
            {d.full_name}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="htf-card htf-card-green" style={{ marginBottom: 24 }}>
          <div className="htf-sh"><h2>Nieuw ophaalmoment</h2><div className="htf-rule" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label className="lbl">Chauffeur</label>
              <select className="sel" value={form.driver_id} onChange={(e) => setForm((p) => ({ ...p, driver_id: e.target.value }))}>
                <option value="">— Kies chauffeur —</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Voertuig ID</label>
              {fromVehicles.length > 0 ? (
                <select className="sel" value={form.vehicle_id} onChange={(e) => setForm((p) => ({ ...p, vehicle_id: e.target.value }))}>
                  <option value="">— Kies voertuig —</option>
                  {fromVehicles.map((v) => <option key={v.id} value={v.id}>{v.id} · {v.type} · {v.status}</option>)}
                </select>
              ) : (
                <input className="inp" placeholder="bv. F-001" value={form.vehicle_id} onChange={(e) => setForm((p) => ({ ...p, vehicle_id: e.target.value }))} />
              )}
            </div>
            <div className="field">
              <label className="lbl">Datum</label>
              <input className="inp" type="date" value={form.scheduled_date} onChange={(e) => setForm((p) => ({ ...p, scheduled_date: e.target.value }))} />
            </div>
            <div className="field">
              <label className="lbl">Tijdvenster</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="inp" type="time" value={form.time_from} onChange={(e) => setForm((p) => ({ ...p, time_from: e.target.value }))} />
                <input className="inp" type="time" value={form.time_to} onChange={(e) => setForm((p) => ({ ...p, time_to: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label className="lbl">Van locatie</label>
              <select className="sel" value={form.from_location_id} onChange={(e) => {
                const id = e.target.value
                setForm((p) => ({ ...p, from_location_id: id, vehicle_id: '' }))
                setFromLocId(id)
              }}>
                <option value="">— Kies locatie —</option>
                {allLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Naar locatie</label>
              <select className="sel" value={form.to_location_id} onChange={(e) => setForm((p) => ({ ...p, to_location_id: e.target.value }))}>
                <option value="">— Kies locatie —</option>
                {allLocations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Gekoppelde storing <span style={{ color: 'var(--muted)' }}>(optioneel)</span></label>
              <select className="sel" value={form.fault_id} onChange={(e) => setForm((p) => ({ ...p, fault_id: e.target.value }))}>
                <option value="">— Geen specifieke storing —</option>
                {openFaults.map((f) => (
                  <option key={f.id} value={f.id}>{f.vehicle_id} · {f.fault_type}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="lbl">Notities</label>
              <textarea className="txa" style={{ minHeight: 60 }} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-green" onClick={submitSchedule} disabled={!form.driver_id || !form.vehicle_id || !form.scheduled_date}>
              Aanmaken →
            </button>
            <button className="btn btn-muted" onClick={() => setShowForm(false)}>Annuleren</button>
          </div>
        </div>
      )}

      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => (
        <div key={date} style={{ marginBottom: 24 }}>
          <div className="htf-sh">
            <h2>{fmtDate(date)}</h2>
            <div className="htf-rule" />
          </div>
          {items.map((s) => (
            <div key={s.id} className="sched-item" style={{ borderLeftColor: s.status === 'cancelled' ? 'var(--muted)' : s.status === 'completed' ? 'var(--green)' : 'var(--gold)', opacity: s.status === 'cancelled' ? 0.6 : 1 }}>
              <div className="sched-time">{s.time_from}<br />{s.time_to}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{s.vehicle_id} · {getDriverName(s)}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{getFromName(s)} → {getToName(s)}</div>
                {s.notes && <div style={{ fontSize: 12, color: 'var(--ink)', marginTop: 4, fontStyle: 'italic' }}>{s.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {s.status === 'planned' && (
                  <button className="btn btn-muted btn-sm" onClick={() => handleCancel(s.id)}>Annuleren</button>
                )}
                <span className={`badge ${s.status === 'completed' ? 'badge-green' : s.status === 'cancelled' ? 'badge-muted' : 'badge-gold'}`}>
                  {s.status === 'planned' ? 'Gepland' : s.status === 'completed' ? 'Voltooid' : 'Geannuleerd'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}

      {Object.keys(grouped).length === 0 && (
        <div className="htf-card" style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
          Geen ophaalafspraken gevonden.
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useToast } from '@/components/Toast'
import { roleLabel } from '@/lib/utils'
import { MOCK_MODE } from '@/lib/supabase'
import { useUsers } from '@/hooks/useUsers'
import { useLocations } from '@/hooks/useLocations'
import type { Role } from '@/types'

export default function AdminUsers() {
  const toast = useToast()
  const { users, loading } = useUsers()
  const { locations } = useLocations({})
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState({ email: '', full_name: '', role: 'manager' as Role, location_id: '' })

  const deactivate = (id: string, name: string) => {
    if (!confirm(`${name} deactiveren? De gebruiker kan daarna niet meer inloggen.`)) return
    toast('Gebruiker gedeactiveerd' + (MOCK_MODE ? ' (demo: niet persistent).' : '.'))
  }

  const sendInvite = () => {
    toast(`Uitnodiging verstuurd naar ${invite.email}.`)
    setShowInvite(false)
    setInvite({ email: '', full_name: '', role: 'manager', location_id: '' })
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Laden…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">Gebruikersbeheer</div>
          <div className="htf-sub">Admin · Supervisor only · {users.length} gebruikers</div>
        </div>
        <button className="btn btn-green" onClick={() => setShowInvite(true)}>+ Gebruiker uitnodigen</button>
      </div>

      {showInvite && (
        <div className="htf-card htf-card-green" style={{ marginBottom: 24 }}>
          <div className="htf-sh"><h2>Nieuwe gebruiker uitnodigen</h2><div className="htf-rule" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label className="lbl">E-mailadres</label>
              <input className="inp" type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="field">
              <label className="lbl">Volledige naam</label>
              <input className="inp" value={invite.full_name} onChange={(e) => setInvite((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="field">
              <label className="lbl">Rol</label>
              <select className="sel" value={invite.role} onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value as Role }))}>
                {(['manager', 'mechanic', 'driver', 'supervisor'] as const).map((r) => (
                  <option key={r} value={r}>{roleLabel[r]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Locatie</label>
              <select className="sel" value={invite.location_id} onChange={(e) => setInvite((p) => ({ ...p, location_id: e.target.value }))}>
                <option value="">— Kies locatie —</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-green" onClick={sendInvite} disabled={!invite.email || !invite.full_name}>Uitnodiging sturen →</button>
            <button className="btn btn-muted" onClick={() => setShowInvite(false)}>Annuleren</button>
          </div>
        </div>
      )}

      <div className="htf-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Naam</th>
              <th>Rol</th>
              <th>Locatie</th>
              <th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const locName = MOCK_MODE ? locations.find((l) => l.id === u.location_id)?.name : u.location?.name
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td><span className="badge badge-muted">{roleLabel[u.role]}</span></td>
                  <td style={{ fontSize: 13 }}>{locName ?? u.location_id}</td>
                  <td>
                    <button className="btn btn-muted btn-sm" onClick={() => deactivate(u.id, u.full_name)}>Deactiveren</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

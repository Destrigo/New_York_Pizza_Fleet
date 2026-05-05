import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { roleLabel } from '@/lib/utils'
import { MOCK_MODE } from '@/lib/supabase'
import { MOCK_LOC_MAP } from '@/lib/mock'

export default function Profile() {
  const { user } = useAuth()
  const toast = useToast()

  const [name, setName]         = useState(user?.full_name ?? '')
  const [oldPw, setOldPw]       = useState('')
  const [newPw, setNewPw]       = useState('')
  const [saving, setSaving]     = useState(false)

  if (!user) return null

  const loc = MOCK_MODE ? MOCK_LOC_MAP[user.location_id] : user.location

  const saveProfile = async () => {
    setSaving(true)
    // In real mode: update users table + supabase auth password if newPw set
    await new Promise((r) => setTimeout(r, 600))
    setSaving(false)
    toast('Profiel opgeslagen.')
  }

  return (
    <div>
      <div className="htf-title">Profiel</div>
      <div className="htf-sub">{roleLabel[user.role]} · {loc?.name}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="htf-card">
          <div className="htf-sh"><h2>Persoonsgegevens</h2><div className="htf-rule" /></div>

          <div className="field">
            <label className="lbl">Volledige naam</label>
            <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label className="lbl">Rol</label>
            <input className="inp" value={roleLabel[user.role]} disabled style={{ opacity: 0.6 }} />
          </div>

          <div className="field">
            <label className="lbl">Locatie</label>
            <input className="inp" value={loc?.name ?? user.location_id} disabled style={{ opacity: 0.6 }} />
          </div>

          {!MOCK_MODE && (
            <>
              <div className="field">
                <label className="lbl">Huidig wachtwoord</label>
                <input className="inp" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
              </div>
              <div className="field">
                <label className="lbl">Nieuw wachtwoord</label>
                <input className="inp" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              </div>
            </>
          )}

          <button className="btn btn-red" onClick={saveProfile} disabled={saving || MOCK_MODE}>
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
          {MOCK_MODE && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
              Profiel bewerken werkt alleen met Supabase verbinding.
            </div>
          )}
        </div>

        <div className="htf-card htf-card-gold">
          <div className="htf-sh"><h2>Notificatie-instellingen</h2><div className="htf-rule" /></div>
          {[
            { key: 'fault_new',    label: 'Nieuwe storing gemeld' },
            { key: 'fault_update', label: 'Status storing gewijzigd' },
            { key: 'pickup',       label: 'Ophaalmoment gepland' },
            { key: 'chat',         label: 'Nieuw chatbericht' },
            { key: 'vehicle',      label: 'Voertuig toegewezen' },
          ].map((pref) => (
            <div key={pref.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5E6CC' }}>
              <span style={{ fontSize: 14 }}>{pref.label}</span>
              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--red)', width: 18, height: 18 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

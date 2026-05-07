import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/Toast'
import { roleLabel } from '@/lib/utils'
import { MOCK_MODE, supabase } from '@/lib/supabase'
import { MOCK_LOC_MAP } from '@/lib/mock'

export default function Profile() {
  const { user } = useAuth()
  const toast = useToast()

  const [name, setName]     = useState(user?.full_name ?? '')
  const [newPw, setNewPw]   = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const loc = MOCK_MODE ? MOCK_LOC_MAP[user.location_id] : user.location

  const saveProfile = async () => {
    setSaving(true)
    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 500))
        toast('Profiel opgeslagen (demo).')
        setSaving(false)
        return
      }
      await supabase!.from('users').update({ full_name: name }).eq('id', user.id)
      if (newPw.length >= 6) {
        await supabase!.auth.updateUser({ password: newPw })
      }
      setNewPw('')
      toast('Profiel opgeslagen.')
    } catch {
      toast('Opslaan mislukt.', 'error')
    }
    setSaving(false)
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
            <div className="field">
              <label className="lbl">Nieuw wachtwoord <span style={{ color: 'var(--muted)' }}>(optioneel · min. 6 tekens)</span></label>
              <input className="inp" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Laat leeg om niet te wijzigen" />
            </div>
          )}

          <button
            className="btn btn-red"
            onClick={saveProfile}
            disabled={saving || (!name.trim())}
            style={{ marginTop: 4 }}
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
          {MOCK_MODE && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
              Naam-wijzigingen worden opgeslagen zodra Supabase is verbonden.
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
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
            Instellingen worden opgeslagen per sessie.
          </div>
        </div>
      </div>
    </div>
  )
}

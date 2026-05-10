import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useToast } from '@/components/Toast'
import { MOCK_MODE, supabase } from '@/lib/supabase'
import { MOCK_LOC_MAP } from '@/lib/mock'

const NOTIF_PREFS_KEY = 'htf_notif_prefs'

type PrefKey = 'fault_new' | 'fault_update' | 'pickup' | 'chat' | 'vehicle'

const loadPrefs = (): Record<PrefKey, boolean> => {
  try {
    const stored = localStorage.getItem(NOTIF_PREFS_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* */ }
  return { fault_new: true, fault_update: true, pickup: true, chat: true, vehicle: true }
}

export default function Profile() {
  const { user } = useAuth()
  const { t } = useI18n()
  const toast = useToast()

  const [name, setName]     = useState(user?.full_name ?? '')
  const [newPw, setNewPw]   = useState('')
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs]   = useState<Record<PrefKey, boolean>>(loadPrefs)

  if (!user) return null

  const loc = MOCK_MODE ? MOCK_LOC_MAP[user.location_id] : user.location

  const NOTIF_ITEMS: { key: PrefKey; label: string }[] = [
    { key: 'fault_new',    label: t('notifKey_fault_new') },
    { key: 'fault_update', label: t('notifKey_fault_update') },
    { key: 'pickup',       label: t('notifKey_pickup') },
    { key: 'chat',         label: t('notifKey_chat') },
    { key: 'vehicle',      label: t('notifKey_vehicle') },
  ]

  const saveProfile = async () => {
    setSaving(true)
    try {
      if (MOCK_MODE) {
        await new Promise((r) => setTimeout(r, 500))
        toast(t('toastProfileSavedDemo'))
        setSaving(false)
        return
      }
      await supabase!.from('users').update({ full_name: name }).eq('id', user.id)
      if (newPw.length >= 6) {
        await supabase!.auth.updateUser({ password: newPw })
      }
      setNewPw('')
      toast(t('toastProfileSaved'))
    } catch {
      toast(t('toastSaveFailed'), 'error')
    }
    setSaving(false)
  }

  return (
    <div>
      <div className="htf-title">{t('profileTitle')}</div>
      <div className="htf-sub">{t(`role_${user.role}` as Parameters<typeof t>[0])} · {loc?.name}</div>

      <div className="grid-2">
        <div className="htf-card">
          <div className="htf-sh"><h2>{t('personalData')}</h2><div className="htf-rule" /></div>

          <div className="field">
            <label className="lbl">{t('fullName')}</label>
            <input className="inp" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label className="lbl">{t('roleLabel')}</label>
            <input className="inp" value={t(`role_${user.role}` as Parameters<typeof t>[0])} disabled style={{ opacity: 0.6 }} />
          </div>

          <div className="field">
            <label className="lbl">{t('locationLabel')}</label>
            <input className="inp" value={loc?.name ?? user.location_id} disabled style={{ opacity: 0.6 }} />
          </div>

          {!MOCK_MODE && (
            <div className="field">
              <label className="lbl">{t('newPassword')} <span style={{ color: 'var(--muted)' }}>{t('passwordHint')}</span></label>
              <input className="inp" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder={t('passwordPH')} />
            </div>
          )}

          <button
            className="btn btn-red"
            onClick={saveProfile}
            disabled={saving || (!name.trim())}
            style={{ marginTop: 4 }}
          >
            {saving ? t('saving') : t('save')}
          </button>
          {MOCK_MODE && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
              {t('mockNote')}
            </div>
          )}
        </div>

        <div className="htf-card htf-card-gold">
          <div className="htf-sh"><h2>{t('notifSettings')}</h2><div className="htf-rule" /></div>
          {NOTIF_ITEMS.map((item) => (
            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F5E6CC' }}>
              <span style={{ fontSize: 14 }}>{item.label}</span>
              <input
                type="checkbox"
                checked={prefs[item.key]}
                onChange={(e) => {
                  const next = { ...prefs, [item.key]: e.target.checked }
                  setPrefs(next)
                  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next))
                }}
                style={{ accentColor: 'var(--red)', width: 18, height: 18 }}
              />
            </div>
          ))}
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
            {t('prefsLocal')}
          </div>
        </div>
      </div>
    </div>
  )
}

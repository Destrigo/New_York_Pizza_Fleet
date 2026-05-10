import { useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useToast } from '@/components/Toast'
import { MOCK_MODE, supabase } from '@/lib/supabase'
import { useLocations } from '@/hooks/useLocations'
import { useVehicles } from '@/hooks/useVehicles'
import { useUsers } from '@/hooks/useUsers'

export default function AdminLocations() {
  const { t } = useI18n()
  const toast = useToast()
  const { locations, loading } = useLocations({})
  const { vehicles } = useVehicles()
  const { users } = useUsers()
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', address: '', is_hub: false })

  const save = async () => {
    if (MOCK_MODE) {
      toast(`"${form.name}" ${t('toastLocationCreatedDemoSuffix')}`)
    } else {
      await supabase!.from('locations').insert({
        name: form.name,
        city: form.city,
        address: form.address,
        is_hub: form.is_hub,
      })
      toast(`"${form.name}" ${t('toastLocationCreatedSuffix')}`)
    }
    setShowAdd(false)
    setForm({ name: '', city: '', address: '', is_hub: false })
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">{t('locationMgmt')}</div>
          <div className="htf-sub">Admin · {locations.length} {t('locationsSuffix')}</div>
        </div>
        <button className="btn btn-green" onClick={() => setShowAdd(true)}>{t('addLocation')}</button>
      </div>

      {showAdd && (
        <div className="htf-card htf-card-green" style={{ marginBottom: 24 }}>
          <div className="htf-sh"><h2>{t('newLocation')}</h2><div className="htf-rule" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field"><label className="lbl">{t('nameLabel')}</label><input className="inp" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div className="field"><label className="lbl">{t('cityLabel')}</label><input className="inp" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label className="lbl">{t('addressLabel')}</label><input className="inp" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></div>
            <div className="field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={form.is_hub} onChange={(e) => setForm((p) => ({ ...p, is_hub: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--red)' }} />
              <label className="lbl" style={{ marginBottom: 0 }}>{t('hubLocationLabel')}</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-green" onClick={save} disabled={!form.name || !form.city}>{t('create')}</button>
            <button className="btn btn-muted" onClick={() => setShowAdd(false)}>{t('cancel')}</button>
          </div>
        </div>
      )}

      <div className="htf-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('colName')}</th>
              <th>{t('cityLabel')}</th>
              <th>{t('colManagers')}</th>
              <th>{t('vehicles')}</th>
              <th>{t('colType')}</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => {
              const managers = users
                .filter((u) => u.location_id === loc.id && u.role === 'manager')
                .map((u) => u.full_name)
                .join(', ')
              const vCnt = vehicles.filter((v) => v.location_id === loc.id).length
              return (
                <tr key={loc.id}>
                  <td style={{ fontWeight: 600 }}>{loc.name}</td>
                  <td style={{ fontSize: 13 }}>{loc.city}</td>
                  <td style={{ fontSize: 13, color: 'var(--muted)' }}>{managers || '—'}</td>
                  <td>{vCnt}</td>
                  <td>{loc.is_hub ? <span className="badge badge-gold">Hub</span> : <span className="badge badge-muted">{t('colLocation')}</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

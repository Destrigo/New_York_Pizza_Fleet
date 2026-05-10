import { useState } from 'react'
import { useI18n } from '@/context/I18nContext'
import { useToast } from '@/components/Toast'
import { roleLabel, exportCsv } from '@/lib/utils'
import { MOCK_MODE, supabase } from '@/lib/supabase'
import { useUsers } from '@/hooks/useUsers'
import { useLocations } from '@/hooks/useLocations'
import type { Role } from '@/types'

export default function AdminUsers() {
  const { t } = useI18n()
  const toast = useToast()
  const { users, loading } = useUsers()
  const { locations } = useLocations({})
  const [showInvite, setShowInvite] = useState(false)
  const [invite, setInvite] = useState({ email: '', full_name: '', role: 'manager' as Role, location_id: '' })
  const [inviting, setInviting]     = useState(false)
  const [search, setSearch]         = useState('')
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all')

  const deactivate = async (id: string, name: string) => {
    if (!confirm(`${name} ${t('confirmDeactivateSuffix')}`)) return
    if (MOCK_MODE) {
      toast(t('toastDeactivatedDemo'))
      return
    }
    const { error } = await supabase!.functions.invoke('admin-user', {
      body: { action: 'deactivate', user_id: id },
    })
    if (error) { toast(t('toastDeactivateFailed'), 'error'); return }
    toast(`${name} ${t('toastDeactivatedSuffix')}`)
  }

  const sendInvite = async () => {
    if (!invite.email || !invite.full_name) return
    setInviting(true)
    if (MOCK_MODE) {
      await new Promise((r) => setTimeout(r, 600))
      toast(`${t('toastInviteSentToPrefix')} ${invite.email} (demo).`)
      setShowInvite(false)
      setInvite({ email: '', full_name: '', role: 'manager', location_id: '' })
      setInviting(false)
      return
    }
    const { error } = await supabase!.functions.invoke('admin-user', {
      body: {
        action: 'invite',
        email: invite.email,
        full_name: invite.full_name,
        role: invite.role,
        location_id: invite.location_id || null,
      },
    })
    setInviting(false)
    if (error) { toast(`${t('toastInviteFailedPrefix')} ${error.message}`, 'error'); return }
    toast(`${t('toastInviteSentToPrefix')} ${invite.email}.`)
    setShowInvite(false)
    setInvite({ email: '', full_name: '', role: 'manager', location_id: '' })
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>{t('loading')}</div>

  const filteredUsers = users
    .filter((u) => filterRole === 'all' || u.role === filterRole)
    .filter((u) => !search || u.full_name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">{t('userMgmt')}</div>
          <div className="htf-sub">{t('userMgmtSub')} · {users.length} {t('users')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => exportCsv(
              filteredUsers.map((u) => {
                const locName = u.location?.name ?? u.location_id
                return { name: u.full_name, role: roleLabel[u.role], location: locName }
              }),
              `users-${new Date().toISOString().split('T')[0]}.csv`
            )}
          >{t('csv')}</button>
          <button className="btn btn-green" onClick={() => setShowInvite(true)}>{t('inviteUser')}</button>
        </div>
      </div>

      {showInvite && (
        <div className="htf-card htf-card-green" style={{ marginBottom: 24 }}>
          <div className="htf-sh"><h2>{t('inviteFormTitle')}</h2><div className="htf-rule" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label className="lbl">{t('emailLabel')}</label>
              <input className="inp" type="email" value={invite.email} onChange={(e) => setInvite((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="field">
              <label className="lbl">{t('fullName')}</label>
              <input className="inp" value={invite.full_name} onChange={(e) => setInvite((p) => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="field">
              <label className="lbl">{t('roleLabel')}</label>
              <select className="sel" value={invite.role} onChange={(e) => setInvite((p) => ({ ...p, role: e.target.value as Role }))}>
                {(['manager', 'mechanic', 'driver', 'supervisor'] as const).map((r) => (
                  <option key={r} value={r}>{roleLabel[r]}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="lbl">{t('colLocation')} <span style={{ color: 'var(--muted)' }}>({t('locationOptional')})</span></label>
              <select className="sel" value={invite.location_id} onChange={(e) => setInvite((p) => ({ ...p, location_id: e.target.value }))}>
                <option value="">{t('chooseLocation')}</option>
                {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-green" onClick={sendInvite} disabled={!invite.email || !invite.full_name || inviting}>
              {inviting ? t('sending2') : t('sendInvite')}
            </button>
            <button className="btn btn-muted" onClick={() => setShowInvite(false)}>{t('cancel')}</button>
            {!MOCK_MODE && (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
                {t('inviteEmailNote')}
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['all', 'manager', 'mechanic', 'driver', 'supervisor'] as const).map((r) => (
          <button key={r} className={`btn btn-sm ${filterRole === r ? 'btn-red' : 'btn-muted'}`} onClick={() => setFilterRole(r)}>
            {r === 'all' ? t('allRoles') : roleLabel[r as Role]}
          </button>
        ))}
        <input
          className="inp"
          placeholder={t('searchName')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 200, height: 32, marginLeft: 'auto' }}
        />
      </div>

      <div className="htf-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('colName')}</th>
              <th>{t('colRole')}</th>
              <th>{t('colLocation')}</th>
              <th>{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const locName = u.location?.name ?? u.location_id
              return (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td><span className="badge badge-muted">{roleLabel[u.role]}</span></td>
                  <td style={{ fontSize: 13 }}>{locName ?? '—'}</td>
                  <td>
                    <button className="btn btn-muted btn-sm" onClick={() => deactivate(u.id, u.full_name)}>{t('deactivate')}</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ padding: '8px 12px', fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, color: 'var(--muted)' }}>
          {filteredUsers.length} {t('usersShowing')} {users.length} {t('users')}
        </div>
      </div>
    </div>
  )
}

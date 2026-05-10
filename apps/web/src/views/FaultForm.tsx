import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { useToast } from '@/components/Toast'
import { useVehicles } from '@/hooks/useVehicles'
import { useFaults } from '@/hooks/useFaults'
import { vehicleTypeLabel, vehicleTypeIcon, computeQualityScore } from '@/lib/utils'
import { MOCK_LOC_MAP } from '@/lib/mock'
import { MOCK_MODE, supabase } from '@/lib/supabase'
import { compressAll } from '@/lib/compress'

const FAULT_OPTS: Record<string, string[]> = {
  ebike:   ['Elektrische aandrijving', 'Pizza Box houder', 'Lekke band', 'Spaken', 'Sleutel kwijt', 'Overig'],
  scooter: ['Elektrische aandrijving', 'Pizza Box houder', 'Lekke band', 'Spaken', 'Sleutel kwijt', 'Overig'],
  car:     ['Start niet', 'Lekke band', 'Ongeluk', 'Onderhoud', 'Overig'],
  bus:     ['Start niet', 'Lekke band', 'Ongeluk', 'Onderhoud', 'Overig'],
}

const MAX_PHOTOS = 8

export default function FaultForm() {
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const toast    = useToast()

  const { vehicles } = useVehicles({ locationId: user?.location_id, excludeStatus: ['hub'] })
  const { faults: activeFaults } = useFaults({ locationId: user?.location_id, status: ['open', 'in_progress'] })

  const [vehicleId, setVehicleId] = useState('')
  const [faultType, setFaultType] = useState('')
  const [notes, setNotes]         = useState('')
  const [photos, setPhotos]       = useState<File[]>([])
  const [previews, setPreviews]   = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [warnDuplicate, setWarnDuplicate] = useState(false)

  useEffect(() => {
    const draft = sessionStorage.getItem('htf_fault_draft')
    if (draft) {
      const d = JSON.parse(draft)
      setVehicleId(d.vehicleId ?? '')
      setFaultType(d.faultType ?? '')
      setNotes(d.notes ?? '')
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('htf_fault_draft', JSON.stringify({ vehicleId, faultType, notes }))
  }, [vehicleId, faultType, notes])

  useEffect(() => {
    if (!vehicleId) { setWarnDuplicate(false); return }
    setWarnDuplicate(activeFaults.some((f) => f.vehicle_id === vehicleId))
  }, [vehicleId, activeFaults])

  if (!user) return null

  const loc      = MOCK_MODE ? MOCK_LOC_MAP[user.location_id] : user.location
  const selected = vehicles.find((v) => v.id === vehicleId)
  const opts     = selected ? (FAULT_OPTS[selected.type] ?? []) : []

  const handlePhotoAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw   = Array.from(e.target.files ?? [])
    const room  = MAX_PHOTOS - photos.length
    const slice = raw.slice(0, room)
    const compressed = await compressAll(slice)
    setPhotos((prev) => [...prev, ...compressed])
    const urls = compressed.map((f) => URL.createObjectURL(f))
    setPreviews((prev) => [...prev, ...urls])
    e.target.value = ''
  }

  const removePhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => { URL.revokeObjectURL(prev[i]); return prev.filter((_, idx) => idx !== i) })
  }

  const handleSubmit = async () => {
    if (!vehicleId || !faultType || photos.length < 2) return
    setUploading(true)
    setProgress(0)

    try {
      if (MOCK_MODE) {
        for (let i = 0; i <= photos.length; i++) {
          await new Promise((r) => setTimeout(r, 200))
          setProgress(Math.round((i / photos.length) * 100))
        }
        sessionStorage.removeItem('htf_fault_draft')
        setSubmitted(true)
        setUploading(false)
        return
      }

      const { data: fault, error: faultErr } = await supabase!
        .from('faults')
        .insert({ vehicle_id: vehicleId, location_id: user.location_id, reported_by: user.id, fault_type: faultType, notes: notes || null })
        .select()
        .single()

      if (faultErr || !fault) throw faultErr ?? new Error('Insert failed')

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const path = `${fault.id}/${Date.now()}_${file.name}`
        await supabase!.storage.from('fault-photos').upload(path, file, { contentType: file.type })
        await supabase!.from('fault_photos').insert({ fault_id: fault.id, storage_path: path, uploaded_by: user.id })
        setProgress(Math.round(((i + 1) / photos.length) * 100))
      }

      sessionStorage.removeItem('htf_fault_draft')
      setSubmitted(true)
    } catch {
      toast(t('toastErrorSubmit'), 'error')
    }

    setUploading(false)
  }

  const score = computeQualityScore({ photoCount: photos.length, notes, faultType, submittedSameDay: true })

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
        <div className="htf-title" style={{ marginBottom: 8 }}>{t('successTitle')}</div>
        <div style={{ color: 'var(--ink)', fontSize: 14, marginBottom: 4, maxWidth: 400, margin: '0 auto 8px' }}>
          {t('successBodyPre')} {user.full_name}, {t('successBodyPost')}
        </div>
        <div style={{ fontFamily: "'Barlow Condensed'", letterSpacing: 2, fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>
          {t('successTeam')}
        </div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, color: 'var(--gold)', marginBottom: 32 }}>
          {t('successScore')} {score.toFixed(1)} ★
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>{t('backToDashboard')}</button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="htf-title">{t('faultFormTitle')}</div>
          <div className="htf-sub">{t('faultFormSub')} · {loc?.name}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>{t('back')}</button>
      </div>

      <div className="htf-card htf-card-gold" style={{ marginBottom: 20, background: '#FFFBF0' }}>
        <div className="lbl" style={{ color: 'var(--gold)' }}>{t('instruction')}</div>
        <p style={{ fontSize: 13, lineHeight: 1.7 }}>{t('instructionText')}</p>
      </div>

      <div className="htf-card">
        <div className="field">
          <label className="lbl">{t('step1')}</label>
          <select className="sel" value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setFaultType('') }}>
            <option value="">{t('chooseVehicle')}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id} — {vehicleTypeIcon[v.type]} {vehicleTypeLabel[v.type]}
                {v.status === 'fault' ? ' ⚠' : ''}
              </option>
            ))}
          </select>
          {vehicles.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
              {t('noVehiclesAvailable')}
            </div>
          )}
        </div>

        {warnDuplicate && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 3, padding: '10px 14px', marginBottom: 14, fontSize: 13 }}>
            {t('activeFaultWarning')}
          </div>
        )}

        {selected && (
          <div className="field">
            <label className="lbl">{t('step2')}</label>
            <select className="sel" value={faultType} onChange={(e) => setFaultType(e.target.value)}>
              <option value="">{t('chooseFaultType')}</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}

        {faultType && (
          <div className="field">
            <label className="lbl">
              {t('step3')}{' '}
              <span style={{ color: 'var(--red)' }}>{t('minPhotos')}</span>
              <span style={{ color: 'var(--muted)' }}> · {t('maxPhotos')} {MAX_PHOTOS} · {t('autoCompressed')}</span>
            </label>
            <div className="photo-box" onClick={() => document.getElementById('photo-input')!.click()}>
              <input id="photo-input" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoAdd} />
              {previews.length === 0 ? (
                <>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                  <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {t('clickToAddPhotos')}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <img src={src} alt="" className="photo-thumb" />
                      <button
                        onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                        style={{ position: 'absolute', top: -6, right: -6, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >×</button>
                    </div>
                  ))}
                  {photos.length < MAX_PHOTOS && (
                    <div style={{ width: 64, height: 64, background: '#F5E6CC', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>+</div>
                  )}
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, marginTop: 4, fontFamily: "'Barlow Condensed'", letterSpacing: 1, color: photos.length >= 2 ? 'var(--green)' : 'var(--red)' }}>
              {photos.length >= 2 ? `✓ ${photos.length} ${t('photosSelected')}` : photos.length > 0 ? `${2 - photos.length} ${t('photosNeeded')}` : ''}
            </div>
          </div>
        )}

        {faultType && (
          <div className="field">
            <label className="lbl">
              {t('step4')}{' '}
              <span style={{ color: 'var(--muted)' }}>({t('optional')} · {t('raisesScore')})</span>
            </label>
            <textarea className="txa" placeholder={t('notesPH')} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        )}

        {uploading && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 1, color: 'var(--muted)', marginBottom: 4 }}>
              {t('uploadingPhotos')} {progress}%
            </div>
            <div style={{ height: 6, background: '#F5E6CC', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--green)', borderRadius: 3, transition: 'width 0.2s ease' }} />
            </div>
          </div>
        )}

        {faultType && photos.length > 0 && (
          <div style={{ background: 'var(--cream2)', borderRadius: 3, padding: '8px 12px', marginBottom: 16, fontSize: 12, fontFamily: "'Barlow Condensed'", letterSpacing: 1, color: 'var(--gold)' }}>
            {t('expectedScore')} <strong>{score.toFixed(1)} ★</strong>
            {score >= 6 && ` — ${t('scoreExcellent')}`}
            {score >= 4 && score < 6 && ` — ${t('scoreGood')}`}
            {score < 4 && ` — ${t('scoreAddMore')}`}
          </div>
        )}

        {faultType && (
          <button
            className="btn btn-red"
            style={{ width: '100%', padding: 14, fontSize: 15 }}
            onClick={handleSubmit}
            disabled={photos.length < 2 || uploading}
          >
            {uploading ? `${t('sending')} ${progress}%` : t('submitFault')}
          </button>
        )}
      </div>
    </div>
  )
}

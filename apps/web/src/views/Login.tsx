import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/context/I18nContext'
import { MOCK_MODE } from '@/lib/supabase'
import { DEMO_PROFILES } from '@/lib/mock'

export default function Login() {
  const { signIn, signInMock } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [mockId, setMockId]     = useState(DEMO_PROFILES[0].id)

  const handleReal = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error: err } = await signIn(email, password)
    setLoading(false)
    if (err) { setError(err); return }
    navigate('/')
  }

  const handleMock = () => {
    signInMock(mockId)
    navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div className="checkered" style={{ position: 'fixed', top: 0, left: 0, right: 0 }} />

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontFamily: "'Playfair Display'", fontSize: 48, fontWeight: 900, color: 'var(--red)', lineHeight: 1 }}>
          🍕 <em style={{ fontStyle: 'italic', color: 'var(--green)' }}>Hi Tom</em> Fleet
        </div>
        <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 8 }}>
          {t('vehicleSystem')}
        </div>
      </div>

      <div className="htf-card" style={{ width: '100%', maxWidth: 420 }}>
        {MOCK_MODE ? (
          <>
            <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
              {t('demoMode')}
            </div>
            <div className="field">
              <label className="lbl">{t('signingInAs')}</label>
              <select className="sel" value={mockId} onChange={(e) => setMockId(e.target.value)}>
                {DEMO_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-red" style={{ width: '100%', padding: 14 }} onClick={handleMock}>
              {t('loginBtn')}
            </button>
          </>
        ) : (
          <form onSubmit={handleReal}>
            <div style={{ fontFamily: "'Playfair Display'", fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--ink)' }}>
              {t('loginTitle')}
            </div>
            <div className="field">
              <label className="lbl">{t('emailLabel')}</label>
              <input
                className="inp" type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="lbl">{t('newPassword')}</label>
              <input
                className="inp" type="password" required autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12, fontFamily: "'Barlow Condensed'", letterSpacing: 1 }}>
                {error}
              </div>
            )}
            <button className="btn btn-red" style={{ width: '100%', padding: 14 }} disabled={loading}>
              {loading ? t('loggingIn') : t('loginBtn')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

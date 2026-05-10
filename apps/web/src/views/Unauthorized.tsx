import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'

export default function Unauthorized() {
  const { t } = useI18n()
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40,
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
      <div className="htf-title">{t('noAccess')}</div>
      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: 2, color: 'var(--muted)', margin: '8px 0 32px', maxWidth: 340 }}>
        {t('noAccessMsg')}
      </div>
      <Link to="/" className="btn btn-ghost">{t('backToDashboard')}</Link>
    </div>
  )
}

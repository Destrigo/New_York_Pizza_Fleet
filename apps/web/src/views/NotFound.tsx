import { Link } from 'react-router-dom'
import { useI18n } from '@/context/I18nContext'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: 40,
    }}>
      <div style={{ fontFamily: "'Playfair Display'", fontSize: 96, fontWeight: 900, color: 'var(--red)', lineHeight: 1 }}>404</div>
      <div style={{ fontFamily: "'Barlow Condensed'", fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)', margin: '12px 0 32px' }}>
        {t('pageNotFound')}
      </div>
      <Link to="/" className="btn btn-ghost">{t('backToDashboard')}</Link>
    </div>
  )
}

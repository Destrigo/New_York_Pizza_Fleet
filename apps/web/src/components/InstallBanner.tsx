import { useInstallPrompt } from '@/hooks/useInstallPrompt'

export default function InstallBanner() {
  const { canInstall, install, dismiss } = useInstallPrompt()
  if (!canInstall) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
      background: 'var(--red)', color: '#fff',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 20px',
      fontFamily: "'Barlow Condensed'", letterSpacing: 0.5, fontSize: 15,
    }}>
      <span style={{ fontSize: 22 }}>📱</span>
      <span style={{ flex: 1 }}>Installeer Hi Tom Fleet als app voor snellere toegang</span>
      <button
        onClick={install}
        style={{ background: '#fff', color: 'var(--red)', border: 'none', borderRadius: 3, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
      >
        Installeren
      </button>
      <button
        onClick={dismiss}
        style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 3, padding: '6px 10px', cursor: 'pointer', fontSize: 16 }}
        aria-label="Sluiten"
      >
        ×
      </button>
    </div>
  )
}

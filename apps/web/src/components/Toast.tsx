import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface ToastMsg { id: number; text: string; type: 'success' | 'error' }

interface ToastContextValue {
  toast: (text: string, type?: 'success' | 'error') => void
}

const ToastCtx = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msgs, setMsgs] = useState<ToastMsg[]>([])

  const toast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setMsgs((prev) => [...prev, { id, text, type }])
    setTimeout(() => setMsgs((prev) => prev.filter((m) => m.id !== id)), 5000)
  }, [])

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div style={{ position: 'fixed', top: 72, right: 20, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`htf-toast${m.type === 'error' ? ' htf-toast-err' : ''}`}
          >
            <div className="htf-toast-ttl">{m.type === 'error' ? 'Fout' : 'Bericht'}</div>
            <div className="htf-toast-msg">{m.text}</div>
            <button
              onClick={() => setMsgs((p) => p.filter((x) => x.id !== m.id))}
              style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx.toast
}

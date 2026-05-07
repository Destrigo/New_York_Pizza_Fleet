import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠</div>
          <div style={{ fontFamily: "'Playfair Display'", fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Er is iets misgegaan
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, fontFamily: 'monospace' }}>
            {this.state.error.message}
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => { this.setState({ error: null }); window.location.reload() }}
          >
            Pagina herladen
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

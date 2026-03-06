import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] React error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text)',
          background: 'var(--bg)',
          minHeight: '100vh'
        }}>
          <h2 style={{ color: 'var(--red)', marginBottom: '16px' }}>
            ⚠️ Something went wrong
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>
            The mining interface failed to load. You can still use other features.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              background: 'var(--accent)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reload Page
          </button>
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary style={{ color: 'var(--muted)', cursor: 'pointer' }}>
              Error details
            </summary>
            <pre style={{
              marginTop: '10px',
              padding: '16px',
              background: 'var(--bg3)',
              borderRadius: '8px',
              fontSize: '12px',
              overflow: 'auto',
              color: 'var(--red)'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

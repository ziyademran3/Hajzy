import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Hajzy ErrorBoundary caught error]:', error, errorInfo)
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo)
      } catch {}
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      try {
        this.props.onReset()
      } catch {}
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({
              error: this.state.error,
              retry: this.handleRetry,
              reload: this.handleReload,
            })
          : this.props.fallback
      }

      const isEn = (typeof document !== 'undefined' && document.documentElement.lang === 'en') || false

      return (
        <div
          role="alert"
          className="error-boundary-container"
          style={{
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            margin: '24px auto',
            maxWidth: '520px',
            textAlign: 'center',
            borderRadius: '16px',
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border-color, rgba(0,0,0,0.08))',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              fontSize: '28px',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              warning
            </span>
          </div>

          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-primary, #0f172a)',
              marginBottom: '8px',
            }}
          >
            {isEn ? 'Something went wrong' : 'حدث خطأ، حاول مرة أخرى'}
          </h3>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-secondary, #64748b)',
              marginBottom: '20px',
              lineHeight: 1.5,
              maxWidth: '380px',
            }}
          >
            {isEn
              ? 'An unexpected error occurred while processing your request. Please try again or refresh the page.'
              : 'نعتذر، حدث خطأ غير متوقع أثناء معالجة الصفحة. يمكنك المحاولة مرة أخرى أو إعادة تحميل الصفحة.'}
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleRetry}
              className="secondary-button"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {isEn ? 'Try Again' : 'إعادة المحاولة'}
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="primary-button"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {isEn ? 'Reload Page' : 'إعادة تحميل الصفحة'}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

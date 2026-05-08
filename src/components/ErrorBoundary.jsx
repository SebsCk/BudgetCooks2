import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: '1rem',
          padding: '2rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem' }}>🍳</div>
          <h2 style={{ color: '#3D4A2D' }}>Something went wrong</h2>
          <p style={{ color: '#666', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            style={{
              background: '#C1502A', color: '#fff', border: 'none',
              padding: '0.6rem 1.4rem', borderRadius: 8, cursor: 'pointer', fontWeight: 600
            }}
          >
            ← Back to Home
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

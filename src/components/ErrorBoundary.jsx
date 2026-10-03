import { Component } from 'react'

/**
 * Error boundary that catches unhandled render-time exceptions.
 *
 * Without this, uncaught React errors unmount the entire app tree and show
 * a blank page. This component catches those errors, displays them to the user,
 * and offers a recovery path (reload).
 *
 * @remarks
 * Must be a class component (React doesn't have a hook equivalent for error boundaries).
 * Wrap the app in this to prevent total app crashes from component errors.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="page">
          <div className="empty-state">
            <p>
              <strong>Something went wrong.</strong>
            </p>
            <p style={{ fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload the app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

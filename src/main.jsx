import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'

/**
 * Handle chunk loading errors from Vite code-splitting + Firebase Hosting SPA rewrite.
 *
 * Lazy-loaded modules (TensorFlow.js, html5-qrcode) reference chunk files with
 * content hashes. After a deploy, stale tabs may request old chunk hashes that
 * no longer exist. Firebase Hosting's SPA rewrite serves index.html (text/html)
 * for missing chunks, causing the module loader to reject "text/html is not valid
 * JavaScript". Auto-reloading fetches the current app shell and its matching
 * chunk hashes, avoiding a cryptic error page.
 */
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)

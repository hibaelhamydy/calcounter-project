import { useEffect, useId, useState } from 'react'

const START_TIMEOUT_MS = 10000

// Decodes barcodes in pure JS (no native browser API), so it works the same
// on iOS Safari as everywhere else - the browser's own BarcodeDetector API
// is Chromium/Android-and-macOS-only and isn't implemented in WebKit at all.
// html5-qrcode is dynamically imported (see barcodeScannerLoader.js, which
// callers should preload on mount so this import() resolves near-instantly -
// iOS Safari requires getUserMedia to fire close to the triggering tap or it
// can silently stall the permission prompt forever).
export default function BarcodeScanner({ onDetected, onClose }) {
  const reactId = useId()
  // html5-qrcode calls document.getElementById on this directly (confirmed
  // in its source), so React's colon-containing useId() value is technically
  // fine there - but strip the colons anyway to rule out any other code path
  // (a CSS selector, a regex) that might choke on them.
  const elementId = `barcode-scanner-${reactId.replace(/[^a-zA-Z0-9]/g, '')}`
  const [error, setError] = useState('')

  // html5-qrcode runs its own internal scan loop (its own timers/callbacks,
  // outside React's control), so a crash inside it is invisible to a React
  // error boundary and would otherwise just leave the screen blank with no
  // clue why. Catch anything that surfaces while this scanner is mounted and
  // show it directly, so a real error message replaces a silent hang.
  useEffect(() => {
    function handleWindowError(event) {
      setError(`Scanner crashed: ${event.error?.message || event.message || 'unknown error'}`)
    }
    function handleRejection(event) {
      setError(`Scanner crashed: ${event.reason?.message || event.reason || 'unknown error'}`)
    }
    window.addEventListener('error', handleWindowError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleWindowError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let detected = false
    let scanner = null
    let timeoutId = null

    function fail(message) {
      if (cancelled) return
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      setError(message)
      if (scanner) scanner.stop().then(() => scanner.clear()).catch(() => {})
    }

    async function start() {
      let Html5Qrcode
      let Html5QrcodeSupportedFormats
      try {
        ;({ Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode'))
      } catch (err) {
        fail(`Could not load the barcode scanner: ${err?.message || err}`)
        return
      }
      if (cancelled) return

      // Grocery products use linear 1D barcodes almost exclusively;
      // restricting the format list keeps each scan pass faster.
      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
      ]

      try {
        scanner = new Html5Qrcode(elementId, { formatsToSupport: formats, verbose: false })
      } catch (err) {
        fail(`Could not start the barcode scanner: ${err?.message || err}`)
        return
      }

      // Belt-and-suspenders: if the camera prompt never resolves (observed on
      // iOS Safari when getUserMedia fires too long after the user's tap),
      // don't leave the screen stuck on a blank camera view forever.
      timeoutId = setTimeout(() => {
        fail('The camera took too long to start. Try again, or enter details manually.')
      }, START_TIMEOUT_MS)

      try {
        scanner
          .start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 260, height: 160 } },
            (decodedText) => {
              if (cancelled || detected) return
              detected = true
              clearTimeout(timeoutId)
              onDetected(decodedText)
              scanner.stop().then(() => scanner.clear()).catch(() => {})
            },
            () => {
              // Fires continuously while no code is in frame - expected, not an error.
            },
          )
          .then(() => {
            if (cancelled) return
            clearTimeout(timeoutId)
          })
          .catch((err) => {
            if (cancelled) return
            const message = String(err)
            fail(
              message.includes('NotAllowed') || message.includes('Permission')
                ? 'Camera access was denied. Allow camera access to scan a barcode.'
                : `Could not access the camera: ${message}`,
            )
          })
      } catch (err) {
        fail(`Could not start scanning: ${err?.message || err}`)
      }
    }

    start()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      if (scanner) scanner.stop().then(() => scanner.clear()).catch(() => {})
    }
  }, [elementId, onDetected])

  return (
    <div className="barcode-scanner">
      {error ? (
        <div className="auth-error">{error}</div>
      ) : (
        <>
          <div id={elementId} className="barcode-video-wrap" />
          <p className="barcode-hint">Point your camera at a product barcode</p>
        </>
      )}
      <button type="button" className="secondary" onClick={onClose}>
        Cancel
      </button>
    </div>
  )
}

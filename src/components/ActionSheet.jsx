import { useEffect } from 'react'
import { preloadBarcodeScanner } from '../lib/barcodeScannerLoader'
import { isBarcodeScanningSupported } from '../lib/openFoodFacts'

export default function ActionSheet({ isOpen, onClose, onAction }) {
  const scanSupported = isBarcodeScanningSupported()

  useEffect(() => {
    if (isOpen && scanSupported) preloadBarcodeScanner()
  }, [isOpen, scanSupported])

  if (!isOpen) return null

  return (
    <>
      <div className="action-sheet-overlay" onClick={onClose} />
      <div className="action-sheet">
        <div className="action-sheet-header">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="action-sheet-grid">
          <button type="button" className="action-item" onClick={() => onAction('recipe')}>
            <div className="action-item-icon">📋</div>
            <span>Pick a recipe</span>
          </button>

          <button type="button" className="action-item" onClick={() => onAction('quickadd')}>
            <div className="action-item-icon">✏️</div>
            <span>Quick add food</span>
          </button>

          {scanSupported && (
            <button type="button" className="action-item" onClick={() => onAction('scan')}>
              <div className="action-item-icon">🔍</div>
              <span>Scan barcode</span>
            </button>
          )}

          <button type="button" className="action-item" onClick={() => onAction('photo')}>
            <div className="action-item-icon">📸</div>
            <span>Snap a photo</span>
          </button>
        </div>
      </div>
    </>
  )
}

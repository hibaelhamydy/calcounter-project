// Kicks off the html5-qrcode chunk download ahead of time (fire-and-forget)
// so that by the time someone actually taps "Scan a barcode", the module is
// already fetched and cached. Without this, the dynamic import() inside
// BarcodeScanner adds a network-fetch delay between the tap and the
// getUserMedia() call it triggers - and iOS Safari requires getUserMedia to
// fire almost immediately after a user gesture or it silently stalls the
// permission prompt forever (a blank, stuck camera view with no error).
// Call this as soon as a screen that might open the scanner mounts.
export function preloadBarcodeScanner() {
  import('html5-qrcode')
}

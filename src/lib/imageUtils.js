// Turns a user-picked photo into a small base64 data URL so it can be stored
// directly on the Firestore recipe document (this project has no Storage
// bucket configured). We downscale + re-encode as JPEG and back off quality
// / size until it comfortably fits under Firestore's 1MB document limit.

const MAX_DIMENSION = 1000
const MAX_BYTES = 700_000 // leaves plenty of room under the 1MB doc cap

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not read that image.'))
      img.src = reader.result
    }
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.readAsDataURL(file)
  })
}

export async function fileToCompressedDataUrl(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  const img = await loadImage(file)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  let quality = 0.82
  let dataUrl = canvas.toDataURL('image/jpeg', quality)

  while (dataUrl.length > MAX_BYTES && quality > 0.35) {
    quality -= 0.12
    dataUrl = canvas.toDataURL('image/jpeg', quality)
  }

  if (dataUrl.length > MAX_BYTES) {
    throw new Error('That image is too large even after compression. Try a smaller photo.')
  }

  return dataUrl
}

const MAX_SIZE_BYTES = 2 * 1024 * 1024  // 2 MB
const MAX_DIM = 1920

export async function compressImage(file: File): Promise<File> {
  // Skip if already small enough and not a huge dimension
  if (file.size <= MAX_SIZE_BYTES) return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM }
        else { width = Math.round((width * MAX_DIM) / height); height = MAX_DIM }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)

      // Try quality 0.85, fall back to 0.70 if still too big
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Canvas toBlob failed'))
          if (blob.size > MAX_SIZE_BYTES) {
            canvas.toBlob(
              (blob2) => resolve(blob2 ? new File([blob2], file.name, { type: 'image/jpeg' }) : new File([blob], file.name, { type: 'image/jpeg' })),
              'image/jpeg', 0.70
            )
          } else {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }))
          }
        },
        'image/jpeg', 0.85
      )
    }
    img.onerror = reject
    img.src = url
  })
}

export async function compressAll(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage))
}

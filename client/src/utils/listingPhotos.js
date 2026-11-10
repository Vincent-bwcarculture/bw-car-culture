export async function prepareListingPhoto(file) {
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
    throw new Error(`“${file.name}” is not a supported photo. Use JPEG, PNG or WebP.`);
  }
  if (file.size <= 900 * 1024) return file;
  const url = URL.createObjectURL(file);
  let image;
  try {
    image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not read “${file.name}”. Please export it as JPEG or choose another photo.`));
      img.src = url;
    });
    let edge = 1600;
    const canvas = document.createElement('canvas');
    for (const quality of [0.84, 0.74, 0.64, 0.54, 0.46]) {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Photo preparation is unavailable. Please try another browser.');
      context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (blob && blob.size <= 900 * 1024) return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: file.lastModified });
      edge = Math.round(edge * 0.8);
    }
    throw new Error(`Could not reduce “${file.name}” enough to upload. Please choose a smaller photo.`);
  } finally { URL.revokeObjectURL(url); }
}

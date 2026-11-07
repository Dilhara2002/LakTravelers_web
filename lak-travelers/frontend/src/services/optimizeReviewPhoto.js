// Browser-native processing; keep the existing accepted types and 5 MB input limit.
export async function optimizeReviewPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose JPG, PNG or WebP photos, maximum 5 MB each.');
  let image, objectURL;
  try {
    if (typeof createImageBitmap === 'function') image = await createImageBitmap(file, { imageOrientation: 'from-image' });
    else {
      objectURL = URL.createObjectURL(file);
      image = new Image(); image.src = objectURL;
      await image.decode();
    }
    const width = image.width || image.naturalWidth, height = image.height || image.naturalHeight;
    if (!width || !height) throw new Error('Invalid image');
    const scale = Math.min(1, 1600 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing unavailable');
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Image encoding failed')), 'image/jpeg', 0.82));
    if (blob.size > 5 * 1024 * 1024) throw new Error('Processed photo exceeds 5 MB');
    if (scale === 1 && blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: file.lastModified });
  } catch {
    throw new Error(`Could not prepare ${file.name}. Please select this photo again or try another JPG, PNG or WebP image.`);
  } finally {
    image?.close?.();
    if (objectURL) URL.revokeObjectURL(objectURL);
  }
}

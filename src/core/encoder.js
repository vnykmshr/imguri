export function toDataUri(buffer, mimeType) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('Expected buffer to be a Buffer instance');
  }

  if (!mimeType || typeof mimeType !== 'string') {
    throw new TypeError('Expected mimeType to be a non-empty string');
  }

  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

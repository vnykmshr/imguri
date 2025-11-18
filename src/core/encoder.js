/**
 * Core encoding logic for converting buffers to data URIs
 * Pure functions with no side effects
 */

/**
 * Convert a buffer to a base64 data URI
 * @param {Buffer} buffer - The buffer to encode
 * @param {string} mimeType - The MIME type of the data
 * @returns {string} Data URI string
 */
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

/**
 * Check if a buffer exceeds the size limit
 * @param {Buffer} buffer - The buffer to check
 * @param {number} sizeLimit - Maximum size in bytes
 * @returns {boolean} True if buffer exceeds limit
 */
export function exceedsSizeLimit(buffer, sizeLimit) {
  return buffer.length > sizeLimit;
}

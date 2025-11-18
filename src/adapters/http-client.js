/**
 * Adapter for fetching remote files via HTTP/HTTPS
 * Uses native fetch API (Node.js 18+)
 */

const DEFAULT_TIMEOUT = 20000; // 20 seconds

/**
 * Fetch metadata for a remote resource
 * @param {string} url - URL to fetch
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<{contentType: string, contentLength: number}>}
 */
export async function fetchMetadata(url, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    return { contentType, contentLength };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch a remote resource as a buffer
 * @param {string} url - URL to fetch
 * @param {number} timeout - Request timeout in milliseconds
 * @returns {Promise<{buffer: Buffer, contentType: string}>}
 */
export async function fetchBuffer(url, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType =
      response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return { buffer, contentType };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if a content type is an image
 * @param {string} contentType - Content type header value
 * @returns {boolean} True if content type indicates an image
 */
export function isImageContentType(contentType) {
  return /^image\//i.test(contentType);
}

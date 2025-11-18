/**
 * ImgUri - Modern image to data URI converter
 * Supports both local files and remote URLs
 */

import { toDataUri } from './core/encoder.js';
import {
  fileExists,
  getFileSize,
  getMimeType,
  readFileBuffer,
} from './adapters/file-reader.js';
import {
  fetchMetadata,
  fetchBuffer,
  isImageContentType,
} from './adapters/http-client.js';
import {
  getPathType,
  validateSize,
  validateImageContentType,
  validateFileExists,
  validateMimeType,
  DEFAULT_SIZE_LIMIT,
} from './validators/input-validator.js';

/**
 * Default options for encoding
 * @typedef {Object} EncodeOptions
 * @property {boolean} [force=false] - Override size limit
 * @property {number} [sizeLimit=4096] - Maximum size in bytes (default 4KB)
 * @property {number} [timeout=20000] - HTTP request timeout in milliseconds
 * @property {number} [concurrency=10] - Maximum concurrent operations
 */

/**
 * Result of encoding operation
 * @typedef {Object} EncodeResult
 * @property {string|null} data - Data URI or null if error
 * @property {Error|null} error - Error object or null if success
 */

/**
 * Encode a local file to data URI
 * @param {string} filePath - Path to local file
 * @param {EncodeOptions} options - Encoding options
 * @returns {Promise<string>} Data URI string
 * @private
 */
async function encodeLocalFile(filePath, options = {}) {
  const { force = false, sizeLimit = DEFAULT_SIZE_LIMIT } = options;

  // Check if file exists
  const exists = await fileExists(filePath);
  validateFileExists(exists, filePath);

  // Get and validate file size
  const size = await getFileSize(filePath);
  validateSize(size, sizeLimit, force);

  // Get and validate MIME type
  const mimeType = getMimeType(filePath);
  validateMimeType(mimeType, filePath);

  // Read file and encode
  const buffer = await readFileBuffer(filePath);
  return toDataUri(buffer, mimeType);
}

/**
 * Encode a remote URL to data URI
 * @param {string} url - Remote URL
 * @param {EncodeOptions} options - Encoding options
 * @returns {Promise<string>} Data URI string
 * @private
 */
async function encodeRemoteUrl(url, options = {}) {
  const { force = false, sizeLimit = DEFAULT_SIZE_LIMIT, timeout = 20000 } = options;

  // Fetch metadata first
  const { contentType, contentLength } = await fetchMetadata(url, timeout);

  // Validate content type
  validateImageContentType(contentType, url);

  // Validate size if content-length is available
  if (contentLength > 0) {
    validateSize(contentLength, sizeLimit, force);
  }

  // Fetch the actual content
  const { buffer, contentType: actualContentType } = await fetchBuffer(url, timeout);

  // Validate actual size
  validateSize(buffer.length, sizeLimit, force);

  // Encode to data URI
  return toDataUri(buffer, actualContentType);
}

/**
 * Encode a single path (file or URL) to data URI
 * @param {string} path - File path or URL
 * @param {EncodeOptions} options - Encoding options
 * @returns {Promise<string>} Data URI string
 */
export async function encodeSingle(path, options = {}) {
  const type = getPathType(path);

  if (type === 'file') {
    return await encodeLocalFile(path, options);
  } else {
    return await encodeRemoteUrl(path, options);
  }
}

/**
 * Encode multiple paths to data URIs with concurrency control
 * @param {string[]} paths - Array of file paths or URLs
 * @param {EncodeOptions} options - Encoding options
 * @returns {Promise<Map<string, EncodeResult>>} Map of path to result
 */
export async function encode(paths, options = {}) {
  const { concurrency = 10 } = options;

  // Normalize to array
  const pathArray = Array.isArray(paths) ? paths : [paths];

  // Remove duplicates while preserving order
  const uniquePaths = [...new Set(pathArray)];

  // Results map
  const results = new Map();

  // Process in batches with concurrency control
  for (let i = 0; i < uniquePaths.length; i += concurrency) {
    const batch = uniquePaths.slice(i, i + concurrency);

    const batchPromises = batch.map(async (path) => {
      try {
        const data = await encodeSingle(path, options);
        results.set(path, { data, error: null });
      } catch (error) {
        results.set(path, { data: null, error });
      }
    });

    await Promise.all(batchPromises);
  }

  return results;
}

/**
 * Legacy callback-based API for backward compatibility
 * @param {string|string[]} paths - File path(s) or URL(s)
 * @param {EncodeOptions|Function} options - Options or callback
 * @param {Function} [callback] - Callback function
 * @deprecated Use promise-based encode() instead
 */
export function encodeLegacy(paths, options, callback) {
  // Handle optional options parameter
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  encode(paths, options)
    .then((results) => {
      // Convert Map to plain object for legacy compatibility
      const resultsObject = {};
      for (const [path, result] of results) {
        resultsObject[path] = {
          err: result.error,
          data: result.data,
        };
      }
      callback(null, resultsObject);
    })
    .catch((error) => {
      callback(error);
    });
}

// Default export for CommonJS compatibility
export default {
  encode,
  encodeSingle,
  encodeLegacy,
};

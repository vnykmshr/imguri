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
} from './validators/input-validator.js';
import {
  DEFAULT_SIZE_LIMIT,
  DEFAULT_TIMEOUT,
  DEFAULT_CONCURRENCY,
} from './config.js';

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

async function encodeLocalFile(filePath, options = {}) {
  const { force = false, sizeLimit = DEFAULT_SIZE_LIMIT } = options;

  const exists = await fileExists(filePath);
  validateFileExists(exists, filePath);

  const size = await getFileSize(filePath);
  validateSize(size, sizeLimit, force);

  const mimeType = getMimeType(filePath);
  validateMimeType(mimeType, filePath);

  const buffer = await readFileBuffer(filePath);
  return toDataUri(buffer, mimeType);
}

async function encodeRemoteUrl(url, options = {}) {
  const {
    force = false,
    sizeLimit = DEFAULT_SIZE_LIMIT,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const { contentType, contentLength } = await fetchMetadata(url, timeout);
  validateImageContentType(contentType, url);

  if (contentLength > 0) {
    validateSize(contentLength, sizeLimit, force);
  }

  const { buffer, contentType: actualContentType } = await fetchBuffer(url, timeout);
  validateSize(buffer.length, sizeLimit, force);

  return toDataUri(buffer, actualContentType);
}

export async function encodeSingle(path, options = {}) {
  const type = getPathType(path);
  return type === 'file'
    ? encodeLocalFile(path, options)
    : encodeRemoteUrl(path, options);
}

export async function encode(paths, options = {}) {
  const { concurrency = DEFAULT_CONCURRENCY } = options;
  const pathArray = Array.isArray(paths) ? paths : [paths];
  const uniquePaths = [...new Set(pathArray)];
  const results = new Map();

  for (let i = 0; i < uniquePaths.length; i += concurrency) {
    const batch = uniquePaths.slice(i, i + concurrency);

    await Promise.all(
      batch.map(async (path) => {
        try {
          const data = await encodeSingle(path, options);
          results.set(path, { data, error: null });
        } catch (error) {
          results.set(path, { data: null, error });
        }
      })
    );
  }

  return results;
}

export function encodeLegacy(paths, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  encode(paths, options)
    .then((results) => {
      const resultsObject = {};
      for (const [path, result] of results) {
        resultsObject[path] = { err: result.error, data: result.data };
      }
      callback(null, resultsObject);
    })
    .catch((error) => callback(error));
}

export default { encode, encodeSingle, encodeLegacy };

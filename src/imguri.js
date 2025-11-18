import { resolve, normalize } from 'path';
import { toDataUri } from './core/encoder.js';
import {
  fileExists,
  getFileSize,
  getMimeType,
  readFileBuffer,
} from './adapters/file-reader.js';
import { fetchMetadata, fetchBuffer } from './adapters/http-client.js';
import { DEFAULT_SIZE_LIMIT, DEFAULT_TIMEOUT, DEFAULT_CONCURRENCY } from './config.js';

const URL_PATTERN = /^https?:\/\//i;

// Security: validate file path to prevent traversal attacks
function validatePath(filePath) {
  const normalized = normalize(filePath);

  // Block obvious path traversal patterns with .. (security risk)
  if (normalized.includes('..')) {
    throw new Error(`Invalid path: path traversal detected in "${filePath}"`);
  }

  // For relative paths, ensure they don't escape cwd after resolution
  // Absolute paths are allowed (explicit user intent)
  if (!normalized.startsWith('/') && !normalized.match(/^[A-Za-z]:\\/)) {
    const resolved = resolve(normalized);
    if (!resolved.startsWith(process.cwd())) {
      throw new Error(
        `Invalid path: relative path escapes cwd "${filePath}" -> "${resolved}"`
      );
    }
  }

  return normalized;
}

function isUrl(path) {
  return URL_PATTERN.test(path);
}

function isImage(contentType) {
  return /^image\//i.test(contentType);
}

async function encodeLocalFile(filePath, options = {}) {
  const { force = false, sizeLimit = DEFAULT_SIZE_LIMIT } = options;

  const safePath = validatePath(filePath);

  if (!(await fileExists(safePath))) {
    throw new Error(`File not found: ${filePath}`);
  }

  const size = await getFileSize(safePath);
  if (!force && size > sizeLimit) {
    throw new Error(
      `Size limit exceeded: ${size} > ${sizeLimit} bytes. Set options.force to override`
    );
  }

  const mimeType = getMimeType(safePath);
  if (!mimeType) {
    throw new Error(`Unable to determine MIME type for: ${filePath}`);
  }

  const buffer = await readFileBuffer(safePath);
  return toDataUri(buffer, mimeType);
}

async function encodeRemoteUrl(url, options = {}) {
  const {
    force = false,
    sizeLimit = DEFAULT_SIZE_LIMIT,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const { contentType, contentLength } = await fetchMetadata(url, timeout);

  if (!isImage(contentType)) {
    throw new Error(`Not an image. Content-Type: ${contentType}, URL: ${url}`);
  }

  if (contentLength > 0 && !force && contentLength > sizeLimit) {
    throw new Error(
      `Size limit exceeded: ${contentLength} > ${sizeLimit} bytes. Set options.force to override`
    );
  }

  const { buffer, contentType: actualContentType } = await fetchBuffer(url, timeout);

  if (!force && buffer.length > sizeLimit) {
    throw new Error(
      `Size limit exceeded: ${buffer.length} > ${sizeLimit} bytes. Set options.force to override`
    );
  }

  return toDataUri(buffer, actualContentType);
}

export async function encodeSingle(path, options = {}) {
  return isUrl(path) ? encodeRemoteUrl(path, options) : encodeLocalFile(path, options);
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
  // Deprecated: Use promise-based encode() instead
  console.warn(
    'encodeLegacy() is deprecated and will be removed in v2.0. Use encode() with promises/async-await instead.'
  );

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

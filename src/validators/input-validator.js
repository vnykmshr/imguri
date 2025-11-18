import { DEFAULT_SIZE_LIMIT } from '../config.js';

const URL_PATTERN = /^https?:\/\//i;

export function getPathType(path) {
  return URL_PATTERN.test(path) ? 'url' : 'file';
}

export function validateSize(size, limit = DEFAULT_SIZE_LIMIT, force = false) {
  if (!force && size > limit) {
    throw new Error(
      `Size limit exceeded: ${size} > ${limit} bytes. Set options.force to override`
    );
  }
}

export function validateImageContentType(contentType, url) {
  if (!/^image\//i.test(contentType)) {
    throw new Error(`Not an image. Content-Type: ${contentType}, URL: ${url}`);
  }
}

export function validateFileExists(exists, filePath) {
  if (!exists) {
    throw new Error(`File not found: ${filePath}`);
  }
}

export function validateMimeType(mimeType, filePath) {
  if (!mimeType) {
    throw new Error(`Unable to determine MIME type for: ${filePath}`);
  }
}

/**
 * Input validation logic
 * Pure validation functions
 */

const URL_PATTERN = /^https?:\/\//i;
const DEFAULT_SIZE_LIMIT = 4096; // 4KB

/**
 * Determine if a path is a URL or local file path
 * @param {string} path - Path to check
 * @returns {'url'|'file'} Type of path
 */
export function getPathType(path) {
  return URL_PATTERN.test(path) ? 'url' : 'file';
}

/**
 * Validate size against limit
 * @param {number} size - Size in bytes
 * @param {number} limit - Size limit in bytes
 * @param {boolean} force - Whether to override limit
 * @throws {Error} If size exceeds limit and force is false
 */
export function validateSize(size, limit = DEFAULT_SIZE_LIMIT, force = false) {
  if (!force && size > limit) {
    throw new Error(
      `Size limit exceeded: ${size} > ${limit} bytes. Set options.force to override`
    );
  }
}

/**
 * Validate that content type is an image
 * @param {string} contentType - Content type to validate
 * @param {string} url - URL being validated (for error message)
 * @throws {Error} If content type is not an image
 */
export function validateImageContentType(contentType, url) {
  if (!/^image\//i.test(contentType)) {
    throw new Error(`Not an image. Content-Type: ${contentType}, URL: ${url}`);
  }
}

/**
 * Validate that a file exists
 * @param {boolean} exists - Whether file exists
 * @param {string} filePath - File path (for error message)
 * @throws {Error} If file does not exist
 */
export function validateFileExists(exists, filePath) {
  if (!exists) {
    throw new Error(`File not found: ${filePath}`);
  }
}

/**
 * Validate MIME type
 * @param {string|null} mimeType - MIME type to validate
 * @param {string} filePath - File path (for error message)
 * @throws {Error} If MIME type is null or invalid
 */
export function validateMimeType(mimeType, filePath) {
  if (!mimeType) {
    throw new Error(`Unable to determine MIME type for: ${filePath}`);
  }
}

export { DEFAULT_SIZE_LIMIT };

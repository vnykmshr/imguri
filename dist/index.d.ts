/**
 * TypeScript definitions for imguri
 */

/**
 * Options for encoding operations
 */
export interface EncodeOptions {
  /**
   * Override size limit restriction
   * @default false
   */
  force?: boolean;

  /**
   * Maximum allowed file size in bytes
   * @default 4096
   */
  sizeLimit?: number;

  /**
   * HTTP request timeout in milliseconds
   * @default 20000
   */
  timeout?: number;

  /**
   * Maximum number of concurrent operations
   * @default 10
   */
  concurrency?: number;
}

/**
 * Result of an encoding operation
 */
export interface EncodeResult {
  /**
   * The encoded data URI, or null if encoding failed
   */
  data: string | null;

  /**
   * Error object if encoding failed, or null on success
   */
  error: Error | null;
}

/**
 * Legacy result format for backward compatibility
 * @deprecated
 */
export interface LegacyEncodeResult {
  /**
   * Error if encoding failed
   */
  err: Error | null;

  /**
   * The encoded data URI
   */
  data: string | undefined;
}

/**
 * Encode a single file or URL to a data URI
 * @param path - File path or URL to encode
 * @param options - Encoding options
 * @returns Promise resolving to data URI string
 * @throws Error if encoding fails
 */
export function encodeSingle(
  path: string,
  options?: EncodeOptions
): Promise<string>;

/**
 * Encode multiple files or URLs to data URIs
 * @param paths - Array of file paths or URLs, or single path
 * @param options - Encoding options
 * @returns Promise resolving to Map of paths to results
 */
export function encode(
  paths: string | string[],
  options?: EncodeOptions
): Promise<Map<string, EncodeResult>>;

/**
 * Legacy callback-based encoding (for backward compatibility)
 * @param paths - File path(s) or URL(s)
 * @param options - Encoding options or callback
 * @param callback - Callback function
 * @deprecated Use promise-based encode() instead
 */
export function encodeLegacy(
  paths: string | string[],
  options: EncodeOptions | ((error: Error | null, results?: Record<string, LegacyEncodeResult>) => void),
  callback?: (error: Error | null, results?: Record<string, LegacyEncodeResult>) => void
): void;

/**
 * Default export for CommonJS compatibility
 */
declare const _default: {
  encode: typeof encode;
  encodeSingle: typeof encodeSingle;
  encodeLegacy: typeof encodeLegacy;
};

export default _default;

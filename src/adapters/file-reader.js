/**
 * Adapter for reading local files
 * Uses modern fs/promises API
 */

import { readFile, access, stat } from 'fs/promises';
import { constants } from 'fs';
import { lookup } from 'mime-types';

/**
 * Check if a file exists and is readable
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if file exists and is readable
 */
export async function fileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 * @param {string} filePath - Path to the file
 * @returns {Promise<number>} File size in bytes
 */
export async function getFileSize(filePath) {
  const stats = await stat(filePath);
  return stats.size;
}

/**
 * Get MIME type for a file
 * @param {string} filePath - Path to the file
 * @returns {string|null} MIME type or null if not found
 */
export function getMimeType(filePath) {
  return lookup(filePath) || null;
}

/**
 * Read a file into a buffer
 * @param {string} filePath - Path to the file
 * @returns {Promise<Buffer>} File contents as buffer
 */
export async function readFileBuffer(filePath) {
  return await readFile(filePath);
}

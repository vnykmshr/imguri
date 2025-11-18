import { readFile, access, stat } from 'fs/promises';
import { constants } from 'fs';
import { lookup } from 'mime-types';

export async function fileExists(filePath) {
  try {
    await access(filePath, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getFileSize(filePath) {
  const stats = await stat(filePath);
  return stats.size;
}

export function getMimeType(filePath) {
  return lookup(filePath) || null;
}

export async function readFileBuffer(filePath) {
  return readFile(filePath);
}

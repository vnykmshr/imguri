/**
 * Integration tests for main API
 */

import { describe, it, expect } from 'vitest';
import { encodeSingle, encode } from './index.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Create a test fixture
const testDir = join(process.cwd(), 'test');
const testImagePath = join(testDir, 'test.png');

// Small 1x1 PNG image (red pixel)
const testPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
  0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
  0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08,
  0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
  0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

describe('encodeSingle', () => {
  it('should encode a local PNG file', async () => {
    // Setup: create test file
    await mkdir(testDir, { recursive: true });
    await writeFile(testImagePath, testPngBuffer);

    const result = await encodeSingle(testImagePath);

    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(result.length).toBeGreaterThan(50);
  });

  it('should throw for non-existent file', async () => {
    await expect(encodeSingle(join(testDir, 'nonexistent.png'))).rejects.toThrow(
      'File not found'
    );
  });

  it('should throw for file without MIME type', async () => {
    const unknownFile = join(testDir, 'test.unknown');
    await writeFile(unknownFile, 'test content');

    await expect(encodeSingle(unknownFile)).rejects.toThrow(
      'Unable to determine MIME type'
    );
  });

  it('should enforce size limit', async () => {
    // Create a file larger than 4KB
    const largeFile = join(testDir, 'large.png');
    await writeFile(largeFile, Buffer.alloc(5000));

    await expect(encodeSingle(largeFile)).rejects.toThrow('Size limit exceeded');
  });

  it('should allow overriding size limit with force option', async () => {
    const largeFile = join(testDir, 'large.png');
    await writeFile(largeFile, Buffer.alloc(5000));

    await expect(encodeSingle(largeFile, { force: true })).resolves.toMatch(
      /^data:image\/png;base64,/
    );
  });

  it('should respect custom size limit', async () => {
    const file = join(testDir, 'custom.png');
    await writeFile(file, Buffer.alloc(500));

    await expect(encodeSingle(file, { sizeLimit: 400 })).rejects.toThrow(
      'Size limit exceeded'
    );

    await expect(encodeSingle(file, { sizeLimit: 600 })).resolves.toMatch(
      /^data:image\/png;base64,/
    );
  });
});

describe('encode', () => {
  it('should encode multiple files', async () => {
    await mkdir(testDir, { recursive: true });
    const file1 = join(testDir, 'file1.png');
    const file2 = join(testDir, 'file2.png');

    await writeFile(file1, testPngBuffer);
    await writeFile(file2, testPngBuffer);

    const results = await encode([file1, file2]);

    expect(results.size).toBe(2);
    expect(results.get(file1)?.data).toMatch(/^data:image\/png;base64,/);
    expect(results.get(file2)?.data).toMatch(/^data:image\/png;base64,/);
    expect(results.get(file1)?.error).toBeNull();
    expect(results.get(file2)?.error).toBeNull();
  });

  it('should handle mix of success and failures', async () => {
    const validFile = join(testDir, 'valid.png');
    const invalidFile = join(testDir, 'nonexistent.png');

    await writeFile(validFile, testPngBuffer);

    const results = await encode([validFile, invalidFile]);

    expect(results.size).toBe(2);
    expect(results.get(validFile)?.data).toMatch(/^data:image\/png;base64,/);
    expect(results.get(validFile)?.error).toBeNull();
    expect(results.get(invalidFile)?.data).toBeNull();
    expect(results.get(invalidFile)?.error).toBeInstanceOf(Error);
  });

  it('should handle single path string', async () => {
    await writeFile(testImagePath, testPngBuffer);

    const results = await encode(testImagePath);

    expect(results.size).toBe(1);
    expect(results.get(testImagePath)?.data).toMatch(/^data:image\/png;base64,/);
  });

  it('should remove duplicate paths', async () => {
    await writeFile(testImagePath, testPngBuffer);

    const results = await encode([testImagePath, testImagePath, testImagePath]);

    expect(results.size).toBe(1);
  });

  it('should respect concurrency limit', async () => {
    const files = [];
    for (let i = 0; i < 20; i++) {
      const file = join(testDir, `file${i}.png`);
      files.push(file);
      await writeFile(file, testPngBuffer);
    }

    const results = await encode(files, { concurrency: 5 });

    expect(results.size).toBe(20);
    Array.from(results.values()).forEach((result) => {
      expect(result.error).toBeNull();
      expect(result.data).toMatch(/^data:image\/png;base64,/);
    });
  });
});

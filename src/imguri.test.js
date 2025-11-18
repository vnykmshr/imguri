import { describe, it, expect, beforeAll } from 'vitest';
import { encodeSingle, encode } from './imguri.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const testDir = join(process.cwd(), 'test');
const testImagePath = join(testDir, 'test.png');

// Small 1x1 PNG (red pixel)
const testPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
  0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
  0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08,
  0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
  0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

beforeAll(async () => {
  await mkdir(testDir, { recursive: true });
  await writeFile(testImagePath, testPngBuffer);
});

describe('encodeSingle - local files', () => {
  it('should encode a PNG file', async () => {
    const result = await encodeSingle(testImagePath);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should reject non-existent files', async () => {
    await expect(encodeSingle(join(testDir, 'nonexistent.png'))).rejects.toThrow(
      'File not found'
    );
  });

  it('should reject files without MIME type', async () => {
    const unknownFile = join(testDir, 'test.unknown');
    await writeFile(unknownFile, 'test');
    await expect(encodeSingle(unknownFile)).rejects.toThrow(
      'Unable to determine MIME type'
    );
  });

  it('should enforce size limit (128KB default)', async () => {
    const largeFile = join(testDir, 'large.png');
    await writeFile(largeFile, Buffer.alloc(150000));
    await expect(encodeSingle(largeFile)).rejects.toThrow('Size limit exceeded');
  });

  it('should allow force override of size limit', async () => {
    const largeFile = join(testDir, 'large.png');
    await writeFile(largeFile, Buffer.alloc(150000));
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

describe('path security validation', () => {
  it('should block path traversal with ..', async () => {
    await expect(encodeSingle('../etc/passwd')).rejects.toThrow(
      'path traversal detected'
    );

    await expect(encodeSingle('../../etc/passwd')).rejects.toThrow(
      'path traversal detected'
    );
  });

  it('should block absolute paths outside cwd', async () => {
    await expect(encodeSingle('/etc/passwd')).rejects.toThrow(
      'absolute paths outside cwd not allowed'
    );
  });

  it('should allow relative paths within cwd', async () => {
    await expect(encodeSingle('test/test.png')).resolves.toMatch(
      /^data:image\/png;base64,/
    );
  });
});

describe('encode - batch processing', () => {
  it('should encode multiple files', async () => {
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
    const results = await encode(testImagePath);
    expect(results.size).toBe(1);
    expect(results.get(testImagePath)?.data).toMatch(/^data:image\/png;base64,/);
  });

  it('should remove duplicate paths', async () => {
    const results = await encode([testImagePath, testImagePath, testImagePath]);
    expect(results.size).toBe(1);
  });

  it('should respect concurrency limit', async () => {
    const files = [];
    for (let i = 0; i < 10; i++) {
      const file = join(testDir, `file${i}.png`);
      files.push(file);
      await writeFile(file, testPngBuffer);
    }

    const results = await encode(files, { concurrency: 3 });
    expect(results.size).toBe(10);

    for (const result of results.values()) {
      expect(result.error).toBeNull();
      expect(result.data).toMatch(/^data:image\/png;base64,/);
    }
  });
});

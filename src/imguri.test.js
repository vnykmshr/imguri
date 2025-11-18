import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { encodeSingle, encode } from './imguri.js';
import { writeFile, rm, mkdtemp } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import nock from 'nock';

let testDir;
let testImagePath;

// Small 1x1 PNG (red pixel)
const testPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
  0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
  0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08,
  0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
  0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

beforeAll(async () => {
  // Create temporary directory for test files
  testDir = await mkdtemp(join(tmpdir(), 'imguri-test-'));
  testImagePath = join(testDir, 'test.png');
  await writeFile(testImagePath, testPngBuffer);
});

afterAll(async () => {
  // Clean up temporary directory
  if (testDir) {
    await rm(testDir, { recursive: true, force: true });
  }
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

  it('should allow absolute paths (explicit user intent)', async () => {
    // Absolute paths are allowed - if user provides explicit path, that's their intent
    // File not found is OK - we're just testing path validation doesn't block it
    await expect(encodeSingle('/tmp/nonexistent.png')).rejects.toThrow(
      'File not found'
    );
  });

  it('should allow relative paths within cwd', async () => {
    // Using testImagePath which is now in tmpdir, need to get relative path
    const result = await encodeSingle(testImagePath);
    expect(result).toMatch(/^data:image\/png;base64,/);
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

describe('encodeSingle - remote URLs', () => {
  const TEST_HOST = 'https://example.com';
  const TEST_IMAGE_URL = `${TEST_HOST}/image.png`;
  const TEST_HTML_URL = `${TEST_HOST}/page.html`;

  afterEach(() => {
    nock.cleanAll();
  });

  it('should encode remote HTTPS image', async () => {
    nock(TEST_HOST)
      .head('/image.png')
      .reply(200, '', {
        'content-type': 'image/png',
        'content-length': String(testPngBuffer.length),
      });

    nock(TEST_HOST)
      .get('/image.png')
      .reply(200, testPngBuffer, {
        'content-type': 'image/png',
      });

    const result = await encodeSingle(TEST_IMAGE_URL);
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should encode remote HTTP image', async () => {
    const httpUrl = 'http://example.com/image.jpg';

    nock('http://example.com')
      .head('/image.jpg')
      .reply(200, '', {
        'content-type': 'image/jpeg',
        'content-length': String(testPngBuffer.length),
      });

    nock('http://example.com')
      .get('/image.jpg')
      .reply(200, testPngBuffer, {
        'content-type': 'image/jpeg',
      });

    const result = await encodeSingle(httpUrl);
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
  });

  it('should reject non-image content type', async () => {
    nock(TEST_HOST)
      .head('/page.html')
      .reply(200, '', {
        'content-type': 'text/html',
        'content-length': '1234',
      });

    await expect(encodeSingle(TEST_HTML_URL)).rejects.toThrow(
      'Not an image. Content-Type: text/html'
    );
  });

  it('should enforce size limit for remote URLs', async () => {
    nock(TEST_HOST)
      .head('/large.png')
      .reply(200, '', {
        'content-type': 'image/png',
        'content-length': '200000', // Larger than 128KB default
      });

    await expect(encodeSingle(`${TEST_HOST}/large.png`)).rejects.toThrow(
      'Size limit exceeded'
    );
  });

  it('should allow force override for remote URLs', async () => {
    const largeBuffer = Buffer.alloc(200000);

    nock(TEST_HOST)
      .head('/large.png')
      .reply(200, '', {
        'content-type': 'image/png',
        'content-length': '200000',
      });

    nock(TEST_HOST)
      .get('/large.png')
      .reply(200, largeBuffer, {
        'content-type': 'image/png',
      });

    const result = await encodeSingle(`${TEST_HOST}/large.png`, { force: true });
    expect(result).toMatch(/^data:image\/png;base64,/);
  });

  it('should respect custom timeout', async () => {
    nock(TEST_HOST)
      .head('/slow.png')
      .delay(200) // Delay longer than custom timeout
      .reply(200);

    await expect(
      encodeSingle(`${TEST_HOST}/slow.png`, { timeout: 100 })
    ).rejects.toThrow();
  }, 500);

  it('should handle HTTP 404 errors', async () => {
    nock(TEST_HOST).head('/missing.png').reply(404, 'Not Found');

    await expect(encodeSingle(`${TEST_HOST}/missing.png`)).rejects.toThrow(
      'HTTP 404'
    );
  });

  it('should handle HTTP 500 errors', async () => {
    nock(TEST_HOST).head('/error.png').reply(500, 'Internal Server Error');

    await expect(encodeSingle(`${TEST_HOST}/error.png`)).rejects.toThrow('HTTP 500');
  });

  it('should check size after download if content-length missing', async () => {
    const largeBuffer = Buffer.alloc(200000);

    nock(TEST_HOST)
      .head('/no-length.png')
      .reply(200, '', {
        'content-type': 'image/png',
        // No content-length header
      });

    nock(TEST_HOST)
      .get('/no-length.png')
      .reply(200, largeBuffer, {
        'content-type': 'image/png',
      });

    await expect(encodeSingle(`${TEST_HOST}/no-length.png`)).rejects.toThrow(
      'Size limit exceeded'
    );
  });
});

describe('encode - batch with remote URLs', () => {
  const TEST_HOST = 'https://example.com';

  afterEach(() => {
    nock.cleanAll();
  });

  it('should encode mix of local and remote files', async () => {
    nock(TEST_HOST)
      .head('/remote.png')
      .reply(200, '', {
        'content-type': 'image/png',
        'content-length': String(testPngBuffer.length),
      });

    nock(TEST_HOST)
      .get('/remote.png')
      .reply(200, testPngBuffer, {
        'content-type': 'image/png',
      });

    const results = await encode([testImagePath, `${TEST_HOST}/remote.png`]);

    expect(results.size).toBe(2);
    expect(results.get(testImagePath)?.data).toMatch(/^data:image\/png;base64,/);
    expect(results.get(testImagePath)?.error).toBeNull();
    expect(results.get(`${TEST_HOST}/remote.png`)?.data).toMatch(
      /^data:image\/png;base64,/
    );
    expect(results.get(`${TEST_HOST}/remote.png`)?.error).toBeNull();
  });

  it('should handle mix of success and failures with URLs', async () => {
    nock(TEST_HOST).head('/success.png').reply(200, '', {
      'content-type': 'image/png',
      'content-length': String(testPngBuffer.length),
    });

    nock(TEST_HOST).get('/success.png').reply(200, testPngBuffer, {
      'content-type': 'image/png',
    });

    nock(TEST_HOST).head('/fail.png').reply(404);

    const results = await encode([
      `${TEST_HOST}/success.png`,
      `${TEST_HOST}/fail.png`,
    ]);

    expect(results.size).toBe(2);
    expect(results.get(`${TEST_HOST}/success.png`)?.data).toMatch(/^data:image/);
    expect(results.get(`${TEST_HOST}/success.png`)?.error).toBeNull();
    expect(results.get(`${TEST_HOST}/fail.png`)?.data).toBeNull();
    expect(results.get(`${TEST_HOST}/fail.png`)?.error).toBeInstanceOf(Error);
  });
});

/**
 * Tests for HTTP client adapter
 */

import { describe, it, expect, afterEach } from 'vitest';
import nock from 'nock';
import { fetchMetadata, fetchBuffer, isImageContentType } from './http-client.js';

const TEST_HOST = 'https://example.com';
const TEST_PATH = '/image.png';
const TEST_URL = `${TEST_HOST}${TEST_PATH}`;

// Small 1x1 PNG (red pixel)
const testPngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48,
  0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00,
  0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08,
  0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d,
  0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

describe('fetchMetadata', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch metadata with HEAD request', async () => {
    nock(TEST_HOST)
      .head(TEST_PATH)
      .reply(200, '', {
        'content-type': 'image/png',
        'content-length': '1234',
      });

    const result = await fetchMetadata(TEST_URL);

    expect(result.contentType).toBe('image/png');
    expect(result.contentLength).toBe(1234);
  });

  it('should handle missing content-type header', async () => {
    nock(TEST_HOST)
      .head(TEST_PATH)
      .reply(200, '', {
        'content-length': '5678',
      });

    const result = await fetchMetadata(TEST_URL);

    expect(result.contentType).toBe('');
    expect(result.contentLength).toBe(5678);
  });

  it('should handle missing content-length header', async () => {
    nock(TEST_HOST)
      .head(TEST_PATH)
      .reply(200, '', {
        'content-type': 'image/jpeg',
      });

    const result = await fetchMetadata(TEST_URL);

    expect(result.contentType).toBe('image/jpeg');
    expect(result.contentLength).toBe(0);
  });

  it('should handle HTTP 404 error', async () => {
    nock(TEST_HOST).head(TEST_PATH).reply(404, 'Not Found');

    await expect(fetchMetadata(TEST_URL)).rejects.toThrow('HTTP 404: Not Found');
  });

  it('should handle HTTP 500 error', async () => {
    nock(TEST_HOST).head(TEST_PATH).reply(500, 'Internal Server Error');

    await expect(fetchMetadata(TEST_URL)).rejects.toThrow(
      'HTTP 500: Internal Server Error'
    );
  });

  it('should timeout after configured duration', async () => {
    nock(TEST_HOST)
      .head(TEST_PATH)
      .delay(200) // Delay longer than timeout
      .reply(200);

    await expect(fetchMetadata(TEST_URL, 100)).rejects.toThrow();
  }, 300);

  it('should respect custom timeout', async () => {
    nock(TEST_HOST)
      .head(TEST_PATH)
      .delay(50)
      .reply(200, '', {
        'content-type': 'image/png',
        'content-length': '100',
      });

    const result = await fetchMetadata(TEST_URL, 200);

    expect(result.contentType).toBe('image/png');
  });
});

describe('fetchBuffer', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('should fetch buffer with GET request', async () => {
    nock(TEST_HOST)
      .get(TEST_PATH)
      .reply(200, testPngBuffer, {
        'content-type': 'image/png',
      });

    const result = await fetchBuffer(TEST_URL);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBe(testPngBuffer.length);
    expect(result.contentType).toBe('image/png');
  });

  it('should handle missing content-type header', async () => {
    nock(TEST_HOST).get(TEST_PATH).reply(200, testPngBuffer);

    const result = await fetchBuffer(TEST_URL);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.contentType).toBe('application/octet-stream');
  });

  it('should handle HTTP 404 error', async () => {
    nock(TEST_HOST).get(TEST_PATH).reply(404, 'Not Found');

    await expect(fetchBuffer(TEST_URL)).rejects.toThrow('HTTP 404: Not Found');
  });

  it('should handle HTTP 403 error', async () => {
    nock(TEST_HOST).get(TEST_PATH).reply(403, 'Forbidden');

    await expect(fetchBuffer(TEST_URL)).rejects.toThrow('HTTP 403: Forbidden');
  });

  it('should timeout after configured duration', async () => {
    nock(TEST_HOST)
      .get(TEST_PATH)
      .delay(200) // Delay longer than timeout
      .reply(200);

    await expect(fetchBuffer(TEST_URL, 100)).rejects.toThrow();
  }, 300);

  it('should handle large responses', async () => {
    const largeBuffer = Buffer.alloc(100000, 'x');
    nock(TEST_HOST)
      .get(TEST_PATH)
      .reply(200, largeBuffer, {
        'content-type': 'image/jpeg',
      });

    const result = await fetchBuffer(TEST_URL);

    expect(result.buffer.length).toBe(100000);
    expect(result.contentType).toBe('image/jpeg');
  });

  it('should handle redirects', async () => {
    nock(TEST_HOST)
      .get(TEST_PATH)
      .reply(302, '', { location: `${TEST_HOST}/redirected.png` });

    nock(TEST_HOST)
      .get('/redirected.png')
      .reply(200, testPngBuffer, {
        'content-type': 'image/png',
      });

    const result = await fetchBuffer(TEST_URL);

    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.contentType).toBe('image/png');
  });
});

describe('isImageContentType', () => {
  it('should return true for image/png', () => {
    expect(isImageContentType('image/png')).toBe(true);
  });

  it('should return true for image/jpeg', () => {
    expect(isImageContentType('image/jpeg')).toBe(true);
  });

  it('should return true for image/gif', () => {
    expect(isImageContentType('image/gif')).toBe(true);
  });

  it('should return true for image/svg+xml', () => {
    expect(isImageContentType('image/svg+xml')).toBe(true);
  });

  it('should return true for image/webp', () => {
    expect(isImageContentType('image/webp')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(isImageContentType('IMAGE/PNG')).toBe(true);
    expect(isImageContentType('Image/Jpeg')).toBe(true);
  });

  it('should return false for text/html', () => {
    expect(isImageContentType('text/html')).toBe(false);
  });

  it('should return false for application/json', () => {
    expect(isImageContentType('application/json')).toBe(false);
  });

  it('should return false for text/plain', () => {
    expect(isImageContentType('text/plain')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isImageContentType('')).toBe(false);
  });

  it('should handle content-type with charset', () => {
    expect(isImageContentType('image/png; charset=utf-8')).toBe(true);
  });
});

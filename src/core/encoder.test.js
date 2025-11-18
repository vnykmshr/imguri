/**
 * Tests for core encoder functions
 */

import { describe, it, expect } from 'vitest';
import { toDataUri, exceedsSizeLimit } from './encoder.js';

describe('toDataUri', () => {
  it('should convert buffer to data URI', () => {
    const buffer = Buffer.from('test');
    const mimeType = 'text/plain';
    const result = toDataUri(buffer, mimeType);

    expect(result).toBe('data:text/plain;base64,dGVzdA==');
  });

  it('should handle image buffers', () => {
    const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // PNG header
    const mimeType = 'image/png';
    const result = toDataUri(buffer, mimeType);

    expect(result).toMatch(/^data:image\/png;base64,/);
    expect(result).toBe('data:image/png;base64,iVBORw==');
  });

  it('should throw TypeError for non-buffer input', () => {
    expect(() => toDataUri('not a buffer', 'text/plain')).toThrow(TypeError);
    expect(() => toDataUri('not a buffer', 'text/plain')).toThrow(
      'Expected buffer to be a Buffer instance'
    );
  });

  it('should throw TypeError for invalid MIME type', () => {
    const buffer = Buffer.from('test');
    expect(() => toDataUri(buffer, '')).toThrow(TypeError);
    expect(() => toDataUri(buffer, null)).toThrow(TypeError);
    expect(() => toDataUri(buffer, undefined)).toThrow(TypeError);
  });
});

describe('exceedsSizeLimit', () => {
  it('should return true when buffer exceeds limit', () => {
    const buffer = Buffer.alloc(100);
    expect(exceedsSizeLimit(buffer, 50)).toBe(true);
  });

  it('should return false when buffer is within limit', () => {
    const buffer = Buffer.alloc(50);
    expect(exceedsSizeLimit(buffer, 100)).toBe(false);
  });

  it('should return false when buffer equals limit', () => {
    const buffer = Buffer.alloc(100);
    expect(exceedsSizeLimit(buffer, 100)).toBe(false);
  });
});

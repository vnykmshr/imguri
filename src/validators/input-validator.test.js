import { describe, it, expect } from 'vitest';
import {
  getPathType,
  validateSize,
  validateImageContentType,
  validateFileExists,
  validateMimeType,
} from './input-validator.js';
import { DEFAULT_SIZE_LIMIT } from '../config.js';

describe('getPathType', () => {
  it('should identify HTTP URLs', () => {
    expect(getPathType('http://example.com/image.png')).toBe('url');
    expect(getPathType('HTTP://EXAMPLE.COM/IMAGE.PNG')).toBe('url');
  });

  it('should identify HTTPS URLs', () => {
    expect(getPathType('https://example.com/image.png')).toBe('url');
    expect(getPathType('HTTPS://EXAMPLE.COM/IMAGE.PNG')).toBe('url');
  });

  it('should identify local file paths', () => {
    expect(getPathType('/path/to/file.png')).toBe('file');
    expect(getPathType('./relative/path.png')).toBe('file');
    expect(getPathType('file.png')).toBe('file');
    expect(getPathType('C:\\Windows\\file.png')).toBe('file');
  });
});

describe('validateSize', () => {
  it('should not throw when size is within limit', () => {
    expect(() => validateSize(100, 200)).not.toThrow();
    expect(() => validateSize(200, 200)).not.toThrow();
  });

  it('should throw when size exceeds limit', () => {
    expect(() => validateSize(300, 200)).toThrow('Size limit exceeded');
  });

  it('should not throw when force is true', () => {
    expect(() => validateSize(300, 200, true)).not.toThrow();
  });

  it('should use default size limit', () => {
    expect(() => validateSize(DEFAULT_SIZE_LIMIT + 1)).toThrow();
    expect(() => validateSize(DEFAULT_SIZE_LIMIT)).not.toThrow();
  });
});

describe('validateImageContentType', () => {
  it('should not throw for valid image content types', () => {
    expect(() => validateImageContentType('image/png', 'test.png')).not.toThrow();
    expect(() => validateImageContentType('image/jpeg', 'test.jpg')).not.toThrow();
    expect(() => validateImageContentType('image/gif', 'test.gif')).not.toThrow();
    expect(() => validateImageContentType('IMAGE/PNG', 'test.png')).not.toThrow();
  });

  it('should throw for non-image content types', () => {
    expect(() => validateImageContentType('text/html', 'http://example.com')).toThrow(
      'Not an image'
    );
    expect(() =>
      validateImageContentType('application/json', 'http://example.com')
    ).toThrow('Not an image');
  });
});

describe('validateFileExists', () => {
  it('should not throw when file exists', () => {
    expect(() => validateFileExists(true, 'test.png')).not.toThrow();
  });

  it('should throw when file does not exist', () => {
    expect(() => validateFileExists(false, 'missing.png')).toThrow('File not found');
    expect(() => validateFileExists(false, 'missing.png')).toThrow('missing.png');
  });
});

describe('validateMimeType', () => {
  it('should not throw for valid MIME type', () => {
    expect(() => validateMimeType('image/png', 'test.png')).not.toThrow();
  });

  it('should throw for null MIME type', () => {
    expect(() => validateMimeType(null, 'test.xyz')).toThrow(
      'Unable to determine MIME type'
    );
  });

  it('should throw for empty MIME type', () => {
    expect(() => validateMimeType('', 'test.xyz')).toThrow(
      'Unable to determine MIME type'
    );
  });
});

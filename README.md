# ImgUri

> Modern, lightweight library to convert local/network image files to data URI scheme

[![CI](https://github.com/vnykmshr/imguri/workflows/CI/badge.svg)](https://github.com/vnykmshr/imguri/actions)
[![npm version](https://img.shields.io/npm/v/imguri.svg)](https://www.npmjs.com/package/imguri)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Modern** - Built with ES modules, async/await, and native fetch API
- **Lightweight** - Single dependency (mime-types), lean codebase (~250 LOC)
- **Universal** - Supports both local files and remote URLs
- **Fast** - Concurrent processing with configurable limits, esbuild-powered builds
- **Secure** - Path traversal protection, no deprecated dependencies
- **Backward Compatible** - Legacy callback API supported (deprecated, will be removed in v2.0)

## Requirements

- Node.js >= 18.0.0 (for native fetch API support)

## Installation

```bash
npm install imguri
```

## Quick Start

### ESM (Recommended)

```javascript
import { encodeSingle, encode } from 'imguri';

// Encode a single file
const dataUri = await encodeSingle('path/to/image.png');
console.log(dataUri); // data:image/png;base64,...

// Encode multiple files
const results = await encode([
  'image1.png',
  'https://example.com/image2.jpg',
  'image3.gif',
]);

for (const [path, result] of results) {
  if (result.error) {
    console.error(`Failed to encode ${path}:`, result.error);
  } else {
    console.log(`Success: ${path} -> ${result.data.substring(0, 50)}...`);
  }
}
```

### CommonJS

```javascript
const { encodeSingle, encode } = require('imguri');

(async () => {
  const dataUri = await encodeSingle('path/to/image.png');
  console.log(dataUri);
})();
```

## API Reference

### `encodeSingle(path, options?)`

Encode a single file or URL to a data URI.

**Parameters:**

- `path` (string) - Local file path or HTTP/HTTPS URL (paths validated for security)
- `options` (object, optional):
  - `force` (boolean) - Override size limit (default: `false`)
  - `sizeLimit` (number) - Max file size in bytes (default: `131072` / 128KB)
  - `timeout` (number) - HTTP timeout in ms (default: `20000`)

**Returns:** `Promise<string>` - Data URI string

**Throws:** Error if file not found, size exceeded, or network error

**Example:**

```javascript
// Local file
const uri = await encodeSingle('./logo.png');

// Remote URL
const uri = await encodeSingle('https://example.com/avatar.jpg');

// With options
const uri = await encodeSingle('./large-image.png', {
  force: true,
  sizeLimit: 10240, // 10KB
});
```

### `encode(paths, options?)`

Encode multiple files or URLs with concurrent processing.

**Parameters:**

- `paths` (string | string[]) - Single path or array of paths
- `options` (object, optional):
  - `force` (boolean) - Override size limit (default: `false`)
  - `sizeLimit` (number) - Max file size in bytes (default: `131072` / 128KB)
  - `timeout` (number) - HTTP timeout in ms (default: `20000`)
  - `concurrency` (number) - Max concurrent ops (default: `10`)

**Returns:** `Promise<Map<string, EncodeResult>>`

**EncodeResult:**

```typescript
{
  data: string | null; // Data URI or null if error
  error: Error | null; // Error object or null if success
}
```

**Example:**

```javascript
const results = await encode(
  ['image1.png', 'image2.jpg', 'https://example.com/image3.gif'],
  { concurrency: 5, sizeLimit: 8192 }
);

// Process results
for (const [path, result] of results) {
  if (result.error) {
    console.error(`❌ ${path}: ${result.error.message}`);
  } else {
    console.log(`✅ ${path}: Encoded successfully`);
    // Use result.data in img tag
    // <img src="${result.data}" />
  }
}
```

### Legacy Callback API

For backward compatibility with v0.x:

```javascript
import { encodeLegacy } from 'imguri';

encodeLegacy(['image1.png', 'image2.jpg'], { force: false }, (err, results) => {
  if (err) {
    console.error(err);
    return;
  }

  for (const [path, result] of Object.entries(results)) {
    if (result.err) {
      console.error(`Failed: ${path}`, result.err);
    } else {
      console.log(`Success: ${path}`, result.data);
    }
  }
});
```

## Options

| Option        | Type    | Default  | Description                                  |
| ------------- | ------- | -------- | -------------------------------------------- |
| `force`       | boolean | `false`  | Override size limit restrictions             |
| `sizeLimit`   | number  | `131072` | Maximum file size in bytes (128KB default)   |
| `timeout`     | number  | `20000`  | HTTP request timeout in milliseconds         |
| `concurrency` | number  | `10`     | Maximum number of concurrent encode requests |

## Use Cases

### Email Templates with Inline Images

```javascript
import { encodeSingle } from 'imguri';

async function generateEmailHtml() {
  const logo = await encodeSingle('assets/logo.png', { sizeLimit: 10240 });
  const banner = await encodeSingle('assets/banner.jpg', { sizeLimit: 20480 });

  return `
    <!DOCTYPE html>
    <html>
      <body>
        <img src="${logo}" alt="Company Logo" width="150">
        <img src="${banner}" alt="Banner" width="600">
        <p>Email content here...</p>
      </body>
    </html>
  `;
}

const emailHtml = await generateEmailHtml();
// Send via your email service (SendGrid, Mailgun, etc.)
```

### Build Tool Integration - Inline Assets

```javascript
import { encode } from 'imguri';
import { writeFile } from 'fs/promises';

async function inlineAssets() {
  const assets = [
    'src/favicon.ico',
    'src/icons/search.svg',
    'src/icons/menu.svg',
  ];

  const results = await encode(assets, { force: true, concurrency: 5 });

  const manifest = {};
  for (const [path, result] of results) {
    if (result.error) {
      console.error(`Failed to encode ${path}:`, result.error.message);
    } else {
      const key = path.split('/').pop().replace(/\.\w+$/, '');
      manifest[key] = result.data;
    }
  }

  await writeFile('dist/inlined-assets.json', JSON.stringify(manifest, null, 2));
  console.log('Inlined', Object.keys(manifest).length, 'assets');
}

await inlineAssets();
// Output: dist/inlined-assets.json with { "favicon": "data:image/...", ... }
```

## Important Notes

1. **Size Limits**: Default 128KB limit balances practicality with performance. Large data URIs increase page load time.
2. **Browser Support**: Data URIs are well-supported but have size limits (~2MB in most browsers)
3. **Security**: Path traversal attacks (`../`) are blocked. Absolute paths are allowed (explicit user intent). Relative paths are validated to ensure they don't escape cwd. **Warning**: Absolute paths can access any readable file on the system. Validate user input in production environments.
4. **Best Practices**:
   - Use for small images (icons, logos, favicons)
   - Avoid for large photos or complex graphics
   - Consider lazy loading for multiple images
   - Cache encoded results when possible

## Migration from v0.x

The v1.0 release introduces breaking changes for a more modern API:

**Old (v0.x):**

```javascript
const imguri = require('imguri');

imguri.encode(['image.png'], { force: false }, (err, results) => {
  console.log(results);
});
```

**New (v1.x):**

```javascript
import { encode } from 'imguri';

const results = await encode(['image.png'], { force: false });

for (const [path, result] of results) {
  console.log(result.data, result.error);
}
```

**Use Legacy API:**

```javascript
import { encodeLegacy } from 'imguri';

encodeLegacy(['image.png'], { force: false }, (err, results) => {
  console.log(results);
});
```

## Architecture

This library follows a two-layer architecture with clear separation of concerns:

**Core Layer** (Pure business logic)
- `encoder.js` - Base64 encoding and data URI formatting

**Adapter Layer** (External I/O)
- `file-reader.js` - File system operations (read, stat, exists, MIME detection)
- `http-client.js` - HTTP operations (fetch metadata, fetch buffer, content-type validation)

**Main Module**
- `imguri.js` - Coordinates adapters, applies path security validation, handles concurrency
- `config.js` - Configuration constants (size limits, timeouts, concurrency)

Data flows from adapters through validation to the encoder, with the main module orchestrating all operations.

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Development

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Format code
npm run format

# Build
npm run build
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

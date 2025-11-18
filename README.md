# ImgUri

> Modern, lightweight library to convert local/network image files to data URI scheme

[![CI](https://github.com/vnykmshr/imguri/workflows/CI/badge.svg)](https://github.com/vnykmshr/imguri/actions)
[![npm version](https://img.shields.io/npm/v/imguri.svg)](https://www.npmjs.com/package/imguri)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🚀 **Modern** - Built with ES modules, async/await, and native fetch API
- 📦 **Lightweight** - Minimal dependencies, lean codebase (~200 LOC)
- 🌐 **Universal** - Supports both local files and remote URLs
- ⚡ **Fast** - Concurrent processing with configurable limits, esbuild-powered builds
- 🛡️ **Secure** - Path traversal protection, no deprecated dependencies
- 🔄 **Backward Compatible** - Legacy callback API supported (deprecated, will be removed in v2.0)

## 📋 Requirements

- Node.js >= 18.0.0 (for native fetch API support)

## 📦 Installation

```bash
npm install imguri
```

## 🚀 Quick Start

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

### TypeScript

```typescript
import { encodeSingle, encode, type EncodeOptions } from 'imguri';

const options: EncodeOptions = {
  force: false,
  sizeLimit: 8192, // 8KB
  timeout: 30000,
};

const dataUri: string = await encodeSingle('image.png', options);
```

## 📖 API Reference

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

## 🔧 Options

| Option        | Type    | Default  | Description                                  |
| ------------- | ------- | -------- | -------------------------------------------- |
| `force`       | boolean | `false`  | Override size limit restrictions             |
| `sizeLimit`   | number  | `131072` | Maximum file size in bytes (128KB default)   |
| `timeout`     | number  | `20000`  | HTTP request timeout in milliseconds         |
| `concurrency` | number  | `10`     | Maximum number of concurrent encode requests |

## 💡 Use Cases

### In HTML/CSS

```javascript
const favicon = await encodeSingle('favicon.ico');
// Use in HTML: <link rel="icon" href="data:image/x-icon;base64,..." />
```

### Email Templates

```javascript
const logo = await encodeSingle('email-logo.png', { sizeLimit: 10240 });
// Embed in email HTML
const html = `<img src="${logo}" alt="Logo" />`;
```

### Build Tools / Bundlers

```javascript
import { encode } from 'imguri';

// Inline all images during build
const images = ['logo.png', 'icon1.svg', 'icon2.svg'];
const inlined = await encode(images, { force: true });
```

### Offline-First Apps

```javascript
// Cache images as data URIs
const results = await encode([
  'https://cdn.example.com/image1.jpg',
  'https://cdn.example.com/image2.jpg',
]);

localStorage.setItem('cached-images', JSON.stringify(Array.from(results)));
```

## ⚠️ Important Notes

1. **Size Limits**: Default 128KB limit balances practicality with performance. Large data URIs increase page load time.
2. **Browser Support**: Data URIs are well-supported but have size limits (~2MB in most browsers)
3. **Security**: Path traversal attacks (`../`) are blocked. Absolute paths are allowed (explicit user intent). Relative paths are validated to ensure they don't escape cwd.
4. **Best Practices**:
   - Use for small images (icons, logos, favicons)
   - Avoid for large photos or complex graphics
   - Consider lazy loading for multiple images
   - Cache encoded results when possible

## 🔄 Migration from v0.x

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

## 🏗️ Architecture

This library follows a clean, two-layer architecture:

```
src/
├── core/              # Pure business logic
│   └── encoder.js     # Base64 encoding
├── adapters/          # External interfaces
│   ├── file-reader.js # Local file system
│   └── http-client.js # HTTP/HTTPS requests
├── config.js          # Configuration constants
└── imguri.js          # Public API with validation
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## 🔨 Development

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

## 📝 License

MIT © Vinayak Mishra

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📊 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 🙏 Acknowledgments

- Built with modern Node.js features
- Inspired by the need for a lightweight, dependency-free data URI encoder
- Thanks to all contributors and users!

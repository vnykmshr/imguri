# imguri

Convert local and remote images to data URI scheme for inline embedding.

[![CI](https://github.com/vnykmshr/imguri/workflows/CI/badge.svg)](https://github.com/vnykmshr/imguri/actions)
[![npm version](https://img.shields.io/npm/v/imguri.svg)](https://www.npmjs.com/package/imguri)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ES modules with dual CJS/ESM support
- Local files and HTTP/HTTPS URLs
- Concurrent batch processing
- Path traversal protection
- Native fetch API, no deprecated dependencies

**Requirements:** Node.js >= 18.0.0

## Installation

```bash
npm install imguri
```

## Usage

### Single File

```javascript
import { encodeSingle } from 'imguri';

// Local file
const uri = await encodeSingle('logo.png');
console.log(uri); // data:image/png;base64,...

// Remote URL
const uri = await encodeSingle('https://example.com/image.jpg');

// With options
const uri = await encodeSingle('large.png', {
  sizeLimit: 256000, // 250KB
  force: true        // override limit
});
```

### Batch Processing

```javascript
import { encode } from 'imguri';

const results = await encode([
  'icon1.png',
  'icon2.png',
  'https://example.com/logo.jpg'
], { concurrency: 5 });

for (const [path, result] of results) {
  if (result.error) {
    console.error(path, result.error.message);
  } else {
    console.log(path, result.data.substring(0, 50) + '...');
  }
}
```

### CommonJS

```javascript
const { encodeSingle } = require('imguri');

(async () => {
  const uri = await encodeSingle('image.png');
  console.log(uri);
})();
```

## API

### encodeSingle(path, options?)

Encodes a single file or URL to data URI.

- **path** `string` - File path or HTTP/HTTPS URL
- **options** `object`
  - `sizeLimit` `number` - Max bytes (default: 131072 / 128KB)
  - `force` `boolean` - Override size limit (default: false)
  - `timeout` `number` - HTTP timeout ms (default: 20000)

Returns `Promise<string>` - Data URI string

Throws if file not found, size exceeded, or network error.

### encode(paths, options?)

Encodes multiple files/URLs with concurrent processing.

- **paths** `string | string[]` - Path(s) to encode
- **options** `object` - Same as encodeSingle, plus:
  - `concurrency` `number` - Max parallel ops (default: 10)

Returns `Promise<Map<string, EncodeResult>>` where EncodeResult is:

```javascript
{
  data: string | null,  // Data URI or null if error
  error: Error | null   // Error or null if success
}
```

### encodeLegacy(paths, options, callback)

Callback-based API for v0.x compatibility. Deprecated, will be removed in v2.0.

## Configuration

| Option       | Type    | Default  | Description                    |
| ------------ | ------- | -------- | ------------------------------ |
| sizeLimit    | number  | 131072   | Max file size in bytes (128KB) |
| timeout      | number  | 20000    | HTTP timeout in milliseconds   |
| concurrency  | number  | 10       | Max concurrent operations      |
| force        | boolean | false    | Override size limit            |

## Security

Path validation prevents directory traversal attacks (`../` is blocked). Absolute paths are allowed but can access any readable file - validate user input in production.

For HTTP URLs, content-type validation ensures only images are processed. Size limits prevent memory exhaustion.

## Migration from v0.x

v1.0 replaces callbacks with promises and changes result format from object to Map. Use `encodeLegacy()` for backward compatibility or update to promise-based API:

```javascript
// v0.x
imguri.encode(['file.png'], opts, (err, results) => { ... });

// v1.0
const results = await encode(['file.png'], opts);
for (const [path, result] of results) { ... }
```

See [CHANGELOG.md](CHANGELOG.md) for complete migration guide.

## How It Works

Two-layer architecture separates business logic from I/O:

- **Core layer:** Base64 encoding and data URI formatting
- **Adapter layer:** File system operations and HTTP client
- **Main module:** Coordinates adapters, validates paths, manages concurrency

Data flows: Adapter → Validation → Encoder → Data URI string

## Development

```bash
npm install      # Install dependencies
npm test         # Run tests (54 tests, 89% coverage)
npm run lint     # Check code style
npm run build    # Build CJS/ESM bundles
```

## Documentation

- [Technical Blog](docs/TECHNICAL_BLOG.md) - Architecture deep dive
- [Changelog](CHANGELOG.md) - Version history
- [Security Policy](.github/SECURITY.md) - Vulnerability reporting

## License

MIT License

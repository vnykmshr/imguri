# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-XX

### 🎉 Major Release - Complete Modernization

This release represents a complete rewrite of imguri with modern JavaScript, clean architecture, and improved developer experience.

### ✨ Added

- **Modern JavaScript**: Full ES modules (ESM) support with dual CJS/ESM exports
- **TypeScript Support**: Complete TypeScript definitions for type safety
- **Promise-based API**: Modern async/await API (breaking change from callbacks)
- **Native Fetch**: Uses Node.js native fetch API (no deprecated `request` library)
- **Clean Architecture**: Organized codebase with separation of concerns
- **Comprehensive Tests**: Full test suite with Vitest and coverage reporting
- **CI/CD**: GitHub Actions workflow for automated testing
- **Code Quality Tools**: ESLint and Prettier configuration
- **Better Error Handling**: More descriptive error messages and proper error types
- **Concurrency Control**: Configurable concurrent processing of multiple files
- **Backward Compatibility**: Legacy callback API via `encodeLegacy()` function

### 🔄 Changed

- **Breaking**: Minimum Node.js version is now 18.0.0 (for native fetch support)
- **Breaking**: Default export changed from callback-based to promise-based API
- **Breaking**: Results format changed from plain object to Map with structured results
- **Improved**: Better MIME type detection using `mime-types` library
- **Improved**: More reliable file size validation before reading
- **Improved**: HTTP requests now have proper timeout and abort support

### 🗑️ Removed

- **Breaking**: Removed deprecated `async` library dependency
- **Breaking**: Removed deprecated `request` library (security vulnerability)
- **Breaking**: Removed deprecated `mime` library (replaced with `mime-types`)
- **Breaking**: Removed all deprecated Node.js APIs:
  - `new Buffer()` → `Buffer.from()`
  - `fs.exists()` → `fs.access()`
  - `util.isArray()` → `Array.isArray()`

### 🔒 Security

- Eliminated all deprecated dependencies with known vulnerabilities
- Updated to use only modern, actively maintained packages
- Improved input validation and error handling

### 📦 Dependencies

- Added: `mime-types@^2.1.35` (replacement for deprecated `mime`)
- Removed: `async@^2.6.0` (no longer needed with async/await)
- Removed: `request@^2.83.0` (replaced with native fetch)
- Removed: `mime@^2.2.0` (replaced with `mime-types`)

### 📝 Documentation

- Completely rewritten README with modern examples
- Added comprehensive API documentation
- Added TypeScript usage examples
- Added migration guide from v0.x
- Added architecture overview
- Added detailed use cases and best practices

---

## [0.0.6] - Previous Release

### Changed

- Package updates
- Minor bug fixes

## [0.0.5] - Previous Release

### Changed

- Package updates
- Dependency version bumps

---

## Migration Guide: v0.x to v1.0

### Before (v0.x)

```javascript
const imguri = require('imguri');

imguri.encode(['image.png'], { force: false }, (err, results) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(results['image.png'].data);
});
```

### After (v1.0) - Recommended

```javascript
import { encode } from 'imguri';

const results = await encode(['image.png'], { force: false });
const result = results.get('image.png');

if (result.error) {
  console.error(result.error);
} else {
  console.log(result.data);
}
```

### After (v1.0) - Using Legacy API

```javascript
import { encodeLegacy } from 'imguri';

encodeLegacy(['image.png'], { force: false }, (err, results) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(results['image.png'].data);
});
```

[1.0.0]: https://github.com/vnykmshr/imguri/compare/v0.0.6...v1.0.0
[0.0.6]: https://github.com/vnykmshr/imguri/releases/tag/v0.0.6
[0.0.5]: https://github.com/vnykmshr/imguri/releases/tag/v0.0.5

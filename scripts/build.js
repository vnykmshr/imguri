/**
 * Build script to generate CJS and ESM bundles
 * Keeps it lean - no bundler needed for such a simple library
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');
const distDir = join(rootDir, 'dist');

/**
 * Convert ESM import/export to CommonJS require/module.exports
 */
function esmToCjs(code) {
  let transformed = code;

  // Convert named imports: import { x, y } from 'module'
  transformed = transformed.replace(
    /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g,
    (match, imports, module) => {
      const namedImports = imports.split(',').map((s) => s.trim());
      return `const { ${namedImports.join(', ')} } = require('${module}')`;
    }
  );

  // Convert default imports: import x from 'module'
  transformed = transformed.replace(
    /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    "const $1 = require('$2')"
  );

  // Convert named exports: export { x, y }
  transformed = transformed.replace(/export\s+\{([^}]+)\}/g, (match, exports) => {
    const namedExports = exports.split(',').map((s) => s.trim());
    return namedExports.map((exp) => `exports.${exp} = ${exp}`).join(';\n');
  });

  // Convert export async function
  transformed = transformed.replace(
    /export\s+async\s+function\s+(\w+)/g,
    'async function $1'
  );

  // Convert export const/function/class
  transformed = transformed.replace(
    /export\s+(const|function|class)\s+(\w+)/g,
    '$1 $2'
  );

  // Add module.exports at the end for exported items
  const exportMatches = [
    ...(code.match(/export\s+async\s+function\s+(\w+)/g) || []),
    ...(code.match(/export\s+(const|function|class)\s+(\w+)/g) || []),
  ];

  if (exportMatches.length > 0) {
    const exportedNames = exportMatches
      .map((match) => {
        const nameMatch = match.match(
          /export\s+(?:async\s+)?(?:const|function|class)\s+(\w+)/
        );
        return nameMatch ? nameMatch[1] : null;
      })
      .filter(Boolean);

    if (exportedNames.length > 0) {
      transformed +=
        '\n\n' + exportedNames.map((name) => `exports.${name} = ${name};`).join('\n');
    }
  }

  // Convert default export
  transformed = transformed.replace(/export\s+default\s+/g, 'module.exports = ');

  // Fix relative imports to use .cjs extension
  transformed = transformed.replace(
    /require\(['"](\.\/.+?)(?:\.js)?['"]\)/g,
    "require('$1.cjs')"
  );

  return transformed;
}

/**
 * Update ESM imports to use .mjs extension
 */
function fixEsmImports(code) {
  return code.replace(/from\s+['"](\.\/.+?)(?:\.js)?['"]/g, "from '$1.mjs'");
}

/**
 * Recursively get all .js files in a directory
 */
async function getAllJsFiles(dir, fileList = []) {
  const files = await readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = join(dir, file.name);

    if (file.isDirectory()) {
      await getAllJsFiles(filePath, fileList);
    } else if (file.name.endsWith('.js')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Main build function
 */
async function build() {
  console.log('🔨 Building imguri...\n');

  // Create dist directory
  await mkdir(distDir, { recursive: true });

  // Get all source files
  const sourceFiles = await getAllJsFiles(srcDir);

  for (const sourceFile of sourceFiles) {
    const relPath = relative(srcDir, sourceFile);
    const code = await readFile(sourceFile, 'utf-8');

    // Generate ESM version (.mjs)
    const mjsCode = fixEsmImports(code);
    const mjsPath = join(distDir, relPath.replace(/\.js$/, '.mjs'));
    await mkdir(dirname(mjsPath), { recursive: true });
    await writeFile(mjsPath, mjsCode);
    console.log(`✅ Generated ${relative(rootDir, mjsPath)}`);

    // Generate CJS version (.cjs)
    const cjsCode = esmToCjs(code);
    const cjsPath = join(distDir, relPath.replace(/\.js$/, '.cjs'));
    await mkdir(dirname(cjsPath), { recursive: true });
    await writeFile(cjsPath, cjsCode);
    console.log(`✅ Generated ${relative(rootDir, cjsPath)}`);
  }

  console.log('\n✨ Build complete!\n');
}

build().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});

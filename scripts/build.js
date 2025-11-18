// Simple build script using esbuild for reliable ESM→CJS transformation
import { build } from 'esbuild';
import { rm } from 'fs/promises';

const entryPoint = 'src/imguri.js';

async function buildAll() {
  console.log('🔨 Building imguri...\n');

  // Clean dist directory
  await rm('dist', { recursive: true, force: true });

  // Build ESM version
  await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'dist/index.mjs',
    external: ['mime-types'],
  });
  console.log('✅ Generated dist/index.mjs');

  // Build CJS version
  await build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: 'dist/index.cjs',
    external: ['mime-types'],
  });
  console.log('✅ Generated dist/index.cjs');

  console.log('\n✨ Build complete!\n');
}

buildAll().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});

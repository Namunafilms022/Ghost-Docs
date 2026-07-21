import * as esbuild from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const workspacePkgs = {
  '@ghost-docs/types': '../../packages/types/src/index.ts',
  '@ghost-docs/config': '../../packages/config/src/index.ts',
  '@ghost-docs/llm': '../../packages/llm/src/index.ts',
  '@ghost-docs/intelligence-engine': '../../packages/intelligence-engine/src/index.ts',
  '@ghost-docs/parser': '../../packages/parser/src/index.ts',
  '@ghost-docs/github': '../../packages/github/src/index.ts',
  '@ghost-docs/docs': '../../packages/docs/src/index.ts',
  '@ghost-docs/shared': '../../packages/shared/src/index.ts',
  '@ghost-docs/reasoning-engine': '../../packages/reasoning-engine/src/index.ts',
  '@ghost-docs/sync-engine': '../../packages/sync-engine/src/index.ts',
};

const alias = {};
for (const [pkg, relPath] of Object.entries(workspacePkgs)) {
  alias[pkg] = resolve(root, relPath);
}

await esbuild.build({
  entryPoints: [resolve(root, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: resolve(root, 'dist/cli.cjs'),
  alias,

  sourcemap: false,
  minify: false,
  treeShaking: true,
});

console.log('✅ Bundled to dist/cli.mjs');

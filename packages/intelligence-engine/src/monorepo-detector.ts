import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ScannedFile, MonorepoInfo } from '@ghost-docs/types';

async function tryReadJson(filePath: string): Promise<Record<string, unknown> | null> {
  try { return JSON.parse(await readFile(filePath, 'utf-8')); } catch { return null; }
}

export async function detectMonorepo(files: ScannedFile[], rootPath: string): Promise<MonorepoInfo> {
  const names = new Set(files.map((f) => f.name));
  const info: MonorepoInfo = { isMonorepo: false, type: null, packages: [], packageManager: null };

  const rootPkg = await tryReadJson(join(rootPath, 'package.json'));
  if (rootPkg) {
    if (rootPkg.workspaces || names.has('lerna.json') || names.has('nx.json') || names.has('turbo.json') || names.has('pnpm-workspace.yaml')) {
      info.isMonorepo = true;
      if (names.has('pnpm-workspace.yaml')) { info.type = 'pnpm workspace'; info.packageManager = 'pnpm'; }
      else if (names.has('lerna.json')) { info.type = 'lerna'; info.packageManager = 'lerna'; }
      else if (names.has('nx.json')) { info.type = 'nx'; info.packageManager = 'nx'; }
      else if (names.has('turbo.json')) { info.type = 'turborepo'; info.packageManager = 'turbo'; }
      else { info.type = 'npm/yarn workspaces'; info.packageManager = 'npm/yarn'; }
      const dirs = files.filter((f) => f.relativePath.startsWith('packages/') || f.relativePath.startsWith('apps/')).map((f) => f.relativePath.split('/')[1]);
      info.packages = [...new Set(dirs)];
    }
  }

  const subCargo = files.filter((f) => f.name === 'Cargo.toml' && f.relativePath !== 'Cargo.toml');
  if (subCargo.length > 0) { info.isMonorepo = true; info.type = 'cargo workspace'; info.packageManager = 'cargo'; info.packages = subCargo.map((f) => f.relativePath.split('/')[0]); }

  const goMods = files.filter((f) => f.name === 'go.mod');
  if (goMods.length > 1) { info.isMonorepo = true; info.type = 'go workspace'; info.packageManager = 'go'; info.packages = goMods.map((f) => f.relativePath.split('/')[0]).filter(Boolean); }

  return info;
}

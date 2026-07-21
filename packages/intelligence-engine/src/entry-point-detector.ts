import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ScannedFile, EntryPointInfo } from '@ghost-docs/types';
import { EntryPointType, EntryPointConfidence } from '@ghost-docs/types';

async function tryReadJson(filePath: string): Promise<Record<string, unknown> | null> {
  try { return JSON.parse(await readFile(filePath, 'utf-8')); } catch { return null; }
}

const NAME_PATTERNS = [
  { name: 'index.ts', type: EntryPointType.Main, confidence: EntryPointConfidence.High },
  { name: 'index.js', type: EntryPointType.Main, confidence: EntryPointConfidence.High },
  { name: 'index.mjs', type: EntryPointType.Main, confidence: EntryPointConfidence.High },
  { name: 'main.ts', type: EntryPointType.Main, confidence: EntryPointConfidence.High },
  { name: 'main.js', type: EntryPointType.Main, confidence: EntryPointConfidence.High },
  { name: 'main.py', type: EntryPointType.Main, confidence: EntryPointConfidence.High },
  { name: 'main.rs', type: EntryPointType.Main, confidence: EntryPointConfidence.High },
  { name: 'main.go', type: EntryPointType.Main, confidence: EntryPointConfidence.High },
  { name: 'main.java', type: EntryPointType.Main, confidence: EntryPointConfidence.High },
  { name: 'app.ts', type: EntryPointType.Server, confidence: EntryPointConfidence.High },
  { name: 'app.js', type: EntryPointType.Server, confidence: EntryPointConfidence.High },
  { name: 'server.ts', type: EntryPointType.Server, confidence: EntryPointConfidence.High },
  { name: 'server.js', type: EntryPointType.Server, confidence: EntryPointConfidence.High },
  { name: 'cli.ts', type: EntryPointType.CLI, confidence: EntryPointConfidence.Medium },
  { name: 'cli.js', type: EntryPointType.CLI, confidence: EntryPointConfidence.Medium },
];

const DIR_PATTERNS = ['cmd', 'bin', 'cli', 'entry'];

export async function detectEntryPoints(
  files: ScannedFile[], rootPath: string, packageManagerName?: string,
): Promise<EntryPointInfo[]> {
  const entryPoints: EntryPointInfo[] = [];
  const fileNameMap = new Map(files.map((f) => [f.name, f]));

  for (const p of NAME_PATTERNS) {
    const file = fileNameMap.get(p.name);
    if (file) {
      entryPoints.push({
        path: file.relativePath, type: p.type,
        confidence: file.relativePath === file.name ? p.confidence : EntryPointConfidence.Medium,
        reason: `File name matches entry point pattern: ${p.name}`,
      });
    }
  }

  for (const dir of DIR_PATTERNS) {
    for (const f of files) {
      if ((f.relativePath.startsWith(`${dir}/`) || f.relativePath.startsWith(`src/${dir}/`)) && ['.ts', '.js', '.py', '.rs', '.go'].includes(f.extension)) {
        entryPoints.push({ path: f.relativePath, type: EntryPointType.CLI, confidence: EntryPointConfidence.Medium, reason: `Located in entry point directory: ${dir}` });
      }
    }
  }

  if (packageManagerName && ['npm', 'yarn', 'pnpm'].includes(packageManagerName)) {
    const pkg = await tryReadJson(join(rootPath, 'package.json'));
    if (pkg) {
      if (pkg.main && typeof pkg.main === 'string') {
        const mainCandidates = [pkg.main, `./${pkg.main}`, `src/${pkg.main}`, `lib/${pkg.main}`];
        for (const candidate of mainCandidates) {
          const mainFile = files.find((f) => f.relativePath === candidate);
          if (mainFile) {
            entryPoints.push({ path: mainFile.relativePath, type: EntryPointType.Main, confidence: EntryPointConfidence.High, reason: 'Defined as "main" in package.json' });
            break;
          }
        }
      }
      if (pkg.exports && typeof pkg.exports === 'object') {
        for (const [key, val] of Object.entries(pkg.exports as Record<string, unknown>)) {
          if (key === '.' || key.startsWith('./')) {
            const exportPath = key === '.' ? (typeof val === 'object' ? (val as Record<string, string>)['import'] || (val as Record<string, string>)['default'] : val) : key;
            if (typeof exportPath === 'string') {
              const epFile = files.find((f) => f.relativePath === exportPath || f.relativePath === `./${exportPath}`);
              if (epFile) entryPoints.push({ path: epFile.relativePath, type: EntryPointType.Main, confidence: EntryPointConfidence.High, reason: 'Defined in "exports" in package.json' });
            }
          }
        }
      }
      if (pkg.bin) {
        if (typeof pkg.bin === 'string') {
          const binFile = files.find((f) => f.relativePath === pkg.bin);
          if (binFile) entryPoints.push({ path: binFile.relativePath, type: EntryPointType.CLI, confidence: EntryPointConfidence.High, reason: 'Defined as "bin" in package.json' });
        } else if (typeof pkg.bin === 'object') {
          for (const binPath of Object.values(pkg.bin as Record<string, string>)) {
            const binFile = files.find((f) => f.relativePath === binPath);
            if (binFile) entryPoints.push({ path: binFile.relativePath, type: EntryPointType.CLI, confidence: EntryPointConfidence.High, reason: 'Defined as "bin" in package.json' });
          }
        }
      }
    }
  }

  const unique = new Map<string, EntryPointInfo>();
  const confOrder = { high: 0, medium: 1, low: 2 };
  for (const ep of entryPoints) {
    const existing = unique.get(ep.path);
    if (!existing || confOrder[ep.confidence] < confOrder[existing.confidence]) {
      unique.set(ep.path, ep);
    }
  }

  return Array.from(unique.values()).sort((a, b) => confOrder[a.confidence] - confOrder[b.confidence]);
}

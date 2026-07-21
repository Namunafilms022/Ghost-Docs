import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename, relative } from 'node:path';
import { DEFAULT_EXCLUDE_PATTERNS } from '@ghost-docs/types';
import type { ScannedFile, ScanResult } from '@ghost-docs/types';

function shouldExclude(name: string, excludePatterns: string[]): boolean {
  for (const pattern of excludePatterns) {
    if (pattern.startsWith('*.')) {
      if (basename(name) === name && name.endsWith(pattern.slice(1))) return true;
    } else if (name === pattern) {
      return true;
    }
  }
  return false;
}

async function walkDir(
  dirPath: string,
  rootPath: string,
  excludePatterns: string[],
): Promise<{ files: ScannedFile[]; dirs: string[] }> {
  const files: ScannedFile[] = [];
  const dirs: string[] = [];

  let entries: string[];
  try {
    entries = await readdir(dirPath);
  } catch {
    return { files, dirs };
  }

  for (const entry of entries) {
    if (shouldExclude(entry, excludePatterns)) continue;

    const fullPath = join(dirPath, entry);
    let entryStat;
    try {
      entryStat = await stat(fullPath);
    } catch {
      continue;
    }

    if (entryStat.isDirectory()) {
      dirs.push(fullPath);
      const sub = await walkDir(fullPath, rootPath, excludePatterns);
      files.push(...sub.files);
      dirs.push(...sub.dirs);
    } else if (entryStat.isFile()) {
      files.push({
        path: fullPath,
        name: entry,
        extension: extname(entry).toLowerCase(),
        size: entryStat.size,
        relativePath: relative(rootPath, fullPath),
      });
    }
  }

  return { files, dirs };
}

export async function scanDirectory(
  dirPath: string,
  excludePatterns: string[] = DEFAULT_EXCLUDE_PATTERNS,
): Promise<ScanResult> {
  const { files, dirs } = await walkDir(dirPath, dirPath, excludePatterns);

  const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0);

  return {
    files,
    directories: dirs,
    totalFiles: files.length,
    totalDirs: dirs.length,
    totalSizeBytes,
  };
}

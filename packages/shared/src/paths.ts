import { existsSync } from 'node:fs';
import { resolve, relative, sep, isAbsolute } from 'node:path';

export function resolveRepoPath(input: string): string {
  if (isAbsolute(input)) return input;
  return resolve(process.cwd(), input);
}

export function isGitHubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/.test(url) || /^git@github\.com:/.test(url);
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const httpsMatch = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2].replace('.git', '') };
  }
  return null;
}

export function findUp(filename: string, cwd: string = process.cwd()): string | null {
  let dir = resolve(cwd);
  while (true) {
    const candidate = resolve(dir, filename);
    if (existsSync(candidate)) return candidate;
    const parent = resolve(dir, '..');
    if (parent === dir) return null;
    dir = parent;
  }
}

export function toPosixPath(filePath: string): string {
  return filePath.split(sep).join('/');
}

export function relativePath(from: string, to: string): string {
  return toPosixPath(relative(from, to));
}

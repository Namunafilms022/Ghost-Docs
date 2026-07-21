import { mkdtemp, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import simpleGit from 'simple-git';

import type { RepositoryInfo, ProjectIntelligenceConfig } from '@ghost-docs/types';

export interface FetchedRepo {
  path: string;
  cleanup: () => Promise<void>;
}

const GITHUB_URL_REGEX = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+/;
const GIT_SSH_REGEX = /^git@github\.com:[\w.-]+\/[\w.-]+/;

function isGitHubUrl(input: string): boolean {
  return GITHUB_URL_REGEX.test(input) || GIT_SSH_REGEX.test(input);
}

function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const match = url.match(/github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (!match) throw new Error(`Invalid GitHub URL: ${url}`);
  return { owner: match[1], repo: match[2] };
}

async function cloneRepo(url: string, targetDir: string): Promise<void> {
  const git = simpleGit();
  try {
    await git.clone(url, targetDir, {
      '--depth': '1',
      '--single-branch': null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Repository not found') || msg.includes('not found') || msg.includes('404')) {
      throw new Error(`Repository not found at ${url}. Check the URL and ensure it exists.`);
    }
    if (msg.includes('could not read Username') || msg.includes('Authentication failed')) {
      throw new Error(`Failed to clone ${url}. Try setting GITHUB_TOKEN for private repos or check network connectivity.`);
    }
    if (msg.includes('rate limit')) {
      throw new Error(`GitHub rate limit exceeded. Set GITHUB_TOKEN or try again later.`);
    }
    throw err;
  }
}

async function getDefaultBranch(localPath: string): Promise<string | null> {
  try {
    const git = simpleGit(localPath);
    const branch = await git.branch();
    return branch.current;
  } catch {
    return null;
  }
}

export async function fetchRepository(
  input: string,
  tempDir?: string,
): Promise<FetchedRepo> {
  if (isGitHubUrl(input)) {
    const baseDir = tempDir ?? (await mkdtemp(join(tmpdir(), 'ghost-docs-')));
    const { repo } = parseGitHubUrl(input);
    const clonePath = join(baseDir, repo);

    await cloneRepo(input, clonePath);
    return {
      path: clonePath,
      cleanup: async () => {
        const { rm } = await import('node:fs/promises');
        await rm(clonePath, { recursive: true, force: true });
      },
    };
  }

  const resolvedPath = await realpath(input);
  if (!existsSync(resolvedPath)) {
    throw new Error(`Local path does not exist: ${input}`);
  }
  return {
    path: resolvedPath,
    cleanup: async () => {},
  };
}

export async function buildRepositoryInfo(
  localPath: string,
  url: string,
): Promise<RepositoryInfo> {
  const { scanDirectory } = await import('./file-scanner.js');
  const scan = await scanDirectory(localPath);
  const defaultBranch = await getDefaultBranch(localPath);

  return {
    url,
    localPath,
    defaultBranch,
    totalFiles: scan.totalFiles,
    totalDirs: scan.totalDirs,
    sizeBytes: scan.totalSizeBytes,
  };
}

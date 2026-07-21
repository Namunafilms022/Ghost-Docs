import { Octokit } from 'octokit';
import type { GitHubConfig } from './types.js';

export function createClient(config: GitHubConfig): Octokit {
  return new Octokit({ auth: config.token });
}

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const httpsMatch = url.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2].replace('.git', '') };

  const sshMatch = url.match(/git@github\.com:([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2].replace('.git', '') };

  return null;
}

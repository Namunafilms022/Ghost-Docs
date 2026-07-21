import type { PullRequestData, DocumentationPatch } from '@ghost-docs/types';
import { Octokit } from 'octokit';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export class GitHubAdapter {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({ auth: config.token });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  async createBranch(base: string, branchName: string): Promise<void> {
    const { data: ref } = await this.octokit.rest.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${base}`,
    });

    await this.octokit.rest.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha,
    });
  }

  async commitFiles(
    branch: string,
    message: string,
    patches: DocumentationPatch[],
  ): Promise<void> {
    const { data: ref } = await this.octokit.rest.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${branch}`,
    });

    const { data: baseTree } = await this.octokit.rest.git.getTree({
      owner: this.owner,
      repo: this.repo,
      tree_sha: ref.object.sha,
    });

    const tree = await Promise.all(
      patches.map(async (patch) => {
        const { data: blob } = await this.octokit.rest.git.createBlob({
          owner: this.owner,
          repo: this.repo,
          content: patch.patchedContent,
          encoding: 'utf-8',
        });

        return {
          path: patch.filePath,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      }),
    );

    const { data: newTree } = await this.octokit.rest.git.createTree({
      owner: this.owner,
      repo: this.repo,
      base_tree: baseTree.sha,
      tree,
    });

    const { data: newCommit } = await this.octokit.rest.git.createCommit({
      owner: this.owner,
      repo: this.repo,
      message,
      tree: newTree.sha,
      parents: [ref.object.sha],
    });

    await this.octokit.rest.git.updateRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${branch}`,
      sha: newCommit.sha,
    });
  }

  async createPR(pr: PullRequestData): Promise<string> {
    const { data } = await this.octokit.rest.pulls.create({
      owner: this.owner,
      repo: this.repo,
      title: pr.title,
      body: pr.body,
      head: pr.branch,
      base: pr.base,
    });

    return data.html_url;
  }
}

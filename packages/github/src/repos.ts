import type { Octokit } from 'octokit';
import type { RepoInfo, BranchInfo, FileContent } from './types.js';

export async function getRepoInfo(client: Octokit, owner: string, repo: string): Promise<RepoInfo> {
  const { data } = await client.rest.repos.get({ owner, repo });
  return {
    name: data.name,
    owner: data.owner.login,
    fullName: data.full_name,
    description: data.description,
    defaultBranch: data.default_branch,
    isPrivate: data.private,
    htmlUrl: data.html_url,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    language: data.language,
    topics: data.topics || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function listBranches(client: Octokit, owner: string, repo: string): Promise<BranchInfo[]> {
  const defaultBranch = await getDefaultBranch(client, owner, repo);
  const { data } = await client.rest.repos.listBranches({ owner, repo, per_page: 100 });
  return data.map((b) => ({
    name: b.name,
    sha: b.commit.sha,
    isDefault: b.name === defaultBranch,
  }));
}

export async function getDefaultBranch(client: Octokit, owner: string, repo: string): Promise<string> {
  const { data } = await client.rest.repos.get({ owner, repo });
  return data.default_branch;
}

export async function getFileContent(client: Octokit, owner: string, repo: string, path: string, ref?: string): Promise<FileContent | null> {
  try {
    const { data } = await client.rest.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });
    if ('content' in data && 'encoding' in data) {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      return {
        path: data.path,
        content,
        sha: data.sha,
        size: data.size,
        encoding: data.encoding,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createOrUpdateFile(
  client: Octokit,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  sha?: string,
): Promise<void> {
  await client.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
    sha,
  });
}

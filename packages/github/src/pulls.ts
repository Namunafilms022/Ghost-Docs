import type { Octokit } from 'octokit';
import type { PRInfo } from './types.js';

export async function createPullRequest(
  client: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string,
): Promise<PRInfo> {
  const { data } = await client.rest.pulls.create({ owner, repo, title, body, head, base });
  return {
    number: data.number,
    title: data.title,
    body: data.body || '',
    state: data.state as PRInfo['state'],
    htmlUrl: data.html_url,
    head: data.head.ref,
    base: data.base.ref,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function listPullRequests(
  client: Octokit,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
): Promise<PRInfo[]> {
  const { data } = await client.rest.pulls.list({ owner, repo, state, per_page: 100 });
  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    body: pr.body || '',
    state: pr.state as PRInfo['state'],
    htmlUrl: pr.html_url,
    head: pr.head.ref,
    base: pr.base.ref,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
  }));
}

export async function getPullRequest(client: Octokit, owner: string, repo: string, pullNumber: number): Promise<PRInfo> {
  const { data } = await client.rest.pulls.get({ owner, repo, pull_number: pullNumber });
  return {
    number: data.number,
    title: data.title,
    body: data.body || '',
    state: data.state as PRInfo['state'],
    htmlUrl: data.html_url,
    head: data.head.ref,
    base: data.base.ref,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function mergePullRequest(
  client: Octokit,
  owner: string,
  repo: string,
  pullNumber: number,
  mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash',
): Promise<void> {
  await client.rest.pulls.merge({ owner, repo, pull_number: pullNumber, merge_method: mergeMethod });
}

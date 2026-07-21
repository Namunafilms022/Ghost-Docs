import type { Octokit } from 'octokit';
import type { IssueInfo } from './types.js';

export async function createIssue(
  client: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string,
  labels?: string[],
  assignees?: string[],
): Promise<IssueInfo> {
  const { data } = await client.rest.issues.create({ owner, repo, title, body, labels, assignees });
  return {
    number: data.number,
    title: data.title,
    body: data.body || '',
    state: data.state as IssueInfo['state'],
    labels: data.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
    assignees: (data.assignees || []).map((a) => (typeof a === 'string' ? a : a.login)),
    htmlUrl: data.html_url,
    createdAt: data.created_at,
  };
}

export async function listIssues(
  client: Octokit,
  owner: string,
  repo: string,
  state: 'open' | 'closed' | 'all' = 'open',
): Promise<IssueInfo[]> {
  const { data } = await client.rest.issues.listForRepo({ owner, repo, state, per_page: 100 });
  return data
    .filter((i) => !i.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body || '',
      state: issue.state as IssueInfo['state'],
      labels: issue.labels.map((l) => (typeof l === 'string' ? l : l.name || '')),
      assignees: (issue.assignees || []).map((a) => (typeof a === 'string' ? a : a.login)),
      htmlUrl: issue.html_url,
      createdAt: issue.created_at,
    }));
}

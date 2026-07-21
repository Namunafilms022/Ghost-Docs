export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

export interface PRInfo {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed' | 'merged';
  htmlUrl: string;
  head: string;
  base: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepoInfo {
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  isPrivate: boolean;
  htmlUrl: string;
  stars: number;
  forks: number;
  openIssues: number;
  language: string | null;
  topics: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BranchInfo {
  name: string;
  sha: string;
  isDefault: boolean;
}

export interface FileContent {
  path: string;
  content: string;
  sha: string;
  size: number;
  encoding: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

export interface WorkflowRun {
  id: number;
  name: string;
  headBranch: string;
  status: string;
  conclusion: string | null;
  htmlUrl: string;
  createdAt: string;
}

export interface IssueInfo {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: string[];
  assignees: string[];
  htmlUrl: string;
  createdAt: string;
}

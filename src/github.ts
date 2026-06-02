import type { GithubIssueRef } from "./types.js";

const GITHUB_API = "https://api.github.com";

export function parseGithubIssueUrl(issueUrl: string): GithubIssueRef {
  const match = issueUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)(?:[/?#].*)?$/);
  if (!match) {
    throw new Error(`Expected a GitHub issue URL, got: ${issueUrl}`);
  }
  const [, owner, repo, rawNumber] = match;
  const number = Number(rawNumber);
  return {
    owner,
    repo,
    number,
    fullName: `${owner}/${repo}`,
  };
}

export async function githubGet<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "hedera-bountypay-scout-agent",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetch(`${GITHUB_API}${path}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${body.slice(0, 500)}`);
  }
  return response.json() as Promise<T>;
}

export interface GithubLabel {
  name: string;
}

export interface GithubIssue {
  html_url: string;
  number: number;
  title: string;
  body: string | null;
  state: string;
  comments: number;
  assignee: unknown | null;
  labels: GithubLabel[];
  created_at: string;
  updated_at: string;
}

export interface GithubRepo {
  full_name: string;
  html_url: string;
  description: string | null;
  archived: boolean;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
}

export interface GithubComment {
  body: string | null;
  user: {
    login: string;
  } | null;
  html_url: string;
  created_at: string;
}

export interface GithubPullRequest {
  html_url: string;
  number: number;
  title: string;
  body: string | null;
  user: {
    login: string;
  } | null;
  created_at: string;
}

export async function fetchIssueBundle(issueUrl: string): Promise<{
  ref: GithubIssueRef;
  issue: GithubIssue;
  repo: GithubRepo;
  comments: GithubComment[];
  openPulls: GithubPullRequest[];
}> {
  const ref = parseGithubIssueUrl(issueUrl);
  const [issue, repo, comments, openPulls] = await Promise.all([
    githubGet<GithubIssue>(`/repos/${ref.fullName}/issues/${ref.number}`),
    githubGet<GithubRepo>(`/repos/${ref.fullName}`),
    githubGet<GithubComment[]>(`/repos/${ref.fullName}/issues/${ref.number}/comments?per_page=100`),
    githubGet<GithubPullRequest[]>(`/repos/${ref.fullName}/pulls?state=open&per_page=100`),
  ]);
  return { ref, issue, repo, comments, openPulls };
}

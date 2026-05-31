import { Octokit } from '@octokit/rest';
import config from '../config/index.js';
import type { GithubUser } from '../types/index.js';

interface GithubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const response = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code,
      }),
    }
  );

  const data = (await response.json()) as GithubTokenResponse;

  if (!data.access_token) {
    throw new Error('Failed to exchange code for token');
  }

  return data.access_token;
}

export async function getGithubUser(token: string): Promise<GithubUser> {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.users.getAuthenticated();

  return {
    id: data.id,
    login: data.login,
    avatar_url: data.avatar_url,
    name: data.name,
    email: data.email,
  };
}

export function getInstallationsOctokit(token: string): Octokit {
  return new Octokit({ auth: token });
}

export function getAppOctokit(installationId: number): Octokit {
  return new Octokit({
    authStrategy: undefined,
    auth: { installationId },
  });
}

export async function getUserRepositories(token: string) {
  const octokit = getInstallationsOctokit(token);
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 50,
  });
  return data;
}

export async function createReviewComment(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  commitId: string,
  path: string,
  position: number
) {
  const octokit = getInstallationsOctokit('');
  const { data } = await octokit.rest.pulls.createReviewComment({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    commit_id: commitId,
    path,
    position,
  });
  return data;
}

export async function createPullRequestReview(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT'
) {
  const octokit = getInstallationsOctokit('');
  const { data } = await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: pullNumber,
    body,
    event,
  });
  return data;
}

export async function getPullRequestDiff(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string> {
  const octokit = getInstallationsOctokit('');
  const response = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
    mediaType: { format: 'diff' },
  });

  return response.data as unknown as string;
}

export async function getFileContent(
  installationId: number,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<string> {
  const octokit = getInstallationsOctokit('');
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  if ('content' in data) {
    return Buffer.from(data.content, 'base64').toString('utf-8');
  }
  throw new Error('Expected file content but got directory');
}

export async function createOrUpdateFile(
  installationId: number,
  owner: string,
  repo: string,
  path: string,
  message: string,
  content: string,
  branch: string,
  sha?: string
) {
  const octokit = getInstallationsOctokit('');
  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
    sha,
  });
  return data;
}

export async function createFork(
  installationId: number,
  owner: string,
  repo: string
) {
  const octokit = getInstallationsOctokit('');
  const { data } = await octokit.rest.repos.createFork({
    owner,
    repo,
  });
  return data;
}

export async function createPullRequest(
  installationId: number,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body: string
) {
  const octokit = getInstallationsOctokit('');
  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
  });
  return data;
}
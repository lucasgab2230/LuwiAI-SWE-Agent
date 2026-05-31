export interface GithubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface InstallationsResponse {
  installations: GithubInstallation[];
}

export interface GithubInstallation {
  id: number;
  account: {
    login: string;
    id: number;
    avatar_url: string;
  };
  repositories_url: string;
}

export interface AgentJob {
  id: string;
  userId: string;
  type: AgentJobType;
  status: AgentJobStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export enum AgentJobType {
  CODE_REVIEW = 'code_review',
  CODE_GENERATION = 'code_generation',
  BUG_FIX = 'bug_fix',
  REFACTOR = 'refactor',
  EXPLAIN_CODE = 'explain_code',
  PR_SUMMARY = 'pr_summary',
}

export enum AgentJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface CodeReviewRequest {
  repository: string;
  pullRequestNumber: number;
  installationId: number;
}

export interface CodeGenerationRequest {
  repository: string;
  description: string;
  language: string;
  filePath: string;
  installationId: number;
}

export interface AgentConfig {
  port: number;
  redisUrl: string;
  jwtSecret: string;
  githubClientId: string;
  githubClientSecret: string;
  githubAppWebhookSecret: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  allowedOrigins: string[];
}

export interface AuthPayload {
  userId: string;
  githubToken: string;
  githubUser: GithubUser;
}
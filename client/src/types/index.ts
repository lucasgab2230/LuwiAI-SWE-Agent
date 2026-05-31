export interface GithubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  updated_at: string;
  private: boolean;
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

export interface AuthState {
  token: string | null;
  user: GithubUser | null;
  isAuthenticated: boolean;
}
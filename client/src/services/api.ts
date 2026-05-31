import type { AgentJob } from '../types';

const API_BASE = '/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('luwiai_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    loginWithGithub: (code: string) =>
      request<{ token: string; user: { id: number; login: string; avatar_url: string; name: string | null; email: string | null } }>(
        '/auth/github',
        { method: 'POST', body: JSON.stringify({ code }) }
      ),
    getMe: () => request<{ user: { id: number; login: string; avatar_url: string; name: string | null; email: string | null } }>('/auth/me'),
  },
  repositories: {
    list: () =>
      request<{ repositories: Array<{ id: number; name: string; full_name: string; description: string | null; html_url: string; language: string | null; updated_at: string; private: boolean }> }>(
        '/repositories'
      ),
  },
  jobs: {
    create: (type: string, input: Record<string, unknown>) =>
      request<{ job: AgentJob }>(
        '/jobs',
        { method: 'POST', body: JSON.stringify({ type, input }) }
      ),
    list: () =>
      request<{ jobs: AgentJob[] }>(
        '/jobs'
      ),
    get: (id: string) =>
      request<{ job: AgentJob }>(
        `/jobs/${id}`
      ),
  },
  health: () => request<{ status: string; version: string; timestamp: string }>('/health'),
};
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import config from '../config/index.js';
import type { AgentJob } from '../types/index.js';

const databasePath = resolve(config.databasePath);
const databaseDirectory = dirname(databasePath);

if (!existsSync(databaseDirectory)) {
  mkdirSync(databaseDirectory, { recursive: true });
}

const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS agent_jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    input TEXT NOT NULL,
    output TEXT,
    error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_agent_jobs_user_created_at
    ON agent_jobs (user_id, created_at DESC);
`);

interface AgentJobRow {
  id: string;
  user_id: string;
  type: AgentJob['type'];
  status: AgentJob['status'];
  input: string;
  output: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

function parseJsonObject(value: string | null): Record<string, unknown> | null {
  if (value === null) return null;

  const parsed = JSON.parse(value) as unknown;
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }

  return { value: parsed };
}

function mapRowToJob(row: AgentJobRow): AgentJob {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    status: row.status,
    input: parseJsonObject(row.input) ?? {},
    output: parseJsonObject(row.output),
    error: row.error,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function saveJob(job: AgentJob): AgentJob {
  db.prepare(`
    INSERT INTO agent_jobs (
      id,
      user_id,
      type,
      status,
      input,
      output,
      error,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    job.id,
    job.userId,
    job.type,
    job.status,
    JSON.stringify(job.input),
    job.output === null ? null : JSON.stringify(job.output),
    job.error,
    job.createdAt,
    job.updatedAt
  );

  return job;
}

export function findJobById(jobId: string): AgentJob | undefined {
  const row = db
    .prepare('SELECT * FROM agent_jobs WHERE id = ?')
    .get(jobId) as unknown as AgentJobRow | undefined;

  return row ? mapRowToJob(row) : undefined;
}

export function findJobsByUserId(userId: string): AgentJob[] {
  const rows = db
    .prepare('SELECT * FROM agent_jobs WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId) as unknown as AgentJobRow[];

  return rows.map(mapRowToJob);
}

export function updatePersistedJob(
  jobId: string,
  updates: Partial<AgentJob>
): AgentJob | undefined {
  const existing = findJobById(jobId);
  if (!existing) return undefined;

  const updated: AgentJob = {
    ...existing,
    ...updates,
    id: existing.id,
    userId: updates.userId ?? existing.userId,
    createdAt: updates.createdAt ?? existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  db.prepare(`
    UPDATE agent_jobs
    SET user_id = ?,
        type = ?,
        status = ?,
        input = ?,
        output = ?,
        error = ?,
        created_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    updated.userId,
    updated.type,
    updated.status,
    JSON.stringify(updated.input),
    updated.output === null ? null : JSON.stringify(updated.output),
    updated.error,
    updated.createdAt,
    updated.updatedAt,
    updated.id
  );

  return updated;
}

export function closeJobsDatabase(): void {
  db.close();
}

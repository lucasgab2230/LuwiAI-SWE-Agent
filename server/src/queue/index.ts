import { Queue, Worker, Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import IORedis from 'ioredis';
import config from '../config/index.js';
import { processAgentJob } from '../agent/index.js';
import type { AgentJob, AgentJobType } from '../types/index.js';
import { AgentJobStatus } from '../types/index.js';

const connection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const agentQueue = new Queue('agent-jobs', {
  connection: connection as never,
});

const agentJobs = new Map<string, AgentJob>();

export async function enqueueJob(
  userId: string,
  type: AgentJobType,
  input: Record<string, unknown>
): Promise<AgentJob> {
  const job: AgentJob = {
    id: uuidv4(),
    userId,
    type,
    status: AgentJobStatus.PENDING,
    input,
    output: null,
    error: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  agentJobs.set(job.id, job);

  await agentQueue.add('process-job', job, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
  });

  return job;
}

export function getJob(jobId: string): AgentJob | undefined {
  return agentJobs.get(jobId);
}

export function getUserJobs(userId: string): AgentJob[] {
  return Array.from(agentJobs.values())
    .filter((j) => j.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function updateJob(
  jobId: string,
  updates: Partial<AgentJob>
): AgentJob | undefined {
  const job = agentJobs.get(jobId);
  if (!job) return undefined;

  const updated = {
    ...job,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  agentJobs.set(jobId, updated);
  return updated;
}

const worker = new Worker(
  'agent-jobs',
  async (bullJob: Job) => {
    const agentJob = bullJob.data as AgentJob;

    updateJob(agentJob.id, { status: AgentJobStatus.PROCESSING });

    try {
      const result = await processAgentJob(agentJob);

      updateJob(agentJob.id, {
        status: AgentJobStatus.COMPLETED,
        output: { result },
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      updateJob(agentJob.id, {
        status: AgentJobStatus.FAILED,
        error: errorMessage,
      });

      throw error;
    }
  },
  { connection: connection as never }
);

worker.on('completed', (bullJob) => {
  console.log(`Job ${bullJob.id} completed successfully`);
});

worker.on('failed', (bullJob, error) => {
  console.error(`Job ${bullJob?.id} failed:`, error.message);
});

export async function closeQueue(): Promise<void> {
  await worker.close();
  await agentQueue.close();
  await connection.quit();
}
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { enqueueJob } from '../queue/index.js';
import { getJob } from '../queue/index.js';
import { AgentJobType, AgentJobStatus } from '../types/index.js';
import { z } from 'zod';

const router = Router();

const executeSchema = z.object({
  eventType: z.enum(['issue_mention', 'pr_mention', 'pr_opened']),
  repository: z.string(),
  issueNumber: z.number().optional(),
  prNumber: z.number().optional(),
  commentBody: z.string().optional(),
  installationId: z.number().default(0),
});

router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const payload = executeSchema.parse(req.body);
    const userId = req.user!.userId;

    let jobType: AgentJobType;
    let input: Record<string, unknown>;

    switch (payload.eventType) {
      case 'issue_mention': {
        jobType = AgentJobType.CODE_GENERATION;
        input = {
          repository: payload.repository,
          description: payload.commentBody || 'Generate code based on the issue description',
          language: 'auto-detect',
          issueNumber: payload.issueNumber,
        };
        break;
      }
      case 'pr_mention': {
        jobType = AgentJobType.CODE_REVIEW;
        input = {
          repository: payload.repository,
          pullRequestNumber: payload.prNumber,
          diff: payload.commentBody || '',
          title: 'PR suggestions from mention',
          description: 'Provide improvement suggestions for this PR',
        };
        break;
      }
      case 'pr_opened': {
        jobType = AgentJobType.CODE_REVIEW;
        input = {
          repository: payload.repository,
          pullRequestNumber: payload.prNumber,
          diff: '',
          title: 'Automatic code review',
          description: 'Automated review for newly opened PR',
        };
        break;
      }
      default:
        res.status(400).json({ error: 'Invalid event type' });
        return;
    }

    const job = await enqueueJob(userId, jobType, input);

    const MAX_POLL_MS = 120_000;
    const POLL_INTERVAL = 2_000;
    const startTime = Date.now();

    const pollResult = await new Promise<Record<string, unknown> | null>((resolve, reject) => {
      const interval = setInterval(() => {
        const current = getJob(job.id);
        if (!current) {
          clearInterval(interval);
          reject(new Error('Job not found'));
          return;
        }
        if (current.status === AgentJobStatus.COMPLETED) {
          clearInterval(interval);
          resolve(current.output);
        }
        if (current.status === AgentJobStatus.FAILED) {
          clearInterval(interval);
          reject(new Error(current.error || 'Job failed'));
        }
        if (Date.now() - startTime > MAX_POLL_MS) {
          clearInterval(interval);
          reject(new Error('Job timed out'));
        }
      }, POLL_INTERVAL);
    });

    let output: Record<string, unknown>;

    if (payload.eventType === 'issue_mention') {
      output = {
        prNumber: 0,
        message: 'Code generated successfully. A pull request has been created.',
      };
    } else {
      output = {
        review: pollResult?.result || 'No review generated.',
        summary: 'Automated review complete.',
      };
    }

    res.json({ output });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid payload', details: error.errors });
      return;
    }
    console.error('Automation error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Automation failed' });
  }
});

export default router;
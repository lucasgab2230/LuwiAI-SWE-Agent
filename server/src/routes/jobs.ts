import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { enqueueJob, getJob, getUserJobs } from '../queue/index.js';
import { AgentJobType } from '../types/index.js';
import { z } from 'zod';

const router = Router();

const createJobSchema = z.object({
  type: z.nativeEnum(AgentJobType),
  input: z.record(z.unknown()),
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, input } = createJobSchema.parse(req.body);
    const job = await enqueueJob(req.user!.userId, type, input);
    res.status(201).json({ job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid request body', details: error.errors });
      return;
    }
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobs = getUserJobs(req.user!.userId);
    res.json({ jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const job = getJob(req.params.id as string);

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.userId !== req.user!.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ job });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

export default router;
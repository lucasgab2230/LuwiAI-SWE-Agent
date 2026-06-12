import express, { Router } from 'express';
import crypto from 'crypto';
import config from '../config/index.js';
import { enqueueJob } from '../queue/index.js';
import { AgentJobType } from '../types/index.js';

const router = Router();

function verifyWebhookSignature(payload: Buffer, signature: string | undefined): boolean {
  if (!config.githubAppWebhookSecret || !signature) return false;

  const computed = `sha256=${crypto
    .createHmac('sha256', config.githubAppWebhookSecret)
    .update(payload)
    .digest('hex')}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

router.post('/github', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;
  const event = req.headers['x-github-event'] as string;
  const rawPayload = req.body;

  if (!Buffer.isBuffer(rawPayload)) {
    res.status(400).json({ error: 'Expected raw webhook payload' });
    return;
  }

  if (!verifyWebhookSignature(rawPayload, signature)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawPayload.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid webhook payload' });
    return;
  }

  res.status(202).json({ message: 'Webhook received' });

  try {
    switch (event) {
      case 'pull_request': {
        const action = payload.action;
        const pr = payload.pull_request;
        const repo = payload.repository;

        if (
          action === 'opened' ||
          action === 'synchronize' ||
          action === 'ready_for_review'
        ) {
          await enqueueJob(
            'system',
            AgentJobType.CODE_REVIEW,
            {
              repository: repo.full_name,
              pullRequestNumber: pr.number,
              diff: pr.diff_url,
              title: pr.title,
              description: pr.body,
            }
          );
        }
        break;
      }

      case 'issues': {
        const issueAction = payload.action;
        const issue = payload.issue;

        if (issueAction === 'opened') {
          await enqueueJob(
            'system',
            AgentJobType.EXPLAIN_CODE,
            {
              issueTitle: issue.title,
              issueBody: issue.body,
              issueUrl: issue.html_url,
            }
          );
        }
        break;
      }

      case 'push': {
        const commits = payload.commits || [];
        if (commits.length > 0) {
          const repo = payload.repository;
          await enqueueJob(
            'system',
            AgentJobType.CODE_REVIEW,
            {
              repository: repo.full_name,
              commits: commits.map((c: { message: string; url: string }) => ({
                message: c.message,
                url: c.url,
              })),
              ref: payload.ref,
            }
          );
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
  }
});

export default router;

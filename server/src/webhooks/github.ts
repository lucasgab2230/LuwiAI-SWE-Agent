import { Router } from 'express';
import crypto from 'crypto';
import config from '../config/index.js';
import { enqueueJob } from '../queue/index.js';
import { AgentJobType } from '../types/index.js';

const router = Router();

function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!config.githubAppWebhookSecret) return false;

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

router.post('/webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const event = req.headers['x-github-event'] as string;
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature)) {
    res.status(401).json({ error: 'Invalid webhook signature' });
    return;
  }

  res.status(202).json({ message: 'Webhook received' });

  try {
    switch (event) {
      case 'pull_request': {
        const action = req.body.action;
        const pr = req.body.pull_request;
        const repo = req.body.repository;

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
        const issueAction = req.body.action;
        const issue = req.body.issue;

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
        const commits = req.body.commits || [];
        if (commits.length > 0) {
          const repo = req.body.repository;
          await enqueueJob(
            'system',
            AgentJobType.CODE_REVIEW,
            {
              repository: repo.full_name,
              commits: commits.map((c: { message: string; url: string }) => ({
                message: c.message,
                url: c.url,
              })),
              ref: req.body.ref,
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
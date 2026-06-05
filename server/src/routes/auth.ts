import { Router } from 'express';
import { Octokit } from '@octokit/rest';
import { exchangeCodeForToken, getGithubUser } from '../github/auth.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/github', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' });
      return;
    }

    const githubToken = await exchangeCodeForToken(code);
    const githubUser = await getGithubUser(githubToken);

    const token = generateToken({
      userId: String(githubUser.id),
      githubToken,
      githubUser,
    });

    res.json({
      token,
      user: githubUser,
    });
  } catch (error) {
    console.error('GitHub auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

router.post('/github-actions', async (req, res) => {
  try {
    const { token, repository } = req.body;

    if (!token || !repository) {
      res.status(400).json({ error: 'GitHub token and repository are required' });
      return;
    }

    const [owner, repo] = String(repository).split('/');
    if (!owner || !repo) {
      res.status(400).json({ error: 'Repository must be in owner/repo format' });
      return;
    }

    const octokit = new Octokit({ auth: token });
    const { data } = await octokit.rest.repos.get({ owner, repo });

    const jwt = generateToken({
      userId: `github-actions:${data.full_name}`,
      githubToken: token,
      githubUser: {
        id: data.owner.id,
        login: data.owner.login ?? 'github-actions',
        avatar_url: data.owner.avatar_url ?? '',
        name: data.owner.login ?? null,
        email: null,
      },
    });

    res.json({ token: jwt });
  } catch (error) {
    console.error('GitHub Actions auth error:', error);
    res.status(401).json({ error: 'GitHub Actions authentication failed' });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    res.json({ user: decoded.githubUser });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;

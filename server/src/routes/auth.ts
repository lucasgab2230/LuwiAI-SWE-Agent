import { Router } from 'express';
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
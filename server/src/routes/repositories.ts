import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getUserRepositories } from '../github/auth.js';

const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const repositories = await getUserRepositories(req.user!.githubToken);
    res.json({ repositories });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

export default router;
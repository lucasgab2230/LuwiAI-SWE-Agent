import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import config from './config/index.js';
import authRoutes from './routes/auth.js';
import repositoryRoutes from './routes/repositories.js';
import jobRoutes from './routes/jobs.js';
import webhookRoutes from './webhooks/github.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);

app.post('/api/webhooks/github', express.raw({ type: 'application/json' }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/webhooks', webhookRoutes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`LuwiAI Agent server running on port ${config.port}`);
});

export default app;
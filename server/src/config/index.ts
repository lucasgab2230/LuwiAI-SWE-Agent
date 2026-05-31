import dotenv from 'dotenv';
import type { AgentConfig } from '../types/index.js';

dotenv.config();

const config: AgentConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  githubClientId: process.env.GITHUB_CLIENT_ID || '',
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  githubAppWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
};

export default config;
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import type { AuthPayload } from '../types/index.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });
}
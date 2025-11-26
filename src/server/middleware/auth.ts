import { Request, Response, NextFunction } from 'express';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    // For development, allow requests without token
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        id: 'dev-user',
        username: 'developer',
        email: 'dev@example.com'
      };
      return next();
    }
    
    return next(createError('Authorization token required', 401));
  }

  // Mock token validation - in production, this would validate against a database
  try {
    // For demo purposes, accept any token
    if (token) {
      req.user = {
        id: 'user-' + Math.random().toString(36).substr(2, 9),
        username: 'demo-user',
        email: 'demo@example.com'
      };
    }

    logger.info(`User authenticated: ${req.user?.username}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    next(createError('Authentication failed', 500));
  }
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(createError('Authentication required', 401));
  }

  logger.info(`Authorized access: ${req.user?.username} to ${req.path}`);
  next();
};

export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // Optional authentication - doesn't throw error if not authenticated
  if (req.user) {
    logger.info(`Optional auth: ${req.user?.username} to ${req.path}`);
  } else {
    logger.info(`Optional auth: anonymous access to ${req.path}`);
  }
  
  req.user = req.user || {
    id: 'anonymous',
    username: 'anonymous',
    email: 'anonymous@example.com'
  };
  
  next();
};
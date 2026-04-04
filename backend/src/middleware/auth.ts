import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { dbOps } from '../database';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userLang?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized', messageKey: 'auth.unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload & { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    dbOps.users.findById(decoded.userId).then(user => {
      if (user) {
        req.userLang = user.preferred_language;
      }
      next();
    }).catch(() => next());
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', messageKey: 'auth.token_invalid' });
  }
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userId || req.userRole !== role) {
      res.status(403).json({ message: 'Forbidden', messageKey: 'auth.admin_required' });
      return;
    }
    next();
  };
}

export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET!, { expiresIn: '7d' });
}

export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload & { userId: string; role: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;

    dbOps.users.findById(decoded.userId).then(user => {
      if (user) {
        req.userLang = user.preferred_language;
      }
      next();
    }).catch(() => next());
  } catch (error) {
    next();
  }
}

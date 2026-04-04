import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { sanitizeInput } from '../utils/sanitizers';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_TEST = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'testing';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", ...CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: IS_PRODUCTION ? [] : null,
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hidePoweredBy: true,
});

export const cookieParserMiddleware = cookieParser();

export const httpsRedirect: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (IS_PRODUCTION && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }
  next();
};

export const strictCorsConfig = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean);

    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['X-CSRF-Token'],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

export const additionalSecurityHeaders: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  next();
};

export const sanitizeRequest: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }

  if (req.query) {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).replace(/\0/g, '');
      }
    }
  }

  next();
};

export const validateSecurityConfig = (): void => {
  if (IS_TEST) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      process.env.JWT_SECRET = 'test_jwt_secret_'.padEnd(32, 'x');
    }
    if (!process.env.CORS_ORIGIN) {
      process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:5173';
    }
    console.log('Security config set for test environment');
    return;
  }

  const required = ['JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (IS_PRODUCTION) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
      throw new Error('JWT_SECRET must be at least 64 characters in production');
    }
    if (!process.env.CORS_ORIGIN) {
      throw new Error('CORS_ORIGIN is required in production');
    }
    if (CORS_ORIGIN.includes('localhost')) {
      throw new Error('CORS_ORIGIN must not contain localhost in production');
    }
  }

  console.log('Security configuration validated');
};

export default {
  helmetConfig,
  cookieParserMiddleware,
  httpsRedirect,
  strictCorsConfig,
  additionalSecurityHeaders,
  sanitizeRequest,
  validateSecurityConfig,
};

import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { messageKey: 'auth.too_many_attempts' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { messageKey: 'general.rate_limit_exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const createDonationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { messageKey: 'donations.rate_limit_exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { messageKey: 'general.rate_limit_exceeded' },
  standardHeaders: true,
  legacyHeaders: false,
});

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn(`[${err.statusCode}] ${err.message}`, {
      messageKey: err.messageKey,
      isOperational: err.isOperational,
      stack: err.isOperational ? undefined : err.stack,
    });

    res.status(err.statusCode).json({
      messageKey: err.messageKey,
      ...(Object.keys((err as any).errors || {}).length > 0 && { errors: (err as any).errors }),
    });
    return;
  }

  logger.error(`[500] Unhandled error: ${err.message}`, {
    stack: err.stack,
    type: err.name,
  });

  res.status(500).json({
    messageKey: 'general.server_error',
  });
}

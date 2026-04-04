import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const IS_TEST = process.env.NODE_ENV === 'test';

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch {
    // ignore
  }
}

const levels = { error: 0, warn: 1, info: 2, http: 3, debug: 4 };
const colors = { error: 'red', warn: 'yellow', info: 'green', http: 'magenta', debug: 'cyan' };
(winston as any).addColors(colors);

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
      }),
    ),
  }),
];

if (!IS_TEST) {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: baseFormat,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: baseFormat,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'security-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      format: baseFormat,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new DailyRotateFile({
      filename: path.join(logsDir, 'performance-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: baseFormat,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: baseFormat,
  transports,
  exitOnError: false,
});

(logger as any).auth = (message: string, meta: Record<string, unknown> = {}) => logger.info(`AUTH: ${message}`, { ...meta, category: 'authentication' });
(logger as any).donation = (message: string, meta: Record<string, unknown> = {}) => logger.info(`DONATION: ${message}`, { ...meta, category: 'donation' });
(logger as any).review = (message: string, meta: Record<string, unknown> = {}) => logger.info(`REVIEW: ${message}`, { ...meta, category: 'review' });
(logger as any).user = (message: string, meta: Record<string, unknown> = {}) => logger.info(`USER: ${message}`, { ...meta, category: 'user' });
(logger as any).admin = (message: string, meta: Record<string, unknown> = {}) => logger.info(`ADMIN: ${message}`, { ...meta, category: 'admin' });
(logger as any).security = (message: string, meta: Record<string, unknown> = {}) => logger.warn(`SECURITY: ${message}`, { ...meta, category: 'security' });
(logger as any).performance = (message: string, meta: Record<string, unknown> = {}) => logger.info(`PERF: ${message}`, { ...meta, category: 'performance' });
(logger as any).socket = (message: string, meta: Record<string, unknown> = {}) => logger.info(`SOCKET: ${message}`, { ...meta, category: 'socket' });
(logger as any).api = (message: string, meta: Record<string, unknown> = {}) => logger.http(`API: ${message}`, { ...meta, category: 'api' });

export default logger;

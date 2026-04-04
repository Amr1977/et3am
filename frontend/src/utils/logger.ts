const LOG_LEVELS: Record<string, string> = {
  error: '🔴 ERROR',
  warn: '🟡 WARN',
  info: '🔵 INFO',
  debug: '⚪ DEBUG',
};

const getTimestamp = (): string => new Date().toISOString();

const formatMessage = (level: string, message: string, data?: unknown): string => {
  const timestamp = getTimestamp();
  const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
  return `${timestamp} ${LOG_LEVELS[level] || '⚪'}: ${message}${dataStr}`;
};

export const logger = {
  error: (message: string, data?: unknown): void => {
    console.error(formatMessage('error', message, data));
  },
  
  warn: (message: string, data?: unknown): void => {
    console.warn(formatMessage('warn', message, data));
  },
  
  info: (message: string, data?: unknown): void => {
    console.log(formatMessage('info', message, data));
  },
  
  debug: (message: string, data?: unknown): void => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatMessage('debug', message, data));
    }
  },

  api: (message: string, data?: unknown): void => {
    console.log(formatMessage('info', `📡 API: ${message}`, data));
  },

  auth: (message: string, data?: unknown): void => {
    console.log(formatMessage('info', `🔐 AUTH: ${message}`, data));
  },

  donation: (message: string, data?: unknown): void => {
    console.log(formatMessage('info', `🎁 DONATION: ${message}`, data));
  },
};

export const logError = (context: string, error: unknown): void => {
  console.error(getTimestamp(), '🔴 ERROR:', context, error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : '');
};

export const logApiRequest = (method: string, url: string, status: number, duration: number): void => {
  const prefix = status >= 400 ? '❌' : '✅';
  console.log(`${getTimestamp()} 📡 API: ${method} ${url} ${status} ${duration}ms ${prefix}`);
};

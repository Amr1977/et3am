const sanitizeString = (str: unknown, maxLength = 10000): string => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength).replace(/[<>"'&]/g, '');
};

const sanitizeHtml = (str: unknown, maxLength = 5000): string => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, maxLength).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

const sanitizeNumeric = (value: unknown, min = 0, max = 1000000): number | null => {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num) || num < min || num > max) return null;
  return Math.round(num * 100) / 100;
};

const sanitizeEmail = (email: unknown): string => {
  const sanitized = sanitizeString(email, 255);
  return sanitized.toLowerCase();
};

const sanitizeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return false;
};

export const sanitizeInput = (body: Record<string, unknown>): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(body)) {
    if (value === null || value === undefined) {
      sanitized[key] = null;
      continue;
    }
    
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumeric(value);
    } else if (typeof value === 'boolean') {
      sanitized[key] = sanitizeBoolean(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

export {
  sanitizeString,
  sanitizeHtml,
  sanitizeNumeric,
  sanitizeEmail,
  sanitizeBoolean
};

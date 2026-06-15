export class AppError extends Error {
  public readonly statusCode: number;
  public readonly messageKey: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, messageKey: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.messageKey = messageKey;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', messageKey = 'general.not_found') {
    super(message, 404, messageKey);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>, message = 'Validation failed', messageKey = 'general.validation_error') {
    super(message, 400, messageKey);
    this.errors = errors;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', messageKey = 'auth.login_required') {
    super(message, 401, messageKey);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', messageKey = 'auth.access_denied') {
    super(message, 403, messageKey);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', messageKey = 'general.conflict') {
    super(message, 409, messageKey);
  }
}

// Custom error classes for better error handling

export class ValidationError extends Error {
  public statusCode: number = 400;
  public isOperational: boolean = true;

  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  public statusCode: number = 401;
  public isOperational: boolean = true;

  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  public statusCode: number = 403;
  public isOperational: boolean = true;

  constructor(message: string = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  public statusCode: number = 404;
  public isOperational: boolean = true;

  constructor(message: string = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  public statusCode: number = 409;
  public isOperational: boolean = true;

  constructor(message: string = "Conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends Error {
  public statusCode: number = 429;
  public isOperational: boolean = true;

  constructor(message: string = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
  }
}

export class InternalServerError extends Error {
  public statusCode: number = 500;
  public isOperational: boolean = true;

  constructor(message: string = "Internal server error") {
    super(message);
    this.name = "InternalServerError";
  }
}

// Type guard functions
export function isOperationalError(error: Error): error is Error & { isOperational: boolean } {
  return "isOperational" in error && error.isOperational === true;
}

export function isValidationError(error: Error): error is ValidationError {
  return error instanceof ValidationError;
}

export function isUnauthorizedError(error: Error): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

export function isForbiddenError(error: Error): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

export function isNotFoundError(error: Error): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isConflictError(error: Error): error is ConflictError {
  return error instanceof ConflictError;
}

export function isRateLimitError(error: Error): error is RateLimitError {
  return error instanceof RateLimitError;
}


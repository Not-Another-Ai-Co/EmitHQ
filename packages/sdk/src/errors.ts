// @emithq/sdk — Typed error classes

export class EmitHQError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = 'EmitHQError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class AuthError extends EmitHQError {
  constructor(message: string) {
    super('unauthorized', message, 401);
    this.name = 'AuthError';
  }
}

export class ForbiddenError extends EmitHQError {
  constructor(message: string) {
    super('forbidden', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends EmitHQError {
  constructor(message: string) {
    super('not_found', message, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends EmitHQError {
  constructor(message: string) {
    super('validation_error', message, 400);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends EmitHQError {
  readonly retryAfter: number | null;

  constructor(message: string, retryAfter: number | null = null) {
    super('quota_exceeded', message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class PayloadTooLargeError extends EmitHQError {
  constructor(message: string) {
    super('payload_too_large', message, 413);
    this.name = 'PayloadTooLargeError';
  }
}

/** Map an HTTP status + error body to a typed error */
export function toTypedError(
  statusCode: number,
  body: { error?: { code?: string; message?: string } },
): EmitHQError {
  const code = body.error?.code ?? 'unknown';
  const message = body.error?.message ?? `HTTP ${statusCode}`;

  switch (statusCode) {
    case 401:
      return new AuthError(message);
    case 403:
      return new ForbiddenError(message);
    case 404:
      return new NotFoundError(message);
    case 400:
      return new ValidationError(message);
    case 413:
      return new PayloadTooLargeError(message);
    case 429:
      return new RateLimitError(message);
    default:
      return new EmitHQError(code, message, statusCode);
  }
}

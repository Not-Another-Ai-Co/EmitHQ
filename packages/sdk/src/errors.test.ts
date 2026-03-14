import { describe, it, expect } from 'vitest';
import {
  EmitHQError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  PayloadTooLargeError,
  toTypedError,
} from './errors';

describe('error classes', () => {
  it('EmitHQError has code, message, and statusCode', () => {
    const err = new EmitHQError('test_code', 'test message', 500);
    expect(err.code).toBe('test_code');
    expect(err.message).toBe('test message');
    expect(err.statusCode).toBe(500);
    expect(err.name).toBe('EmitHQError');
    expect(err).toBeInstanceOf(Error);
  });

  it('AuthError defaults to 401', () => {
    const err = new AuthError('bad key');
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('unauthorized');
    expect(err).toBeInstanceOf(EmitHQError);
  });

  it('ForbiddenError defaults to 403', () => {
    const err = new ForbiddenError('no access');
    expect(err.statusCode).toBe(403);
    expect(err).toBeInstanceOf(EmitHQError);
  });

  it('NotFoundError defaults to 404', () => {
    const err = new NotFoundError('gone');
    expect(err.statusCode).toBe(404);
    expect(err).toBeInstanceOf(EmitHQError);
  });

  it('ValidationError defaults to 400', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err).toBeInstanceOf(EmitHQError);
  });

  it('RateLimitError defaults to 429 with optional retryAfter', () => {
    const err = new RateLimitError('slow down', 30);
    expect(err.statusCode).toBe(429);
    expect(err.retryAfter).toBe(30);

    const errNoRetry = new RateLimitError('quota');
    expect(errNoRetry.retryAfter).toBeNull();
  });

  it('PayloadTooLargeError defaults to 413', () => {
    const err = new PayloadTooLargeError('too big');
    expect(err.statusCode).toBe(413);
    expect(err).toBeInstanceOf(EmitHQError);
  });
});

describe('toTypedError', () => {
  it('maps 401 to AuthError', () => {
    const err = toTypedError(401, { error: { code: 'unauthorized', message: 'Invalid key' } });
    expect(err).toBeInstanceOf(AuthError);
    expect(err.message).toBe('Invalid key');
  });

  it('maps 403 to ForbiddenError', () => {
    const err = toTypedError(403, { error: { code: 'forbidden', message: 'No access' } });
    expect(err).toBeInstanceOf(ForbiddenError);
  });

  it('maps 404 to NotFoundError', () => {
    const err = toTypedError(404, { error: { code: 'not_found', message: 'Not found' } });
    expect(err).toBeInstanceOf(NotFoundError);
  });

  it('maps 400 to ValidationError', () => {
    const err = toTypedError(400, { error: { code: 'validation_error', message: 'Bad' } });
    expect(err).toBeInstanceOf(ValidationError);
  });

  it('maps 413 to PayloadTooLargeError', () => {
    const err = toTypedError(413, { error: { code: 'payload_too_large', message: 'Big' } });
    expect(err).toBeInstanceOf(PayloadTooLargeError);
  });

  it('maps 429 to RateLimitError', () => {
    const err = toTypedError(429, { error: { code: 'quota_exceeded', message: 'Limit' } });
    expect(err).toBeInstanceOf(RateLimitError);
  });

  it('maps unknown status to generic EmitHQError', () => {
    const err = toTypedError(503, { error: { code: 'unavailable', message: 'Down' } });
    expect(err).toBeInstanceOf(EmitHQError);
    expect(err.statusCode).toBe(503);
  });

  it('handles missing error body gracefully', () => {
    const err = toTypedError(500, {});
    expect(err).toBeInstanceOf(EmitHQError);
    expect(err.message).toBe('HTTP 500');
    expect(err.code).toBe('unknown');
  });
});

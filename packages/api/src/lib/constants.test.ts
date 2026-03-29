import { describe, it, expect } from 'vitest';
import { UUID_RE } from './constants';

describe('UUID_RE', () => {
  it('matches a valid UUID v4', () => {
    expect(UUID_RE.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('matches uppercase UUID', () => {
    expect(UUID_RE.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('matches mixed-case UUID', () => {
    expect(UUID_RE.test('550e8400-E29B-41d4-A716-446655440000')).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    expect(UUID_RE.test('not-a-uuid')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(UUID_RE.test('')).toBe(false);
  });

  it('rejects a UUID with extra characters', () => {
    expect(UUID_RE.test('550e8400-e29b-41d4-a716-446655440000x')).toBe(false);
  });

  it('rejects a UUID missing a segment', () => {
    expect(UUID_RE.test('550e8400-e29b-41d4-a716')).toBe(false);
  });

  it('rejects a uid-style string (alphanumeric, no dashes)', () => {
    expect(UUID_RE.test('my-app-uid')).toBe(false);
  });
});

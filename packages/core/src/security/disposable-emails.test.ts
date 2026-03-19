import { describe, it, expect } from 'vitest';
import { isDisposableEmail } from './disposable-emails';

describe('isDisposableEmail', () => {
  it('allows normal email domains', () => {
    expect(isDisposableEmail('user@gmail.com')).toBeNull();
    expect(isDisposableEmail('dev@company.io')).toBeNull();
    expect(isDisposableEmail('cto@startup.com')).toBeNull();
    expect(isDisposableEmail('julian@naac.ai')).toBeNull();
  });

  it('blocks mailinator', () => {
    const result = isDisposableEmail('test@mailinator.com');
    expect(result).toMatch(/disposable/i);
  });

  it('blocks guerrillamail variants', () => {
    expect(isDisposableEmail('x@guerrillamail.com')).not.toBeNull();
    expect(isDisposableEmail('x@guerrillamail.net')).not.toBeNull();
    expect(isDisposableEmail('x@guerrillamail.org')).not.toBeNull();
  });

  it('blocks yopmail', () => {
    expect(isDisposableEmail('x@yopmail.com')).not.toBeNull();
  });

  it('blocks tempmail variants', () => {
    expect(isDisposableEmail('x@tempmail.com')).not.toBeNull();
    expect(isDisposableEmail('x@temp-mail.org')).not.toBeNull();
  });

  it('blocks 10minutemail', () => {
    expect(isDisposableEmail('x@10minutemail.com')).not.toBeNull();
  });

  it('is case-insensitive on domain', () => {
    expect(isDisposableEmail('x@MAILINATOR.COM')).not.toBeNull();
    expect(isDisposableEmail('x@Yopmail.Com')).not.toBeNull();
  });

  it('returns error for invalid email format', () => {
    expect(isDisposableEmail('notanemail')).toBe('Invalid email format');
  });
});

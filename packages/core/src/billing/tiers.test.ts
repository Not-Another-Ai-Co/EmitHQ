import { describe, it, expect } from 'vitest';
import { TIER_FEATURES } from './tiers';

describe('TIER_FEATURES', () => {
  it('free tier has no paid features', () => {
    const free = TIER_FEATURES['free'];
    expect(free.transforms).toBe(false);
    expect(free.customRetrySchedules).toBe(false);
    expect(free.prioritySupport).toBe(false);
    expect(free.slaGuarantee).toBe(false);
    expect(free.staticIps).toBe(false);
  });

  it('starter tier has transforms only', () => {
    const starter = TIER_FEATURES['starter'];
    expect(starter.transforms).toBe(true);
    expect(starter.customRetrySchedules).toBe(false);
    expect(starter.prioritySupport).toBe(false);
  });

  it('growth tier has transforms + retry + support', () => {
    const growth = TIER_FEATURES['growth'];
    expect(growth.transforms).toBe(true);
    expect(growth.customRetrySchedules).toBe(true);
    expect(growth.prioritySupport).toBe(true);
    expect(growth.slaGuarantee).toBe(false);
  });

  it('scale tier has all features', () => {
    const scale = TIER_FEATURES['scale'];
    expect(scale.transforms).toBe(true);
    expect(scale.customRetrySchedules).toBe(true);
    expect(scale.prioritySupport).toBe(true);
    expect(scale.slaGuarantee).toBe(true);
    expect(scale.staticIps).toBe(true);
  });

  it('all tiers are defined', () => {
    expect(Object.keys(TIER_FEATURES)).toEqual(['free', 'starter', 'growth', 'scale']);
  });

  it('transform gate matches old TRANSFORM_ALLOWED_TIERS behavior', () => {
    // Validates that the new TIER_FEATURES.transforms matches the old
    // ['starter', 'growth', 'scale'] array check
    expect(TIER_FEATURES['free'].transforms).toBe(false);
    expect(TIER_FEATURES['starter'].transforms).toBe(true);
    expect(TIER_FEATURES['growth'].transforms).toBe(true);
    expect(TIER_FEATURES['scale'].transforms).toBe(true);
  });

  it('unknown tier lookup returns undefined', () => {
    expect(TIER_FEATURES['enterprise']).toBeUndefined();
  });
});

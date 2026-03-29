/**
 * Boolean feature flags per tier.
 * Core exports data — consumers own presentation strings.
 */

export interface TierFeatures {
  transforms: boolean;
  customRetrySchedules: boolean;
  prioritySupport: boolean;
  slaGuarantee: boolean;
  staticIps: boolean;
}

export const TIER_FEATURES: Record<string, TierFeatures> = {
  free: {
    transforms: false,
    customRetrySchedules: false,
    prioritySupport: false,
    slaGuarantee: false,
    staticIps: false,
  },
  starter: {
    transforms: true,
    customRetrySchedules: false,
    prioritySupport: false,
    slaGuarantee: false,
    staticIps: false,
  },
  growth: {
    transforms: true,
    customRetrySchedules: true,
    prioritySupport: true,
    slaGuarantee: false,
    staticIps: false,
  },
  scale: {
    transforms: true,
    customRetrySchedules: true,
    prioritySupport: true,
    slaGuarantee: true,
    staticIps: true,
  },
};

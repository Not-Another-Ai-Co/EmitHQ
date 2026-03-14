// @emithq/sdk — TypeScript SDK (MIT licensed)
export const VERSION = '0.1.0';

export { EmitHQ } from './client';
export { verifyWebhook } from './verify';
export {
  EmitHQError,
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  PayloadTooLargeError,
} from './errors';
export type {
  EmitHQOptions,
  PaginatedResponse,
  PaginationParams,
  SendEventParams,
  Message,
  CreateEndpointParams,
  UpdateEndpointParams,
  Endpoint,
  EndpointDeleted,
  TestDeliveryResult,
  ReplayResult,
  ReplayAttemptResult,
} from './types';

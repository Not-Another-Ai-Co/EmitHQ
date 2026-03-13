import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  organizations,
  apiKeys,
  applications,
  endpoints,
  messages,
  deliveryAttempts,
  inboundSources,
} from './schema';

export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;

export type ApiKey = InferSelectModel<typeof apiKeys>;
export type NewApiKey = InferInsertModel<typeof apiKeys>;

export type Application = InferSelectModel<typeof applications>;
export type NewApplication = InferInsertModel<typeof applications>;

export type Endpoint = InferSelectModel<typeof endpoints>;
export type NewEndpoint = InferInsertModel<typeof endpoints>;

export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

export type DeliveryAttempt = InferSelectModel<typeof deliveryAttempts>;
export type NewDeliveryAttempt = InferInsertModel<typeof deliveryAttempts>;

export type InboundSource = InferSelectModel<typeof inboundSources>;
export type NewInboundSource = InferInsertModel<typeof inboundSources>;

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'EmitHQ REST API reference — all endpoints with request/response examples.',
};

const SECTIONS = [
  {
    title: 'Authentication',
    description: 'All API requests require a Bearer token. Use your emhq_ API key.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/auth/keys',
        description: 'Create a new API key (requires org:admin role via Clerk session)',
        body: '{ "name": "production-key" }',
        response: '{ "data": { "id": "...", "key": "emhq_...", "name": "production-key" } }',
        status: 201,
      },
      {
        method: 'GET',
        path: '/api/v1/auth/keys',
        description: 'List active API keys (metadata only, no key values)',
        response: '{ "data": [{ "id": "...", "name": "...", "lastUsedAt": "..." }] }',
        status: 200,
      },
      {
        method: 'DELETE',
        path: '/api/v1/auth/keys/:keyId',
        description: 'Revoke an API key (soft-delete)',
        response: '{ "data": { "id": "...", "revoked": true } }',
        status: 200,
      },
    ],
  },
  {
    title: 'Messages',
    description: 'Send webhook events for delivery to all matching endpoints.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/app/:appId/msg',
        description: 'Send a webhook event. Persisted before queueing. Returns 202.',
        body: '{ "eventType": "invoice.paid", "payload": { ... }, "eventId": "evt_unique" }',
        response:
          '{ "data": { "id": "msg_...", "eventType": "invoice.paid", "createdAt": "..." } }',
        status: 202,
      },
      {
        method: 'GET',
        path: '/api/v1/app/:appId/msg',
        description:
          'List messages with optional filters: eventType, since, until. Cursor-paginated.',
        response: '{ "data": [...], "iterator": "cursor", "done": false }',
        status: 200,
      },
      {
        method: 'GET',
        path: '/api/v1/app/:appId/msg/:msgId',
        description: 'Get a single message with all delivery attempts.',
        response: '{ "data": { "id": "...", "payload": {...}, "attempts": [...] } }',
        status: 200,
      },
    ],
  },
  {
    title: 'Endpoints',
    description:
      'CRUD for webhook delivery destinations. Each endpoint has its own signing secret.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/app/:appId/endpoint',
        description: 'Create an endpoint. Signing secret returned once.',
        body: '{ "url": "https://example.com/hook", "eventTypeFilter": ["invoice.paid"] }',
        response: '{ "data": { "id": "...", "signingSecret": "whsec_...", ... } }',
        status: 201,
      },
      {
        method: 'GET',
        path: '/api/v1/app/:appId/endpoint',
        description: 'List endpoints. Cursor-paginated. Excludes soft-deleted.',
        response: '{ "data": [...], "iterator": "cursor", "done": false }',
        status: 200,
      },
      {
        method: 'GET',
        path: '/api/v1/app/:appId/endpoint/:epId',
        description: 'Get a single endpoint. Signing secret is masked.',
        status: 200,
      },
      {
        method: 'PUT',
        path: '/api/v1/app/:appId/endpoint/:epId',
        description:
          'Update an endpoint. Setting disabled:false re-enables and resets circuit breaker.',
        body: '{ "url": "https://new-url.com/hook", "disabled": false }',
        status: 200,
      },
      {
        method: 'DELETE',
        path: '/api/v1/app/:appId/endpoint/:epId',
        description: 'Soft-delete an endpoint.',
        response: '{ "data": { "id": "...", "deleted": true } }',
        status: 200,
      },
      {
        method: 'POST',
        path: '/api/v1/app/:appId/endpoint/:epId/test',
        description: 'Send a test webhook to verify endpoint connectivity.',
        response: '{ "data": { "success": true, "statusCode": 200, "responseTimeMs": 42 } }',
        status: 200,
      },
    ],
  },
  {
    title: 'Replay & DLQ',
    description: 'Retry failed deliveries and manage the dead-letter queue.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/app/:appId/msg/:msgId/retry',
        description: 'Replay all failed/exhausted delivery attempts for a message.',
        response: '{ "data": { "replayed": 2, "attempts": [...] } }',
        status: 200,
      },
      {
        method: 'POST',
        path: '/api/v1/app/:appId/msg/:msgId/attempt/:attemptId/retry',
        description: 'Replay a single delivery attempt.',
        response: '{ "data": { "attemptId": "...", "jobId": "..." } }',
        status: 200,
      },
      {
        method: 'GET',
        path: '/api/v1/app/:appId/dlq',
        description: 'List exhausted delivery attempts (dead-letter queue). Cursor-paginated.',
        response: '{ "data": [...], "iterator": "cursor", "done": false }',
        status: 200,
      },
    ],
  },
  {
    title: 'Dashboard & Stats',
    description: 'Read-only endpoints for monitoring and observability.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/v1/app/:appId/stats',
        description:
          'Overview stats: events today, success rate, active endpoints, pending retries.',
        response:
          '{ "data": { "eventsToday": 142, "successRate": 98.5, "activeEndpoints": 5, "pendingRetries": 3 } }',
        status: 200,
      },
      {
        method: 'GET',
        path: '/api/v1/app/:appId/endpoint-health',
        description:
          'Per-endpoint health: success rate, avg latency, failure count, last delivery.',
        response: '{ "data": [{ "url": "...", "successRate": 99.1, "avgLatencyMs": 142, ... }] }',
        status: 200,
      },
    ],
  },
  {
    title: 'Transform Preview',
    description: 'Test payload transformations without persisting anything.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/v1/transform/preview',
        description: 'Preview a transformation rule against a sample payload.',
        body: '{ "payload": { ... }, "rules": [{ "sourcePath": "$.data.email", "targetField": "email" }] }',
        response: '{ "data": { "original": { ... }, "transformed": { "email": "..." } } }',
        status: 200,
      },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
  POST: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  PUT: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
  DELETE: 'bg-red-500/15 text-red-400',
};

export default function ApiReferencePage() {
  return (
    <div className="py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h1 className="mb-4 text-3xl font-bold">API Reference</h1>
        <p className="mb-12 text-[var(--color-text-muted)]">
          Base URL:{' '}
          <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">
            https://api.emithq.com
          </code>
          <br />
          Authentication:{' '}
          <code className="rounded bg-[var(--color-surface-hover)] px-1.5 py-0.5">
            Authorization: Bearer emhq_your_key
          </code>
          <br />
          All <code>:appId</code> and <code>:epId</code> params accept either UUID or user-defined
          uid.
        </p>

        <div className="space-y-16">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="mb-2 text-2xl font-bold">{section.title}</h2>
              <p className="mb-6 text-sm text-[var(--color-text-muted)]">{section.description}</p>

              <div className="space-y-6">
                {section.endpoints.map((ep) => (
                  <div
                    key={`${ep.method}-${ep.path}`}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-bold ${METHOD_COLORS[ep.method] ?? ''}`}
                      >
                        {ep.method}
                      </span>
                      <code className="text-sm">{ep.path}</code>
                      <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                        {ep.status}
                      </span>
                    </div>
                    <p className="mb-3 text-sm text-[var(--color-text-muted)]">{ep.description}</p>
                    {'body' in ep && ep.body && (
                      <div className="mb-2">
                        <span className="text-xs text-[var(--color-text-muted)]">
                          Request body:
                        </span>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--color-bg)] p-3 text-xs">
                          <code>{ep.body}</code>
                        </pre>
                      </div>
                    )}
                    {'response' in ep && ep.response && (
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)]">Response:</span>
                        <pre className="mt-1 overflow-x-auto rounded-lg bg-[var(--color-bg)] p-3 text-xs">
                          <code>{ep.response}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

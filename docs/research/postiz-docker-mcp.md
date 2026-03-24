# Research: Postiz Docker Compose Self-Hosted Setup & MCP Server

**Date:** 2026-03-23
**Status:** Draft — pending review

## Summary

Postiz is an open-source (AGPL-3.0) social media scheduling platform with 27.5k GitHub stars. It runs as a 9-container Docker Compose stack (app, Postgres, Redis, Temporal, Elasticsearch, Temporal UI, Spotlight). The backend exposes a built-in MCP server at `/mcp`, `/mcp/:id`, `/sse/:id`, and `/message/:id` — authenticated via Bearer API key or OAuth token. The MCP server wraps 8 Mastra-powered tools covering post scheduling, integration listing, image/video generation, and trigger actions. The SSE transport has a known bug with Nginx reverse proxies (issue #984, open since Sept 2025, still unresolved as of Feb 2026). The recommended workaround is the `mcp-remote` local proxy.

## Current State

EmitHQ codebase has no existing Postiz integration. This research is standalone — no prior knowledge base entry exists for Postiz. The MCP-first architecture knowledge at `~/.claude/knowledge/mcp-first-architecture/research.md` provides relevant context on SSE transport patterns and security considerations that apply here.

## Findings

### 1. What Postiz Is

- **Product:** Social media scheduling/automation platform — schedule posts, AI content generation, marketplace
- **License:** AGPL-3.0 (server), MIT SDKs
- **Tech stack:** NestJS (backend), Next.js (frontend), Prisma + PostgreSQL, Redis, Temporal (workflow engine), Elasticsearch, Mastra (AI agent framework)
- **Repo:** `github.com/gitroomhq/postiz-app` — 27.5k stars
- **Hosted version:** `platform.postiz.com`
- **Self-hosted:** Full feature parity with cloud

### 2. Docker Compose Setup

**Docker Compose repo:** `github.com/gitroomhq/postiz-docker-compose`

**Quick start:**

```bash
git clone https://github.com/gitroomhq/postiz-docker-compose
cd postiz-docker-compose
# configure environment variables
docker compose up
```

**Services (9 containers):**

| Service                | Image                               | Port | Purpose                       |
| ---------------------- | ----------------------------------- | ---- | ----------------------------- |
| postiz                 | ghcr.io/gitroomhq/postiz-app:latest | 4007 | Main app (frontend + backend) |
| postiz-postgres        | postgres:17-alpine                  | —    | App database                  |
| postiz-redis           | redis:7.2                           | —    | Cache + queue                 |
| spotlight              | sentry/spotlight:latest             | 8969 | Dev error monitoring          |
| temporal-elasticsearch | elasticsearch:7.17.27               | —    | Temporal search index         |
| temporal-postgresql    | postgres:16                         | —    | Temporal state store          |
| temporal               | temporalio/auto-setup:1.28.1        | 7233 | Workflow engine               |
| temporal-admin-tools   | temporalio/admin-tools              | —    | Temporal CLI                  |
| temporal-ui            | temporalio/ui:2.34.0                | 8080 | Temporal dashboard            |

**Networks:** `postiz-network` (app stack) and `temporal-network` (workflow engine) — isolated.

**Volumes:** `postgres-volume`, `postiz-redis-data`, `postiz-config`, `postiz-uploads`

**Required environment variables:**

```yaml
MAIN_URL: 'http://localhost:4007' # Public URL of the instance
FRONTEND_URL: 'http://localhost:4007' # Same as MAIN_URL
NEXT_PUBLIC_BACKEND_URL: 'http://localhost:4007/api' # API URL
JWT_SECRET: '<unique random string>' # REQUIRED — unique per install
DATABASE_URL: 'postgresql://postiz-user:postiz-password@postiz-postgres:5432/postiz-db-local'
REDIS_URL: 'redis://postiz-redis:6379'
BACKEND_INTERNAL_URL: 'http://localhost:3000'
TEMPORAL_ADDRESS: 'temporal:7233'
IS_GENERAL: 'true'
DISABLE_REGISTRATION: 'false'
RUN_CRON: 'true'
STORAGE_PROVIDER: 'local'
UPLOAD_DIRECTORY: '/uploads'
NEXT_PUBLIC_UPLOAD_DIRECTORY: '/uploads'
```

**Optional but common:**

- `OPENAI_API_KEY` — enables AI content generation features
- `API_LIMIT: 30` — public API rate limit (requests/hour)
- Social platform API credentials (X, LinkedIn, Reddit, etc.) — one pair per platform you want to connect

**Config file alternative:** Mount a `postiz.env` file to `/config` inside the container instead of inlining vars in the compose file.

**Important:** Restart containers with `docker compose down && docker compose up` when modifying env vars.

**Access points after launch:**

- Postiz app: `http://localhost:4007`
- Temporal UI: `http://localhost:8080`
- Sentry Spotlight (dev): `http://localhost:8969`

### 3. MCP Server — Architecture

The MCP server is built into the Postiz backend. It is initialized in `apps/backend/src/main.ts` via:

```typescript
import { startMcp } from '@gitroom/nestjs-libraries/chat/start.mcp';
await startMcp(app);
```

The implementation lives at `libraries/nestjs-libraries/src/chat/start.mcp.ts`. It registers three sets of routes on the Express/NestJS app:

| Route pattern                        | Transport       | Auth method                            |
| ------------------------------------ | --------------- | -------------------------------------- |
| `POST /mcp`                          | HTTP Streamable | Bearer token (API key or `pos_` OAuth) |
| `POST /mcp/:id`                      | HTTP Streamable | API key in URL param `:id`             |
| `GET /sse/:id` + `POST /message/:id` | SSE (legacy)    | API key in URL param `:id`             |

**Auth resolution:**

- Token starting with `pos_` → OAuth token → org lookup via `OAuthService.getOrgByOAuthToken()`
- Any other token → API key → org lookup via `OrganizationService.getOrgByApiKey()`

**CORS:** Wildcard (`*`) on all four headers — the MCP server accepts connections from any origin.

**Server identity:**

```typescript
name: 'Postiz MCP';
version: '1.0.0';
agent: mastra.getAgent('postiz');
```

### 4. MCP Tools (8 tools)

All tools live in `libraries/nestjs-libraries/src/chat/tools/`:

| File                             | Tool purpose                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `integration.list.tool.ts`       | List connected social media integrations (id, name, platform, disabled status)                    |
| `integration.schedule.post.ts`   | Schedule/draft/send post immediately — supports multi-platform, threads, media, platform settings |
| `integration.trigger.tool.ts`    | Trigger integration-specific actions (fetch Reddit flairs, YouTube playlists, etc.)               |
| `integration.validation.tool.ts` | Validate integration configuration before posting                                                 |
| `generate.image.tool.ts`         | AI image generation for post media                                                                |
| `generate.video.tool.ts`         | AI video generation                                                                               |
| `generate.video.options.tool.ts` | Retrieve video generation options/settings                                                        |
| `video.function.tool.ts`         | Video processing operations                                                                       |

**Key tool — `POSTIZ_SCHEDULE_POST` parameters:**

```
socialPost[].integrationId   — integration ID (from integration.list)
socialPost[].date             — ISO 8601 UTC timestamp
socialPost[].type             — 'draft' | 'schedule' | 'now'
socialPost[].isPremium        — boolean (X/Twitter premium status)
socialPost[].shortLink        — boolean (URL shortening)
socialPost[].postsAndComments — [{ content: HTML, attachments: URL[] }]
socialPost[].settings         — [{ key, value }] (platform-specific)
```

### 5. Connecting MCP to Claude Code

**Getting your API key:** Postiz Settings → Developers → Public API → copy the API key.

**Option A — HTTP Streamable transport (recommended for new clients):**

```json
{
  "mcpServers": {
    "postiz": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:4007/api/mcp",
        "--header",
        "Authorization: Bearer YOUR_API_KEY"
      ]
    }
  }
}
```

For self-hosted, replace `http://localhost:4007/api` with your `NEXT_PUBLIC_BACKEND_URL`.

**Option B — SSE transport (legacy, used by older clients):**

```json
{
  "mcpServers": {
    "postiz": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:4007/api/sse/YOUR_API_KEY"]
    }
  }
}
```

**Option C — URL-keyed endpoint (no header needed):**
The `:id` variant embeds the API key directly in the URL:
`http://localhost:4007/api/mcp/YOUR_API_KEY`

**Note on Tailscale:** If running Postiz on the miniPC and accessing from Zenbook, replace `localhost` with `100.82.36.13` and ensure port 4007 is exposed. Add `4007` to the port registry if deployed.

### 6. Known Issue: SSE over Nginx Reverse Proxy (issue #984)

**Status:** Open since Sept 18, 2025. Unresolved as of Feb 2026.

**Symptom:** MCP over SSE transport fails when Postiz is behind an Nginx reverse proxy. The GET `/api/mcp/{clientId}/sse` returns 200 and POST `/api/mcp/{clientId}/messages` returns 201, but the MCP initialize handshake never completes. Client logs show "Waiting for server to respond to initialize request..." and eventually "Error reading SSE stream: TypeError: terminated".

**Workaround (confirmed working):** Use `mcp-remote` as a local proxy (the Cloudflare approach):

```bash
npx mcp-remote http://your-postiz-domain.com/api/sse/YOUR_API_KEY
```

This proxies the remote SSE over a local stdio transport that Claude Code can consume.

**If not behind Nginx:** Direct SSE connection may work without the proxy.

### 7. CLI Alternative (no SSE needed)

The Postiz CLI (`npm install -g postiz`) wraps the same Public API and is designed for AI agent integration:

```bash
export POSTIZ_API_KEY=your_key
export POSTIZ_API_URL=http://localhost:4007/api  # for self-hosted
postiz integrations:list
postiz posts:create --content "Hello" --integrations ID --date 2026-03-24T12:00:00Z
```

The CLI outputs JSON on stdout — trivially parseable by Claude without an MCP server. This is the simpler path if the MCP SSE issue is blocking.

### 8. Public REST API

**Base URL (self-hosted):** `http://localhost:4007/api/public/v1`

**Authentication:** `Authorization: YOUR_API_KEY` (no "Bearer" prefix in Public API docs)

**Rate limit:** 30 requests/hour

**Key endpoints:**

- `GET /integrations` — list connected social accounts
- `POST /upload` — upload media, get trusted URL
- `POST /posts` — create/schedule posts (type: "schedule" | "now")

**Node.js SDK:** `@postiz/node` on npm wraps the Public API.

### 9. Disabling MCP (if unwanted)

PR #1229 added env var support for disabling MCP and AI features:

```yaml
DISABLE_AI: 'true' # disables MCP, copilot, image generation
```

(Variable name may differ — check latest docker-compose.yaml.)

## Recommendation

**For immediate use:** Self-host with Docker Compose using the `postiz-docker-compose` repo. Takes ~10 minutes to stand up. Use the HTTP Streamable MCP endpoint (`/mcp`) with Bearer auth rather than SSE to avoid the Nginx proxy bug. Configure in Claude Code with `mcp-remote` pointing to `http://localhost:4007/api/mcp`.

**For EmitHQ relevance:** Postiz is not a direct competitor — it's a social media scheduling tool. However, T-067 (EmitHQ MCP Server) should follow the same pattern Postiz uses: Mastra-based tools, SSE + HTTP Streamable dual transport, API key in Bearer header or URL param, CORS wildcard. The Postiz MCP architecture is a good reference implementation for T-067.

**Port allocation:** If deploying Postiz alongside EmitHQ services, use port `4100` for the app to avoid conflict with existing EmitHQ registry (4000–4003 are taken). Update the port registry in `~/.claude/CLAUDE.md`.

## Sources

- GitHub repo: https://github.com/gitroomhq/postiz-app
- Docker Compose repo: https://github.com/gitroomhq/postiz-docker-compose
- Postiz docs: https://docs.postiz.com/introduction
- Docker Compose guide: https://docs.postiz.com/installation/docker-compose
- Public API docs: https://docs.postiz.com/public-api
- CLI docs: https://docs.postiz.com/cli
- SSE bug (issue #984): https://github.com/gitroomhq/postiz-app/issues/984
- MCP setup discussion #781: https://github.com/gitroomhq/postiz-app/discussions/781
- mcp-remote proxy guide: https://developers.cloudflare.com/agents/guides/remote-mcp-server/
- MCP implementation: `libraries/nestjs-libraries/src/chat/start.mcp.ts` (in postiz-app repo)
- MCP tools: `libraries/nestjs-libraries/src/chat/tools/` (in postiz-app repo)

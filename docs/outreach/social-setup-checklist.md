# Social Account Setup Checklist — T-107

Postiz is running at http://100.82.36.13:4007 (miniPC). Complete these steps to connect social accounts.

## 1. Create Postiz Account

1. Go to http://100.82.36.13:4007
2. Register (first user becomes admin)
3. Go to Settings → Developers → Public API → copy your API key
4. Save the API key to 1Password: `EmitHQ/postiz/api-key`

## 2. Twitter/X — @EmitHQ

### Create Account

1. Go to https://twitter.com/signup
2. Create @EmitHQ account
3. Add bio: "Open-source webhook infrastructure for SaaS teams. $49/mo — not $490. AGPL-3.0."
4. Link: https://emithq.com
5. Profile image: EmitHQ logo

### Create Developer App

1. Go to https://developer.twitter.com/en/portal/dashboard
2. Sign in with @EmitHQ account
3. Create a new app
4. **App type: Native App** (NOT "Web App" — this causes error code 32)
5. **Permissions: Read and Write**
6. **OAuth 1.0a: Enable**
7. Callback URL: `http://100.82.36.13:4007/integrations/social/x`
8. Copy API Key and API Secret
9. Save to 1Password: `EmitHQ/twitter-x-dev/api-key` and `EmitHQ/twitter-x-dev/api-secret`
10. Edit `~/postiz/.env` — set `X_API_KEY` and `X_API_SECRET`
11. Restart: `cd ~/postiz && docker compose down && docker compose up -d`

### Connect in Postiz

1. Go to http://100.82.36.13:4007 → Integrations → Add X/Twitter
2. Authorize the OAuth flow

## 3. LinkedIn — EmitHQ Company Page

### Create Company Page

1. Go to https://www.linkedin.com/company/setup/new/
2. Company name: EmitHQ
3. Website: https://emithq.com
4. Industry: Computer Software
5. Company size: 1 employee
6. Description: "Open-source webhook infrastructure for SaaS teams. Reliable delivery from $49/mo — not $490. AGPL-3.0 server, MIT SDKs."

### Create Developer App

1. Go to https://www.linkedin.com/developers/apps
2. Create new app, associate with EmitHQ company page
3. Under Products tab, request **Advertising API** access (needed for token refresh)
4. OAuth 2.0 redirect URL: `http://100.82.36.13:4007/integrations/social/linkedin-page`
5. Copy Client ID and Client Secret
6. Save to 1Password: `EmitHQ/linkedin-dev/client-id` and `EmitHQ/linkedin-dev/client-secret`
7. Edit `~/postiz/.env` — set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
8. Restart: `cd ~/postiz && docker compose down && docker compose up -d`

### Connect in Postiz

1. Go to http://100.82.36.13:4007 → Integrations → Add LinkedIn Page
2. Authorize the OAuth flow, select EmitHQ company page

## 4. Reddit

### Create Account

1. Go to https://www.reddit.com/register
2. Username: something professional (your name or emithq-related)
3. Join: r/selfhosted, r/SaaS, r/webdev, r/node, r/devops

### Create Developer App

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app"
3. **Type: web app**
4. Redirect URI: `http://100.82.36.13:4007/integrations/social/reddit`
5. Copy Client ID (under app name) and Client Secret
6. Save to 1Password: `EmitHQ/reddit-dev/client-id` and `EmitHQ/reddit-dev/client-secret`
7. Edit `~/postiz/.env` — set `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET`
8. Restart: `cd ~/postiz && docker compose down && docker compose up -d`

### Connect in Postiz

1. Go to http://100.82.36.13:4007 → Integrations → Add Reddit
2. Authorize the OAuth flow

## 5. Dev.to

### Create Account

1. Go to https://dev.to/enter
2. Sign up (can use GitHub OAuth)
3. Go to Settings → Extensions → DEV Community API Keys
4. Generate a new API key, name it "EmitHQ Postiz"
5. Save to 1Password: `EmitHQ/devto/api-key`

### No OAuth needed for Postiz

Dev.to cross-posting uses the REST API directly (not through Postiz). The API key is used by Claude in scripts.

## 6. Hacker News

### Verify/Create Account

1. Go to https://news.ycombinator.com/login
2. If you have an account, verify you can log in
3. If not, create one at https://news.ycombinator.com/login?creating=t

### Start Karma Building (CRITICAL — do this immediately)

- Comment on 1-2 threads per day in infrastructure, webhooks, or developer tool discussions
- NO self-promotion for at least 2 weeks
- Goal: 50+ karma before Show HN (T-095)

## 7. Mention Monitoring

### F5Bot (5 min)

1. Go to https://f5bot.com
2. Create account with `support@emithq.com` (or `julian@naac.ai`)
3. Add these 5 keywords:
   - `emithq`
   - `svix alternative`
   - `hookdeck alternative`
   - `webhook platform`
   - `webhook service`
4. Alerts arrive via email within minutes of a mention

### Talkwalker Alerts (5 min)

1. Go to https://www.talkwalker.com/alerts
2. No account needed — enter email directly
3. Create alerts for:
   - `EmitHQ` (as-it-happens)
   - `"svix alternative"` (daily digest)
   - `"hookdeck alternative"` (daily digest)

## After All Accounts Are Created

1. Restart Postiz with all API keys: `cd ~/postiz && docker compose down && docker compose up -d`
2. Connect all accounts in Postiz UI
3. Tell Claude — I'll configure the MCP server and verify all integrations work

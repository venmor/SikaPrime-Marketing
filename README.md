# Sika Prime Marketing Agent

Web-first, AI-powered marketing and content management platform for Sika Prime Loans.

The platform helps a loan business detect current trends, generate high-quality content, keep channels active even when there is no major trend, manage approvals, schedule and publish campaigns, and learn from content performance. It is structured for a marketing team today and for future mobile app reuse later.

## What’s Included

- Trend Detection Engine
  Detects local Zambian and global attention signals, filters unsafe or low-value topics, scores safe signals by freshness, relevance, and brand fit, and stores them for recommendation workflows.
- AI Content Generator
  Generates Facebook posts, ad copy, captions, WhatsApp-ready promotions, campaign ideas, educational content, trust-building content, youth-focused empowerment content, value-led content, seasonal posts, and product promotions.
- Business Knowledge Base
  Stores company values, products, services, offers, audiences, goals, brand tone, compliance rules, and guardrail terms for reuse across workflows.
- Content Workflow Manager
  Supports idea creation, drafting, review, revision, approval, scheduling, publishing, and archiving with role-aware actions.
- Content Calendar and Repository
  Organizes scheduled content, flags balance issues, and preserves published content for reuse and repurposing.
- Social Publishing Module
  Supports Facebook auto-posting, WhatsApp Cloud API delivery when configured, and simulated/manual-ready publishing otherwise.
- Performance Dashboard
  Tracks publication history, engagement, leads, product response, trend performance, and top-performing content themes.
- Recommendation Engine
  Suggests what to create next using proactive occasions, safe trend signals, business goals, audience needs, product priorities, content-balance gaps, and performance history.
- Automation and Alerts
  Supports Vercel-compatible cron jobs, live performance sync, and optional Slack alerts for publishing and review workflow events.

## Stack

- Next.js 16 + React 19 + TypeScript
- Prisma + PostgreSQL
- Tailwind CSS v4
- RSS trend ingestion
- OpenAI-compatible generation path with fallback templated generation
- Vitest for targeted unit tests

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create local env values:

```bash
cp .env.example .env
```

3. Create a Neon project, then paste your pooled and direct Postgres URLs into `.env`.

4. Set your initial admin account in `.env`, then initialize the database:

```env
INITIAL_ADMIN_EMAIL="admin@example.com"
INITIAL_ADMIN_PASSWORD="ChangeThisAdminPassword123!"
INITIAL_ADMIN_NAME="Platform Administrator"
INITIAL_ADMIN_JOB_TITLE="Administrator"
```

5. Initialize the database and bootstrap the workspace:

```bash
npm run db:generate
npm run db:init
```

6. Start the app:

```bash
npm run dev
```

7. Open `http://localhost:3000`

## Initial Admin Bootstrap

The seed no longer creates demo users. It creates or updates one initial admin
from:

- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`
- `INITIAL_ADMIN_NAME`
- `INITIAL_ADMIN_JOB_TITLE`

To wipe demo/sample data and keep only the bootstrap admin, run:

```bash
RESET_DEMO_DATA=true npm run db:seed
```

## Environment Variables

- `DATABASE_URL`
  PostgreSQL connection URL used by the app. For Neon, use the pooled connection string.
- `DIRECT_URL`
  Direct PostgreSQL connection URL used by Prisma CLI commands. For Neon, use the non-pooled direct connection string.
- `AUTH_SECRET`
  Session signing key.
- `AUTH_SESSION_MAX_AGE_HOURS`
  Optional. Session lifetime in hours. Defaults to `168` (7 days).
- `ADMIN_REAUTH_MAX_AGE_HOURS`
  Optional. Freshness window for sensitive admin-only screens and actions such as invites, resets, and session revocation. Defaults to `12`.
- `INITIAL_ADMIN_EMAIL`
  Initial admin email used by the bootstrap seed.
- `INITIAL_ADMIN_PASSWORD`
  Initial admin password used by the bootstrap seed.
- `INITIAL_ADMIN_NAME`
  Optional display name for the bootstrap admin.
- `INITIAL_ADMIN_JOB_TITLE`
  Optional job title for the bootstrap admin.
- `INITIAL_ADMIN_MFA_ENABLED`
  Optional. Enables email OTP for the bootstrap admin when email delivery is configured.
- `RESET_DEMO_DATA`
  Optional. When `true`, removes sample workspace data and all non-admin users before reseeding the baseline workspace.
- `OPENAI_API_KEY`
  Optional. Enables live AI generation instead of the built-in fallback generator.
- `OPENAI_MODEL`
  Optional. Defaults to `gpt-4.1-mini`.
- `FACEBOOK_PAGE_ID`
  Optional. Enables live Facebook publishing.
- `FACEBOOK_PAGE_ACCESS_TOKEN`
  Optional. Required with `FACEBOOK_PAGE_ID` and live Facebook performance sync.
- `META_GRAPH_API_VERSION`
  Optional. Defaults to `v22.0`.
- `WHATSAPP_PHONE_NUMBER_ID`
  Optional. Enables WhatsApp Cloud API delivery when paired with a destination number.
- `WHATSAPP_ACCESS_TOKEN`
  Optional. Required with `WHATSAPP_PHONE_NUMBER_ID`.
- `EMAIL_SMTP_HOST`
  Optional. SMTP host for invite, password reset, and OTP delivery.
- `EMAIL_SMTP_PORT`
  Optional. SMTP port. Defaults to `587`.
- `EMAIL_SMTP_USER`
  Optional. SMTP username.
- `EMAIL_SMTP_PASSWORD`
  Optional. SMTP password or app password.
- `EMAIL_SMTP_SECURE`
  Optional. Set `true` for SMTPS or port `465`.
- `EMAIL_FROM_EMAIL`
  Optional. Sender email shown on transactional messages.
- `EMAIL_FROM_NAME`
  Optional. Sender label shown on transactional messages. Defaults to `Sika Prime Loans`.
- `SLACK_WEBHOOK_URL`
  Optional. Sends workflow and publishing alerts to Slack.
- `OBSERVABILITY_SLOW_API_THRESHOLD_MS`
  Optional. Warns when OpenAI, RSS, or Meta calls are slower than the threshold. Defaults to `2500`.
- `EXTERNAL_API_TIMEOUT_MS`
  Optional. Hard timeout for external API calls. Defaults to `12000`.
- `PUBLISH_MAX_RETRIES`
  Optional. Number of retries for Facebook and WhatsApp publish attempts. Defaults to `2`.
- `PUBLISH_BATCH_SIZE`
  Optional. Maximum number of due scheduled items processed in one publish job run. Defaults to `10`.
- `CRON_SECRET`
  Protects the refresh and publishing job endpoints.
- `PRISMA_SYNC_ON_BUILD`
  Optional. When `true`, runs `prisma db push --skip-generate` during `npm run build`. On Vercel production builds this sync runs by default.

## Useful Commands

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run db:generate
npm run db:init
npm run db:seed
npm run smoke:vercel -- https://your-deployment-url.vercel.app
```

## Scheduled Jobs

The app exposes protected job routes that accept both `GET` and `POST`:

- `/api/jobs/daily-maintenance`
  Runs the once-daily maintenance sweep for free-plan Vercel cron usage: trend refresh, recommendation refresh, due publishing, and recent performance sync.
- `/api/jobs/refresh-trends`
  Refreshes trend signals and recommendations.
- `/api/jobs/publish-due`
  Publishes items whose scheduled time has arrived and syncs recent Facebook performance.
- `/api/jobs/sync-performance`
  Manually syncs recent Facebook publication metrics.
- `/api/health`
  Returns deployment health, database connectivity, and recent operational warning/error counts for smoke tests and monitoring.

Use `Authorization: Bearer $CRON_SECRET` or `?secret=$CRON_SECRET`.

The included [vercel.json](/home/charlie/SIKA%20PRIME%20MARKETING%20AGENT/vercel.json) defines a single daily Vercel cron for Hobby/free-plan compatibility. Use the individual job routes manually between cron runs when needed.

## Project Structure

```text
src/
  app/                    Next.js routes and pages
  components/             UI and chart components
  lib/
    auth/                 session and access helpers
    analytics/            performance aggregation
    dashboard/            dashboard queries
    operations/           operational telemetry and health checks
    engines/
      content/            AI prompt building and generation
      recommendations/    recommendation logic
      trends/             trend source registry, scoring, refresh
    publishing/           publishing service
  server/actions/         server actions for app workflows
prisma/
  schema.prisma
  seed.ts
docs/
  architecture.md
  operations.md
  roadmap.md
```

## Engineering Notes

- The system is intentionally modular: generation, trends, recommendations, publishing, and analytics are separated into services.
- Audit logging keeps major workflow actions traceable for future maintenance and team accountability.
- Sensitive admin access requires a recent sign-in before invite, reset-link, suspension, or session-revocation actions can be used.
- Analytics pages are intentionally limited to admin, strategist, and analyst roles.
- Creator workflow visibility is intentionally scoped to content they own.
- Operational telemetry records slow external responses, trend refresh issues, publishing failures, and publish backlog warnings in the existing activity log.
- Business profile data is the shared source of truth for content generation and scoring.
- The included `db:init` helper pushes the Prisma schema to PostgreSQL and then bootstraps the workspace. For Neon, use the pooled URL in `DATABASE_URL` and the direct URL in `DIRECT_URL`.
- During `db:init`, the seed step automatically uses `DIRECT_URL` to avoid Neon pooler issues on one-off setup tasks.
- Production Vercel builds sync additive Prisma schema changes automatically before `next build`, which helps avoid build failures when the live Neon schema is behind the repo.
- Facebook publishing falls back to a simulated publish record when Meta credentials are not configured.
- OpenAI generation falls back to a structured template generator when no API key is present.
- WhatsApp delivery falls back to a manual-ready simulated publish unless Cloud API credentials and a destination number are provided.
- Facebook performance sync uses Graph API read access and creates fresh `PerformanceSnapshot` rows for recent live posts.
- Slack notifications are optional and only send when `SLACK_WEBHOOK_URL` is configured.

## Future Expansion

- Add more social platforms with new publisher adapters
- Add image generation workflows and asset approvals
- Add multilingual content generation
- Add campaign automation and recurring sequences
- Add richer analytics sources and conversion attribution
- Reuse the current service layer for a mobile app client later

## Documentation

- [Architecture](docs/architecture.md)
- [System Guide](docs/system-guide.md)
- [Neon Free Setup](docs/neon-setup.md)
- [Operations](docs/operations.md)
- [Roadmap](docs/roadmap.md)
- [Vercel Deployment Checklist](docs/vercel-deployment.md)

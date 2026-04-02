# Sika Prime Marketing Agent

Web-first, AI-powered marketing and content management platform for Sika Prime Loans.

The platform helps a loan business detect current trends, generate high-quality content, manage approvals, schedule and publish campaigns, and learn from content performance. It is structured for a marketing team today and for future mobile app reuse later.

## What’s Included

- Trend Detection Engine
  Detects local Zambian and global trends, scores them by freshness, relevance, and brand fit, and stores them for recommendation workflows.
- AI Content Generator
  Generates Facebook posts, ad copy, captions, WhatsApp-ready promotions, campaign ideas, educational content, trust-building content, and product promotions.
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
  Suggests what to create next using trend signals, business goals, audience needs, product priorities, calendar gaps, and performance history.
- Automation and Alerts
  Supports Vercel-compatible cron jobs, live performance sync, and optional Slack alerts for publishing and review workflow events.

## Stack

- Next.js 16 + React 19 + TypeScript
- Prisma + SQLite
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

3. Initialize the local database and seed demo data:

```bash
npm run db:generate
npm run db:init
```

4. Start the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`

## Demo Accounts

- `admin@sikaprime.local / SikaPrime123!`
- `strategist@sikaprime.local / SikaPrime123!`
- `creator@sikaprime.local / SikaPrime123!`
- `reviewer@sikaprime.local / SikaPrime123!`
- `analyst@sikaprime.local / SikaPrime123!`

## Environment Variables

- `DATABASE_URL`
  SQLite database URL. The included `.env` uses an absolute local path for this workspace.
- `AUTH_SECRET`
  Session signing key.
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
- `SLACK_WEBHOOK_URL`
  Optional. Sends workflow and publishing alerts to Slack.
- `CRON_SECRET`
  Protects the refresh and publishing job endpoints.

## Useful Commands

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run db:generate
npm run db:init
npm run db:seed
```

## Scheduled Jobs

The app exposes protected job routes that accept both `GET` and `POST`:

- `/api/jobs/refresh-trends`
  Refreshes trend signals and recommendations.
- `/api/jobs/publish-due`
  Publishes items whose scheduled time has arrived and syncs recent Facebook performance.
- `/api/jobs/sync-performance`
  Manually syncs recent Facebook publication metrics.

Use `Authorization: Bearer $CRON_SECRET` or `?secret=$CRON_SECRET`.

The included [vercel.json](/home/charlie/SIKA%20PRIME%20MARKETING%20AGENT/vercel.json) defines Vercel cron schedules for daily trend refresh and 15-minute publishing checks.

## Project Structure

```text
src/
  app/                    Next.js routes and pages
  components/             UI and chart components
  lib/
    auth/                 session and access helpers
    analytics/            performance aggregation
    dashboard/            dashboard queries
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
- Business profile data is the shared source of truth for content generation and scoring.
- The included `db:init` helper exists because some local environments behave unreliably with `prisma db push` against SQLite. It deterministically creates the schema from the Prisma datamodel and then seeds it.
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
- [Operations](docs/operations.md)
- [Roadmap](docs/roadmap.md)
- [Vercel Deployment Checklist](docs/vercel-deployment.md)

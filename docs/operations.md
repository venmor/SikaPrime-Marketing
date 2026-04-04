# Operations

## Local Development

### First-time setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:init
npm run dev
```

Before `db:init`, update `.env` with your Neon `DATABASE_URL` and `DIRECT_URL`.

Add your bootstrap admin details before the first seed:

```env
INITIAL_ADMIN_EMAIL="admin@example.com"
INITIAL_ADMIN_PASSWORD="ChangeThisAdminPassword123!"
INITIAL_ADMIN_NAME="Platform Administrator"
INITIAL_ADMIN_JOB_TITLE="Administrator"
```

### Verification

```bash
npm run lint
npm run test
npm run build
npm run smoke:vercel -- https://your-deployment-url.vercel.app
```

## Database Notes

- Prisma client generation uses `npm run db:generate`
- Local schema initialization uses `npm run db:init`
- Seeding runs through `prisma/seed.ts`
- Production builds do not run `prisma db push` unless `PRISMA_SYNC_ON_BUILD=true` is explicitly set

Why `db:init` exists:

- The project uses PostgreSQL, including Neon-hosted databases
- `db:init` pushes the Prisma schema to the configured Postgres database and then seeds the app
- For Neon, `db:init` seeds through `DIRECT_URL` to avoid pooler-related setup failures
- This gives the team a repeatable setup path for Neon and other hosted Postgres providers

When the schema changes in production, run this manually against the live database before or after deploy:

```bash
npx prisma db push --skip-generate
```

## Workspace Bootstrap

- `db:init` creates or updates one initial admin from the `INITIAL_ADMIN_*` environment variables.
- `RESET_DEMO_DATA=true npm run db:seed` removes sample workspace data and all non-admin users, then reapplies the baseline company profile and integration-setting metadata.
- SMTP-backed invite, password reset, and optional email OTP flows become live when the `EMAIL_SMTP_*` and `EMAIL_FROM_*` values are configured.

## Scheduled Jobs

### Run the once-daily maintenance sweep

```bash
curl http://localhost:3000/api/jobs/daily-maintenance \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Refresh trends and recommendations

```bash
curl -X POST http://localhost:3000/api/jobs/refresh-trends \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Publish scheduled content

```bash
curl http://localhost:3000/api/jobs/publish-due \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Sync recent Facebook performance

```bash
curl http://localhost:3000/api/jobs/sync-performance \
  -H "Authorization: Bearer $CRON_SECRET"
```

On the Vercel free/Hobby plan, `vercel.json` uses only the daily maintenance route. The other job routes remain available for manual runs.

## Observability And Resilience

The system now records operational events into the existing activity log for:

- failed Facebook and WhatsApp publish attempts
- trend source refresh failures
- daily maintenance step failures
- slow external calls to OpenAI, Meta, and RSS sources
- scheduled publishing backlog warnings when due volume exceeds the current batch size

Default operational controls:

- `OBSERVABILITY_SLOW_API_THRESHOLD_MS=2500`
- `EXTERNAL_API_TIMEOUT_MS=12000`
- `PUBLISH_MAX_RETRIES=2`
- `PUBLISH_BATCH_SIZE=10`

How retry and queue-lite behavior works:

- publish requests to Facebook and WhatsApp retry transient failures with short backoff
- scheduled publishing only processes `PUBLISH_BATCH_SIZE` due items per run
- any remaining due items stay in `SCHEDULED` and are picked up on the next manual run or daily cron
- when the due queue exceeds the batch size, the system records a backlog warning so the team can decide whether to increase the batch size or move to a proper queue

### Health Check Endpoint

Use the deployment health route to confirm the app is reachable and the database is connected:

```bash
curl http://localhost:3000/api/health
```

The response includes:

- overall app health status
- database connectivity
- recent operational warning and error counts
- latest operational events

## Live Integrations

### OpenAI

Set:

- `OPENAI_API_KEY`
- optional `OPENAI_MODEL`

Without a key, the system falls back to a deterministic internal generator so the workflow remains usable.

### Facebook

Set:

- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- optional `META_GRAPH_API_VERSION`

Without these values, publishing is stored as a simulated event.

### WhatsApp Cloud API

Set:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`

WhatsApp delivery only becomes live when both values are present and the content item has a destination number configured.

### Slack Alerts

Set:

- `SLACK_WEBHOOK_URL`

Without this value, workflow notifications stay in-app only.

## Vercel Cron

The repo includes [vercel.json](/home/charlie/SIKA%20PRIME%20MARKETING%20AGENT/vercel.json), which defines:

- a single once-daily maintenance sweep

Vercel cron sends `GET` requests, which is why the job routes support both `GET` and `POST`.

`CRON_SECRET` is user-generated, not provided by Vercel. Create a strong random value locally and add it in your Vercel project settings.

For a full production deployment sequence, use [vercel-deployment.md](/home/charlie/SIKA%20PRIME%20MARKETING%20AGENT/docs/vercel-deployment.md).

## Maintenance Checklist

### Weekly

- Refresh trend sources and confirm feeds still return valid RSS
- Review recommendation quality against current campaign priorities
- Check content workflow bottlenecks in review and scheduled queues
- Review calendar warnings for stale trends, duplicate themes, or promotional overload
- Check the published content library for reusable winners and weak performers to rewrite

### Monthly

- Update product priorities and audience insights in the knowledge base
- Audit compliance rules with the latest legal and internal policy guidance
- Review analytics themes and retire weak content angles

### Before releasing major changes

- Run lint, tests, and build
- Run the Vercel smoke test against the latest deployment URL
- Confirm the production build script or a manual `npx prisma db push --skip-generate` has applied any new tables or columns before testing
- Re-seed a clean local database only if schema changes touched bootstrap assumptions
- Verify role-based access on knowledge, review, analytics, and publishing flows
- Smoke-test trend refresh and scheduled publishing endpoints

## Workflow Smoke Test

Use this sequence to validate the end-to-end operating model after major workflow changes:

1. Log in as the configured bootstrap admin and update a product, guardrail term, or audience segment in `/knowledge`.
2. Open `/trends` and refresh the trend engine.
3. Open `/content`, generate a few ideas, and convert one idea into a draft.
4. Edit the draft and submit it for review.
5. Invite a reviewer account, accept the invite, then open `/workflow` as that reviewer and either approve the draft or send it for revision.
6. Open `/calendar` and confirm warnings or timing suggestions appear when the queue is unbalanced.
7. Open `/publishing`, publish an approved item, and verify a history record is created.
8. If WhatsApp Cloud API is configured, publish a WhatsApp item with a destination number and confirm it creates a live publish record.
9. Run the performance sync endpoint and confirm fresh `PerformanceSnapshot` rows appear in analytics-driven pages.
10. Open `/library` and confirm a published item can be reused or repurposed into a new draft.
11. Open `/analytics` and confirm product, trend, theme, and posting-window insights render.
12. Open `/recommendations`, ask a planning question, and confirm the answer explains the next move.

## Deployment Smoke Test

Run this after each push that reaches Vercel:

```bash
npm run smoke:vercel -- https://your-deployment-url.vercel.app
```

The smoke test verifies:

- home page loads
- login page loads
- `/api/health` reports a connected database
- `/dashboard` still redirects unauthenticated users to `/login`
- cron routes reject anonymous access

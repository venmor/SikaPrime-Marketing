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

### Verification

```bash
npm run lint
npm run test
npm run build
```

## Database Notes

- Prisma client generation uses `npm run db:generate`
- Local schema initialization uses `npm run db:init`
- Seeding runs through `prisma/seed.ts`

Why `db:init` exists:

- Some local environments are unreliable with `prisma db push` against SQLite
- `db:init` generates SQL from the Prisma datamodel, applies it to SQLite, and then seeds the app
- This gives the team a repeatable setup path

## Seeded Demo Users

- `admin@sikaprime.local`
- `strategist@sikaprime.local`
- `creator@sikaprime.local`
- `reviewer@sikaprime.local`
- `analyst@sikaprime.local`

Password for all demo users:

- `SikaPrime123!`

## Scheduled Jobs

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

- daily trend and recommendation refresh
- 15-minute publishing checks plus Facebook performance sync

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
- Re-seed a clean local database if schema changes touched demo assumptions
- Verify role-based access on knowledge, review, and publishing flows
- Smoke-test trend refresh and scheduled publishing endpoints

## Workflow Smoke Test

Use this sequence to validate the end-to-end operating model after major workflow changes:

1. Log in as `admin@sikaprime.local` and update a product, guardrail term, or audience segment in `/knowledge`.
2. Open `/trends` and refresh the trend engine.
3. Open `/content`, generate a few ideas, and convert one idea into a draft.
4. Edit the draft and submit it for review.
5. Log in as `reviewer@sikaprime.local`, open `/workflow`, and either approve it or send it for revision.
6. Open `/calendar` and confirm warnings or timing suggestions appear when the queue is unbalanced.
7. Open `/publishing`, publish an approved item, and verify a history record is created.
8. If WhatsApp Cloud API is configured, publish a WhatsApp item with a destination number and confirm it creates a live publish record.
9. Run the performance sync endpoint and confirm fresh `PerformanceSnapshot` rows appear in analytics-driven pages.
10. Open `/library` and confirm a published item can be reused or repurposed into a new draft.
11. Open `/analytics` and confirm product, trend, theme, and posting-window insights render.
12. Open `/recommendations`, ask a planning question, and confirm the answer explains the next move.

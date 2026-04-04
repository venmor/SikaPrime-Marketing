# Vercel Deployment Checklist

Use this checklist when moving the Sika Prime Marketing Agent to Vercel.

References:

- Vercel Project Settings: https://vercel.com/docs/project-configuration/project-settings
- Vercel Environment Variables: https://vercel.com/docs/environment-variables/managing-environment-variables
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs/manage-cron-jobs

## 1. Connect the Project

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, click `Add New` then `Project`.
3. Import this repository.
4. Confirm the framework is detected as `Next.js`.
5. Confirm the Root Directory is the repository root.
6. Deploy once to create the project.

## 2. Add Environment Variables

In Vercel Dashboard:

1. Open the project.
2. Go to `Settings`.
3. Open `Environment Variables`.
4. Add the following values.

Required for production:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `OPENAI_API_KEY`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `CRON_SECRET`

Optional but recommended:

- `OPENAI_MODEL`
- `META_GRAPH_API_VERSION`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `SLACK_WEBHOOK_URL`
- `OBSERVABILITY_SLOW_API_THRESHOLD_MS`
- `EXTERNAL_API_TIMEOUT_MS`
- `PUBLISH_MAX_RETRIES`
- `PUBLISH_BATCH_SIZE`

Recommended values:

- `OPENAI_MODEL=gpt-4.1-mini`
- `META_GRAPH_API_VERSION=v22.0`
- `OBSERVABILITY_SLOW_API_THRESHOLD_MS=2500`
- `EXTERNAL_API_TIMEOUT_MS=12000`
- `PUBLISH_MAX_RETRIES=2`
- `PUBLISH_BATCH_SIZE=10`

Environment guidance:

- Add all required values to `Production`
- Add the same values to `Preview` if you want preview deployments to fully work
- Add `Development` only if you plan to use `vercel env pull`

## 3. Generate Secure Secrets

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

Generate `CRON_SECRET`:

```bash
openssl rand -base64 32
```

Notes:

- `CRON_SECRET` is not provided by Vercel. You create it yourself.
- Vercel encrypts environment variable values at rest according to their docs.
- After adding or changing env vars, redeploy so the new deployment receives them.

## 4. Cron Setup

This project already includes [vercel.json](/home/charlie/SIKA%20PRIME%20MARKETING%20AGENT/vercel.json) with a free-plan-safe cron definition.

Configured schedules:

- `/api/jobs/daily-maintenance` at `0 5 * * *`

Meaning in Lusaka time:

- `0 5 * * *` UTC = `07:00` Africa/Lusaka

What they do:

- `daily-maintenance`: refreshes trends, refreshes recommendations, publishes due content, and syncs recent Facebook performance

Important:

- Vercel cron invokes routes with `GET`
- This app supports both `GET` and `POST` for job routes
- The routes are secured by `CRON_SECRET`
- On the Hobby/free plan, cron expressions can only run once per day, so the other job routes are kept for manual use

## 5. Database Choice

Current recommendation:

- Use hosted PostgreSQL
- Neon Free is a strong fit for this project on Vercel

Suggested production step:

1. Provision a Neon Postgres database
2. Add the pooled connection string as `DATABASE_URL`
3. Add the direct connection string as `DIRECT_URL`
4. Run the schema setup against the production database

## 6. First Production Deploy

1. Add env vars
2. Confirm `vercel.json` is in the repo
3. Trigger a fresh production deployment
4. Open the production URL
5. Log in with seeded or production credentials

## 7. Post-Deploy Smoke Test

Run this checklist after the first deployment:

1. Log in successfully
2. Open `/dashboard`
3. Open `/trends` and refresh trends
4. Open `/content` and generate content
5. Open `/workflow` and approve or revise content
6. Open `/calendar` and confirm scheduled items appear
7. Open `/publishing` and publish an approved Facebook item
8. If WhatsApp credentials are set, publish a WhatsApp item with a destination number
9. Open `/analytics` and confirm metrics render
10. Open `/recommendations` and confirm planning suggestions render
11. Open `/library` and test reuse or repurpose
12. Open `/api/health` and confirm it reports a connected database

Then run the automated read-only smoke test against the live deployment:

```bash
npm run smoke:vercel -- https://YOUR-PRODUCTION-DOMAIN
```

## 8. Manual Job Checks

You can test cron-protected routes manually from your terminal:

```bash
curl "https://YOUR-PRODUCTION-DOMAIN/api/jobs/daily-maintenance?secret=YOUR_CRON_SECRET"
```

```bash
curl "https://YOUR-PRODUCTION-DOMAIN/api/jobs/refresh-trends?secret=YOUR_CRON_SECRET"
```

```bash
curl "https://YOUR-PRODUCTION-DOMAIN/api/jobs/publish-due?secret=YOUR_CRON_SECRET"
```

```bash
curl "https://YOUR-PRODUCTION-DOMAIN/api/jobs/sync-performance?secret=YOUR_CRON_SECRET"
```

## 9. Optional Integration Completion

### WhatsApp Cloud API

Needed values:

- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`

Also needed in-app:

- Set a destination number on the content item before publishing

### Slack Alerts

Needed value:

- `SLACK_WEBHOOK_URL`

This enables notifications for:

- content submitted for review
- content approved
- revision requests
- publishing failures

### Facebook Performance Sync

Needed values:

- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`

This enables:

- post publishing
- post URL sync
- performance snapshot refresh for recent live posts

## 10. Operational Observability

The app now logs operational warnings and errors for:

- failed Facebook and WhatsApp publishes
- trend source refresh failures
- slow external API responses from OpenAI, Meta, and RSS sources
- daily maintenance job failures
- scheduled publish backlog warnings when due volume exceeds the configured batch size

These signals are available through:

- `/api/health` for deployment smoke tests
- the activity log data in the database for deeper review

## 11. Maintenance Routine

Weekly:

- Check Vercel Cron logs
- Check failed function invocations
- Review publishing failures
- Review `/api/health` for recent operational warnings and errors
- Review Slack alerts

Monthly:

- Rotate secrets if needed
- Review Meta and OpenAI usage
- Audit environment variables
- Review trend source quality and performance sync accuracy

## 12. Recommended Production Follow-Up

These are the next high-value improvements after the first Vercel deployment:

1. Keep Neon on a stable branch or upgrade plans as traffic grows
2. Configure SMTP delivery and invite real production users through `/access`
3. Add a custom domain
4. Add Vercel Analytics or logs monitoring
5. Add WhatsApp Cloud API credentials if direct messaging is required
6. Add Slack webhook for operational alerts
7. Move from batch-limited publishing to a dedicated queue if scheduled volume grows materially

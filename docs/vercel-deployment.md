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

Recommended values:

- `OPENAI_MODEL=gpt-4.1-mini`
- `META_GRAPH_API_VERSION=v22.0`

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

This project already includes [vercel.json](/home/charlie/SIKA%20PRIME%20MARKETING%20AGENT/vercel.json) with cron definitions.

Configured schedules:

- `/api/jobs/refresh-trends` at `0 5 * * *`
- `/api/jobs/publish-due` at `*/15 * * * *`

Meaning in Lusaka time:

- `0 5 * * *` UTC = `07:00` Africa/Lusaka
- `*/15 * * * *` = every 15 minutes

What they do:

- `refresh-trends`: refreshes trends and recommendations
- `publish-due`: publishes due content and syncs recent Facebook performance

Important:

- Vercel cron invokes routes with `GET`
- This app supports both `GET` and `POST` for job routes
- The routes are secured by `CRON_SECRET`

## 5. Database Choice

Current default:

- Local development uses SQLite

For real production on Vercel:

- Do not use local SQLite as your long-term production database
- Move to a hosted database such as Postgres before serious production use

Suggested next production step:

1. Provision a hosted Postgres database
2. Update `DATABASE_URL` in Vercel
3. Update Prisma provider if you decide to migrate from SQLite to Postgres
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

## 8. Manual Job Checks

You can test cron-protected routes manually from your terminal:

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

## 10. Maintenance Routine

Weekly:

- Check Vercel Cron logs
- Check failed function invocations
- Review publishing failures
- Review Slack alerts

Monthly:

- Rotate secrets if needed
- Review Meta and OpenAI usage
- Audit environment variables
- Review trend source quality and performance sync accuracy

## 11. Recommended Production Follow-Up

These are the next high-value improvements after the first Vercel deployment:

1. Move from SQLite to hosted Postgres
2. Add production auth accounts instead of seeded demo-only usage
3. Add a custom domain
4. Add Vercel Analytics or logs monitoring
5. Add WhatsApp Cloud API credentials if direct messaging is required
6. Add Slack webhook for operational alerts

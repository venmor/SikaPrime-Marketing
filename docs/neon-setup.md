# Neon Free Setup

Use this guide to connect the Sika Prime Marketing Agent to a free Neon Postgres database.

References:

- Neon docs: https://neon.com/docs
- Prisma + Neon docs: https://docs.prisma.io/docs/v6/orm/overview/databases/neon

## 1. Create a Neon Project

1. Open Neon and sign in.
2. Create a new project on the free plan.
3. Pick a project name such as `sika-prime-marketing`.
4. Choose the region closest to your users if possible.
5. Wait for the database branch to be created.

## 2. Copy the Two Connection Strings

You need two different URLs from Neon:

- `DATABASE_URL`
  Use the pooled connection string.
- `DIRECT_URL`
  Use the direct non-pooled connection string.

If you use the Neon-managed Vercel integration, Neon may expose:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`

In that case, map them like this for this app:

- `DATABASE_URL` -> keep as `DATABASE_URL`
- `DATABASE_URL_UNPOOLED` -> copy into `DIRECT_URL`

Typical shape:

```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_PROJECT-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_PROJECT.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"
```

Notes:

- The pooled URL usually contains `-pooler` in the hostname.
- The direct URL does not.
- Keep `sslmode=require`.
- `connect_timeout=15` is helpful for cold starts.

## 3. Update Local `.env`

Open your local [`.env`](/home/charlie/SIKA%20PRIME%20MARKETING%20AGENT/.env) and set:

```env
DATABASE_URL="YOUR_NEON_POOLED_URL"
DIRECT_URL="YOUR_NEON_DIRECT_URL"
```

Do not remove your existing app secrets such as:

- `AUTH_SECRET`
- `OPENAI_API_KEY`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`
- `CRON_SECRET`

## 4. Initialize the Neon Database

From the project root:

```bash
npm run db:generate
npm run db:init
```

What this does:

- generates Prisma Client
- pushes the schema to Neon
- seeds demo data into Neon
- uses `DIRECT_URL` for the seed step so one-off setup does not depend on the Neon pooler

## 5. Start the App

```bash
npm run dev
```

Then open:

- `http://localhost:3000`

## 6. Verify It Works

Check these flows:

1. Log in with a seeded demo account
2. Open `/dashboard`
3. Open `/content` and generate a draft
4. Open `/knowledge` and confirm data appears
5. Open `/publishing` and confirm queued/published data loads

## 7. Add Neon To Vercel

In Vercel project settings, add:

- `DATABASE_URL`
- `DIRECT_URL`

Use the same Neon URLs there.

If Neon injected `DATABASE_URL_UNPOOLED` instead of `DIRECT_URL`, manually create `DIRECT_URL` in Vercel with the unpooled value.

## 8. Recommended Neon Practices

- Use the pooled URL for `DATABASE_URL`
- Use the direct URL for `DIRECT_URL`
- Keep one stable main branch in Neon for production
- If you experiment, use additional Neon branches instead of changing production data directly

## 9. Common Problems

### `P1001` connection timeout

This usually means the Neon compute was idle and needed to wake up.

Keep:

- `sslmode=require`
- `connect_timeout=15`

### Prisma command fails because `DIRECT_URL` is missing

Make sure both URLs are set:

- `DATABASE_URL`
- `DIRECT_URL`

### App deploys but database is empty

Run:

```bash
npm run db:init
```

against the Neon database you want to use.

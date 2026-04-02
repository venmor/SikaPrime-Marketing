import { execSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

if (
  !databaseUrl ||
  (!databaseUrl.startsWith("postgres://") &&
    !databaseUrl.startsWith("postgresql://"))
) {
  console.error(
    "DATABASE_URL must be a PostgreSQL connection string, such as a Neon pooled connection URL.",
  );
  process.exit(1);
}

if (
  !directUrl ||
  (!directUrl.startsWith("postgres://") &&
    !directUrl.startsWith("postgresql://"))
) {
  console.error(
    "DIRECT_URL must be a direct PostgreSQL connection string, such as a Neon direct connection URL.",
  );
  process.exit(1);
}

execSync("npx prisma db push --skip-generate", {
  stdio: "inherit",
  env: process.env,
});

// Seed through the direct connection to avoid PgBouncer/pooler issues during
// one-off setup tasks on hosted Postgres providers like Neon.
execSync("npx prisma db seed", {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: directUrl,
  },
});

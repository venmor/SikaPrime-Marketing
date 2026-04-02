import { execSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.startsWith("file:")) {
  console.error("DATABASE_URL must be a SQLite file: URL.");
  process.exit(1);
}

const databasePath = databaseUrl.replace(/^file:/, "");

if (!databasePath) {
  console.error("DATABASE_URL does not contain a filesystem path.");
  process.exit(1);
}

mkdirSync(path.dirname(databasePath), { recursive: true });

if (existsSync(databasePath)) {
  rmSync(databasePath);
}

const sql = execSync(
  "npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script",
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  },
).toString();

const sqliteResult = spawnSync("sqlite3", [databasePath], {
  input: sql,
  stdio: ["pipe", "inherit", "inherit"],
});

if (sqliteResult.status !== 0) {
  process.exit(sqliteResult.status ?? 1);
}

execSync("npx prisma db seed", {
  stdio: "inherit",
  env: process.env,
});

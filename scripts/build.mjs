import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(fileName) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function run(command) {
  console.log(`\n> ${command}`);
  execSync(command, {
    stdio: "inherit",
    env: process.env,
  });
}

function shouldSyncSchemaOnBuild() {
  const explicit = process.env.PRISMA_SYNC_ON_BUILD?.trim().toLowerCase();

  if (explicit === "true") {
    return true;
  }

  if (explicit === "false") {
    return false;
  }

  return process.env.VERCEL_ENV === "production";
}

loadEnvFile(".env");
loadEnvFile(".env.local");

run("npx prisma generate");

if (shouldSyncSchemaOnBuild()) {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    throw new Error(
      "DATABASE_URL and DIRECT_URL must be set when Prisma schema sync runs during build.",
    );
  }

  run("npx prisma db push --skip-generate");
} else {
  console.log("\n> Skipping prisma db push during build");
}

run("next build");

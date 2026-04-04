import "server-only";

import { subHours } from "date-fns";

import { logActivity } from "@/lib/audit/service";
import { prisma } from "@/lib/db";

const OPERATIONAL_EVENT_ENTITY_TYPE = "operational_event";
const RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

type OperationalSeverity = "info" | "warning" | "error";

type OperationalMetadata = Record<string, unknown>;

function getPositiveIntegerEnv(name: string, fallback: number) {
  const raw = process.env[name];
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number) {
  return Math.min(300 * 2 ** (attempt - 1), 2_000);
}

function summarizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function stripEmptyMetadata(metadata?: OperationalMetadata | null) {
  if (!metadata) {
    return null;
  }

  const entries = Object.entries(metadata).filter(([, value]) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  });

  return entries.length ? Object.fromEntries(entries) : null;
}

function sanitizeUrl(input: string | URL) {
  try {
    const url = new URL(String(input));
    return `${url.origin}${url.pathname}`;
  } catch {
    return String(input);
  }
}

function combineSignals(
  signal?: AbortSignal | null,
  timeoutSignal?: AbortSignal | null,
) {
  if (signal && timeoutSignal) {
    return AbortSignal.any([signal, timeoutSignal]);
  }

  return signal ?? timeoutSignal ?? undefined;
}

async function safeLogActivity(input: {
  entityId: string;
  action: string;
  summary: string;
  details?: string | null;
}) {
  try {
    await logActivity({
      entityType: OPERATIONAL_EVENT_ENTITY_TYPE,
      entityId: input.entityId,
      action: input.action,
      summary: input.summary,
      details: input.details ?? null,
    });
  } catch (error) {
    console.error("Failed to record operational event", error);
  }
}

export function getExternalApiTimeoutMs() {
  return getPositiveIntegerEnv("EXTERNAL_API_TIMEOUT_MS", 12_000);
}

export function getSlowApiThresholdMs() {
  return getPositiveIntegerEnv("OBSERVABILITY_SLOW_API_THRESHOLD_MS", 2_500);
}

export function getPublishRetryCount() {
  return getPositiveIntegerEnv("PUBLISH_MAX_RETRIES", 2);
}

export function getPublishBatchSize() {
  return getPositiveIntegerEnv("PUBLISH_BATCH_SIZE", 10);
}

export function isRetryableStatus(status: number) {
  return RETRYABLE_STATUS_CODES.has(status);
}

export async function logOperationalEvent(input: {
  severity: OperationalSeverity;
  source: string;
  operation: string;
  message: string;
  durationMs?: number | null;
  attempts?: number | null;
  metadata?: OperationalMetadata | null;
}) {
  const details = stripEmptyMetadata({
    durationMs: input.durationMs ?? undefined,
    attempts: input.attempts ?? undefined,
    ...input.metadata,
  });

  await safeLogActivity({
    entityId: `${input.source}:${input.operation}`,
    action: `operations.${input.severity}`,
    summary: input.message,
    details: details ? JSON.stringify(details) : null,
  });
}

export async function fetchWithObservability(
  input: string | URL,
  init: RequestInit | undefined,
  options: {
    source: string;
    operation: string;
    metadata?: OperationalMetadata | null;
    timeoutMs?: number;
    retries?: number;
    slowThresholdMs?: number;
  },
) {
  const timeoutMs = options.timeoutMs ?? getExternalApiTimeoutMs();
  const retries = options.retries ?? 0;
  const slowThresholdMs = options.slowThresholdMs ?? getSlowApiThresholdMs();
  const method = init?.method ?? "GET";
  const url = sanitizeUrl(input);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(input, {
        ...init,
        cache: init?.cache ?? "no-store",
        signal: combineSignals(init?.signal, timeoutController.signal),
      });
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startedAt;

      if (durationMs >= slowThresholdMs) {
        await logOperationalEvent({
          severity: "warning",
          source: options.source,
          operation: options.operation,
          message: `Slow external response from ${options.source} for ${options.operation}.`,
          durationMs,
          attempts: attempt,
          metadata: {
            method,
            status: response.status,
            url,
            ...options.metadata,
          },
        });
      }

      if (response.ok) {
        clearTimeout(timeoutId);
        return response;
      }

      const retryable = attempt <= retries && isRetryableStatus(response.status);

      await logOperationalEvent({
        severity: retryable ? "warning" : "error",
        source: options.source,
        operation: options.operation,
        message: `${options.source} returned HTTP ${response.status} during ${options.operation}.`,
        durationMs,
        attempts: attempt,
        metadata: {
          method,
          status: response.status,
          url,
          ...options.metadata,
        },
      });

      if (!retryable) {
        return response;
      }

      await wait(backoffDelay(attempt));
    } catch (error) {
      clearTimeout(timeoutId);
      const durationMs = Date.now() - startedAt;
      const message = summarizeError(error);
      const retryable = attempt <= retries;

      await logOperationalEvent({
        severity: retryable ? "warning" : "error",
        source: options.source,
        operation: options.operation,
        message:
          error instanceof Error && error.name === "AbortError"
            ? `${options.source} timed out during ${options.operation}.`
            : `${options.source} failed during ${options.operation}.`,
        durationMs,
        attempts: attempt,
        metadata: {
          method,
          timeoutMs,
          url,
          error: message,
          ...options.metadata,
        },
      });

      if (!retryable) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(message);
      await wait(backoffDelay(attempt));
    }
  }

  throw lastError ?? new Error("External request failed.");
}

function parseDetails(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as OperationalMetadata;
  } catch {
    return { raw: value };
  }
}

export async function getOperationalHealthSnapshot() {
  const checkedAt = new Date().toISOString();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    return {
      ok: false,
      status: "unhealthy" as const,
      checkedAt,
      database: {
        ok: false,
        message: summarizeError(error),
      },
      operations: {
        recentWarningCount: 0,
        recentErrorCount: 0,
        latestEvents: [],
      },
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    };
  }

  const recentEvents = await prisma.activityLog.findMany({
    where: {
      entityType: OPERATIONAL_EVENT_ENTITY_TYPE,
      createdAt: {
        gte: subHours(new Date(), 24),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 12,
  });

  const recentWarningCount = recentEvents.filter(
    (event) => event.action === "operations.warning",
  ).length;
  const recentErrorCount = recentEvents.filter(
    (event) => event.action === "operations.error",
  ).length;

  return {
    ok: true,
    status: recentErrorCount > 0 ? ("degraded" as const) : ("healthy" as const),
    checkedAt,
    database: {
      ok: true,
      message: "Connected",
    },
    operations: {
      recentWarningCount,
      recentErrorCount,
      latestEvents: recentEvents.slice(0, 6).map((event) => ({
        action: event.action,
        summary: event.summary,
        details: parseDetails(event.details),
        createdAt: event.createdAt.toISOString(),
      })),
    },
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  };
}

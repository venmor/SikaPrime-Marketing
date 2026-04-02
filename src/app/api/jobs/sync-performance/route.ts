import { NextResponse } from "next/server";

import {
  isAuthorizedJobRequest,
  unauthorizedJobResponse,
} from "@/lib/jobs/auth";
import { syncRecentPublicationMetrics } from "@/lib/publishing/service";

async function handleSyncPerformance(request: Request) {
  if (!isAuthorizedJobRequest(request)) {
    return unauthorizedJobResponse();
  }

  const syncedPublicationIds = await syncRecentPublicationMetrics();

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    syncedPerformanceCount: syncedPublicationIds.length,
  });
}

export async function GET(request: Request) {
  return handleSyncPerformance(request);
}

export async function POST(request: Request) {
  return handleSyncPerformance(request);
}

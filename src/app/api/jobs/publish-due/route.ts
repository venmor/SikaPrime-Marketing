import { NextResponse } from "next/server";

import {
  runDuePublications,
  syncRecentPublicationMetrics,
} from "@/lib/publishing/service";
import {
  isAuthorizedJobRequest,
  unauthorizedJobResponse,
} from "@/lib/jobs/auth";

async function handlePublishDue(request: Request) {
  if (!isAuthorizedJobRequest(request)) {
    return unauthorizedJobResponse();
  }

  const publications = await runDuePublications();
  const syncedPublicationIds = await syncRecentPublicationMetrics();

  return NextResponse.json({
    processedAt: new Date().toISOString(),
    publishedCount: publications.length,
    syncedPerformanceCount: syncedPublicationIds.length,
  });
}

export async function GET(request: Request) {
  return handlePublishDue(request);
}

export async function POST(request: Request) {
  return handlePublishDue(request);
}

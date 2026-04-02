import { NextResponse } from "next/server";

import { refreshRecommendations } from "@/lib/engines/recommendations/service";
import { refreshTrendSignals } from "@/lib/engines/trends/service";
import {
  isAuthorizedJobRequest,
  unauthorizedJobResponse,
} from "@/lib/jobs/auth";

async function handleRefresh(request: Request) {
  if (!isAuthorizedJobRequest(request)) {
    return unauthorizedJobResponse();
  }

  const trends = await refreshTrendSignals();
  const recommendations = await refreshRecommendations();

  return NextResponse.json({
    refreshedAt: new Date().toISOString(),
    localTrendCount: trends.local.length,
    globalTrendCount: trends.global.length,
    recommendationCount: recommendations.length,
  });
}

export async function GET(request: Request) {
  return handleRefresh(request);
}

export async function POST(request: Request) {
  return handleRefresh(request);
}

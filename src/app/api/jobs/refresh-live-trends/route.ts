import { NextResponse } from "next/server";

import {
  isAuthorizedJobRequest,
  unauthorizedJobResponse,
} from "@/lib/jobs/auth";
import { runLiveTrendRefreshJob } from "@/lib/jobs/service";

async function handleLiveTrendRefresh(request: Request) {
  if (!isAuthorizedJobRequest(request)) {
    return unauthorizedJobResponse();
  }

  const result = await runLiveTrendRefreshJob();

  return NextResponse.json(result);
}

export async function GET(request: Request) {
  return handleLiveTrendRefresh(request);
}

export async function POST(request: Request) {
  return handleLiveTrendRefresh(request);
}

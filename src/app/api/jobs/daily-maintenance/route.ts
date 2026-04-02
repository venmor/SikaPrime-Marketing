import { NextResponse } from "next/server";

import {
  isAuthorizedJobRequest,
  unauthorizedJobResponse,
} from "@/lib/jobs/auth";
import { runDailyMaintenance } from "@/lib/jobs/service";

async function handleDailyMaintenance(request: Request) {
  if (!isAuthorizedJobRequest(request)) {
    return unauthorizedJobResponse();
  }

  const result = await runDailyMaintenance();

  return NextResponse.json(result, {
    status: result.errors.length ? 500 : 200,
  });
}

export async function GET(request: Request) {
  return handleDailyMaintenance(request);
}

export async function POST(request: Request) {
  return handleDailyMaintenance(request);
}

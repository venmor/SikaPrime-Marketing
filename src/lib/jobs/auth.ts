import { NextResponse } from "next/server";

export function isAuthorizedJobRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  return (
    request.headers.get("authorization") === `Bearer ${secret}` ||
    new URL(request.url).searchParams.get("secret") === secret
  );
}

export function unauthorizedJobResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

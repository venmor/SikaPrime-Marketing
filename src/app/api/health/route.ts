import { NextResponse } from "next/server";

import { getOperationalHealthSnapshot } from "@/lib/operations/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getOperationalHealthSnapshot();

  return NextResponse.json(snapshot, {
    status: snapshot.ok ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

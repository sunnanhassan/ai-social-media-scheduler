import { NextResponse } from "next/server.js";

/**
 * Validates CRON_SECRET authorization for scheduled worker invocations.
 */
export function verifyCronSecret(request: Request): {
  authorized: boolean;
  response?: NextResponse;
} {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { authorized: true };
}


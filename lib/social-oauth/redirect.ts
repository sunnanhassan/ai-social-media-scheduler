import { NextResponse } from "next/server";

export function buildRedirectUrl(
  appUrl: string,
  redirectTo: string,
  params: Record<string, string>
): NextResponse {
  try {
    const url = new URL(redirectTo, appUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return NextResponse.redirect(url);
  } catch {
    const fallback = new URL("/settings", appUrl);
    Object.entries(params).forEach(([key, value]) => {
      fallback.searchParams.set(key, value);
    });
    return NextResponse.redirect(fallback);
  }
}

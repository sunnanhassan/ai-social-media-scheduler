import { NextResponse } from "next/server.js";

export function buildRedirectUrl(
  appUrl: string,
  redirectTo: string,
  params: Record<string, string>
): NextResponse {
  try {
    const baseOrigin = new URL(appUrl).origin;
    // Disallow protocol-relative URLs (e.g. //attacker.com) and non-matching origins
    const safeTarget = redirectTo.startsWith("//") ? "/settings" : redirectTo;
    let url = new URL(safeTarget, appUrl);

    if (url.origin !== baseOrigin) {
      url = new URL("/settings", appUrl);
    }

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

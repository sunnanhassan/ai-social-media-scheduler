/**
 * Determines whether a token is expired or within the proactive refresh safety buffer (default: 5 mins).
 */
export function shouldRefreshToken(
  tokenExpiresAt: number | null | undefined,
  bufferMs: number = 5 * 60 * 1000
): boolean {
  if (tokenExpiresAt === null || tokenExpiresAt === undefined) return false;
  return tokenExpiresAt <= Date.now() + bufferMs;
}

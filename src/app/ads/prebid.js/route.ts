/**
 * Bait endpoint for anti-adblock fetch detection.
 * Ad blockers commonly block requests to /ads/* paths.
 * If this endpoint is blocked, we know an ad blocker is active.
 */
export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

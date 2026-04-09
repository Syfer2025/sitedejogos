import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { recordAnalyticsEvent } from "@/data/analyticsStore";
import { publicAnalyticsEventSchema } from "@/lib/analytics";
import { getClientIp } from "@/lib/admin-auth";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = publicAnalyticsEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (parsed.data.type === "page_view") {
    if (
      parsed.data.path.startsWith("/admin") ||
      parsed.data.path.startsWith("/api")
    ) {
      return NextResponse.json({ ok: true, skipped: true });
    }
  } else if (parsed.data.type === "home_click") {
    if (!parsed.data.path.startsWith("/home/")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  } else if (parsed.data.type === "blog_view") {
    if (!parsed.data.path.startsWith("/blog/")) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  } else {
    if (
      parsed.data.path.startsWith("/admin") ||
      parsed.data.path.startsWith("/api") ||
      !parsed.data.destinationPath.startsWith("/blog/")
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  }

  const ipAddress = getClientIp(req);
  const limit = consumeRateLimit(
    `analytics:${ipAddress}:${parsed.data.sessionId}:${parsed.data.type}:${parsed.data.path}:${"destinationPath" in parsed.data ? parsed.data.destinationPath : "-"}`,
    {
      limit: 8,
      windowMs: 10 * 60 * 1000,
    },
  );

  if (!limit.ok) {
    return NextResponse.json({ ok: true, rateLimited: true });
  }

  // Fire-and-forget: don't await DB write, skip session lookup to save a query
  recordAnalyticsEvent({
    type: parsed.data.type,
    path: parsed.data.path,
    destinationPath:
      parsed.data.type === "home_click" ||
      parsed.data.type === "blog_impression" ||
      parsed.data.type === "blog_click"
        ? parsed.data.destinationPath
        : undefined,
    sessionId: parsed.data.sessionId,
    referrer: parsed.data.referrer,
  }).catch(() => {});

  return NextResponse.json({ ok: true }, { status: 202 });
}
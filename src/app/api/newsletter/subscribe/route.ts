import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { consumeRateLimitAsync } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/admin-auth";

const schema = z.object({
  email: z.string().trim().email("Invalid email address."),
  locale: z.string().optional().default("en-US"),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = await consumeRateLimitAsync(`newsletter:${ip}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 per hour per IP
  });

  if (!limit.ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid email." },
      { status: 400 },
    );
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email.toLowerCase() },
      create: {
        email: parsed.data.email.toLowerCase(),
        locale: parsed.data.locale,
        active: true,
      },
      update: { active: true }, // re-subscribe if previously unsubscribed
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not subscribe. Try again." }, { status: 500 });
  }
}

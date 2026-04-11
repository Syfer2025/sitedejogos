/**
 * Web Push notification sender.
 * Uses the Web Push Protocol with VAPID authentication.
 * Requires env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
 */

import { prisma } from "@/lib/prisma";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
};

async function sendWebPush(endpoint: string, p256dh: string, auth: string, payload: PushPayload) {
  // Dynamically import web-push only on the server
  const webpush = await import("web-push").catch(() => null);
  if (!webpush) {
    console.warn("[push-notify] web-push package not installed. Run: npm install web-push");
    return;
  }

  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT ?? "mailto:admin@gastygames.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("[push-notify] VAPID keys not configured. Skipping push notification.");
    return;
  }

  webpush.default.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  await webpush.default.sendNotification(
    { endpoint, keys: { p256dh, auth } },
    JSON.stringify(payload),
  );
}

/**
 * Notify a specific user via push.
 */
export async function notifyUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  await Promise.allSettled(
    subscriptions.map((sub) => sendWebPush(sub.endpoint, sub.p256dh, sub.auth, payload)),
  );
}

/**
 * Send ranking-passed notification to a user.
 * Call this when leaderboard recompute detects someone was overtaken.
 */
export async function notifyRankingPassed(
  passedUserId: string,
  passerDisplayName: string,
  newRank: number,
) {
  await notifyUser(passedUserId, {
    title: "📊 Você foi ultrapassado no ranking!",
    body: `${passerDisplayName} acabou de te passar. Você está agora na posição #${newRank}.`,
    url: "/account",
    tag: "ranking-passed",
    icon: "/icons/icon-192.png",
  });
}

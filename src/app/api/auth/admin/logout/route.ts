import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  clearAdminSessionCookie,
  deleteAdminSession,
} from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  const res = NextResponse.json({ ok: true });

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) {
    await deleteAdminSession(token);
  }

  clearAdminSessionCookie(res);

  return res;
}

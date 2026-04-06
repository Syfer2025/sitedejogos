import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  clearPlayerSessionCookie,
  deletePlayerSession,
  PLAYER_SESSION_COOKIE,
} from "@/lib/user-auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(PLAYER_SESSION_COOKIE)?.value;

  if (token) {
    await deletePlayerSession(token);
  }

  const response = NextResponse.json({ ok: true });
  clearPlayerSessionCookie(response);
  return response;
}
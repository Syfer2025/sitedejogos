import { NextResponse } from "next/server";

export async function GET() {
  const email = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_PASSWORD_HASH;

  return NextResponse.json({
    emailSet: !!email,
    emailLength: email?.length || 0,
    emailLower: email?.toLowerCase() === email,
    hashSet: !!hash,
    hashLength: hash?.length || 0,
    hashPrefix: hash?.substring(0, 5), // $2b$10
    hashSuffix: hash?.substring(hash.length - 3),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}

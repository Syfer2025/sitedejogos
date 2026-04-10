import { NextResponse } from "next/server";

export async function GET() {
  const email = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const b64Hash = process.env.ADMIN_PASSWORD_HASH_B64;

  return NextResponse.json({
    emailSet: !!email,
    emailLength: email?.length || 0,
    hashSet: !!hash,
    hashLength: hash?.length || 0,
    hashPrefix: hash?.substring(0, 5),
    b64Set: !!b64Hash,
    b64Length: b64Hash?.length || 0,
    b64Prefix: b64Hash?.substring(0, 5),
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}

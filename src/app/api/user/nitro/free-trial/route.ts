import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPlayerSessionFromRequest } from "@/lib/user-auth";
import { grantPremium } from "@/data/monetizationStore";
import { prisma } from "@/lib/prisma";

const FREE_TRIAL_DAYS = 3;

export async function POST(request: NextRequest) {
  const session = await getPlayerSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hadFreeTrial: true, isPremium: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
  }

  if (user.isPremium) {
    return NextResponse.json({ error: "Voce ja e Premium." }, { status: 400 });
  }

  if (user.hadFreeTrial) {
    return NextResponse.json({ error: "Voce ja utilizou o periodo de teste gratuito." }, { status: 400 });
  }

  await grantPremium(session.user.id, FREE_TRIAL_DAYS);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { hadFreeTrial: true },
  });

  return NextResponse.json({
    ok: true,
    message: `Premium ativado por ${FREE_TRIAL_DAYS} dias!`,
  }, { status: 201 });
}

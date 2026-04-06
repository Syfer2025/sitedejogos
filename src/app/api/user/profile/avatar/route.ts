import { NextRequest, NextResponse } from "next/server";

import { saveUploadedImage } from "@/lib/local-image-storage";
import { getPlayerSessionFromRequest } from "@/lib/user-auth";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getPlayerSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo de imagem." }, { status: 400 });
  }

  try {
    const url = await saveUploadedImage(file, {
      folder: "avatars",
      fileNamePrefix: session.userId,
      maxBytes: MAX_AVATAR_BYTES,
    });

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Não foi possível salvar a foto agora.",
      },
      { status: 400 },
    );
  }
}
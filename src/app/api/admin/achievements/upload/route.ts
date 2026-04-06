import { NextRequest, NextResponse } from "next/server";

import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { saveUploadedImage } from "@/lib/local-image-storage";

const MAX_ACHIEVEMENT_MEDIA_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um GIF ou imagem da conquista." }, { status: 400 });
  }

  try {
    const url = await saveUploadedImage(file, {
      folder: "achievements",
      fileNamePrefix: "achievement-media",
      maxBytes: MAX_ACHIEVEMENT_MEDIA_BYTES,
    });

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Não foi possível salvar a mídia agora.",
      },
      { status: 400 },
    );
  }
}

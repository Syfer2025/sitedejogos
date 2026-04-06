import { NextRequest, NextResponse } from "next/server";

import { getAdminSessionFromRequest } from "@/lib/admin-auth";
import { saveUploadedImage } from "@/lib/local-image-storage";

const MAX_BLOG_COVER_BYTES = 4 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie uma imagem de capa." }, { status: 400 });
  }

  try {
    const url = await saveUploadedImage(file, {
      folder: "blog-covers",
      fileNamePrefix: "blog-cover",
      maxBytes: MAX_BLOG_COVER_BYTES,
    });

    return NextResponse.json({ ok: true, url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Não foi possível salvar a capa agora.",
      },
      { status: 400 },
    );
  }
}
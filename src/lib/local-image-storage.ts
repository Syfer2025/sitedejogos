import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const PROJECT_ROOT = process.env.npm_package_json
  ? path.dirname(process.env.npm_package_json)
  : process.cwd();

type SaveUploadedImageOptions = {
  folder: string;
  fileNamePrefix: string;
  maxBytes: number;
};

export async function saveUploadedImage(
  file: File,
  options: SaveUploadedImageOptions,
) {
  const extension = IMAGE_EXTENSIONS[file.type];

  if (!extension) {
    throw new Error("Formato de imagem não suportado.");
  }

  if (file.size <= 0) {
    throw new Error("Envie um arquivo de imagem válido.");
  }

  if (file.size > options.maxBytes) {
    throw new Error(`A imagem excede o limite de ${Math.round(options.maxBytes / 1024 / 1024)} MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(PROJECT_ROOT, "public", "uploads", options.folder);
  const fileName = `${options.fileNamePrefix}-${Date.now()}-${randomUUID()}.${extension}`;
  const outputPath = path.join(uploadsDir, fileName);

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(outputPath, buffer);

  return `/uploads/${options.folder}/${fileName}`;
}

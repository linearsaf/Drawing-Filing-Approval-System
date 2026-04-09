import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@/lib/server/api";

const uploadRoot = path.join(process.cwd(), "public", "uploads", "drawing-requests");

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureImage(file: File | null): asserts file is File {
  if (!file) {
    throw new HttpError(422, "File gambar tidak ditemukan.");
  }

  const isImage = file.type.startsWith("image/");

  if (!isImage) {
    throw new HttpError(422, "Lampiran referensi harus berupa file gambar.");
  }
}

export async function saveDrawingRequestReferenceImage(params: {
  requestId: string;
  file: File | null;
}) {
  ensureImage(params.file);

  const extension = path.extname(params.file.name) || ".png";
  const safeFileName = `${sanitizeSegment(path.basename(params.file.name, extension)) || "reference"}${extension.toLowerCase()}`;
  const diskDir = path.join(uploadRoot, params.requestId);
  const diskPath = path.join(diskDir, safeFileName);
  const publicPath = `/uploads/drawing-requests/${params.requestId}/${safeFileName}`;
  const buffer = Buffer.from(await params.file.arrayBuffer());

  await mkdir(diskDir, { recursive: true });
  await writeFile(diskPath, buffer);

  return {
    fileName: safeFileName,
    filePath: publicPath
  };
}

export async function removeDrawingRequestFiles(requestId: string) {
  await rm(path.join(uploadRoot, requestId), { recursive: true, force: true });
}

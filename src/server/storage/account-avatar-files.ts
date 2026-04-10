import { mkdir, readdir, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@/lib/server/api";

const uploadRoot = path.join(process.cwd(), "public", "uploads", "account");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const maxFileSizeBytes = 3 * 1024 * 1024;

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureAvatarFile(file: File | null): asserts file is File {
  if (!file) {
    throw new HttpError(422, "File avatar tidak ditemukan.");
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new HttpError(422, "Avatar harus berupa JPG, PNG, WEBP, atau SVG.");
  }

  if (file.size > maxFileSizeBytes) {
    throw new HttpError(422, "Ukuran avatar maksimal 3 MB.");
  }
}

export async function saveAccountAvatar(params: { userId: string; file: File | null }) {
  ensureAvatarFile(params.file);

  const extension = path.extname(params.file.name) || ".png";
  const safeFileName = `avatar-${Date.now()}-${sanitizeSegment(path.basename(params.file.name, extension)) || "profile"}${extension.toLowerCase()}`;
  const diskDir = path.join(uploadRoot, params.userId);
  const diskPath = path.join(diskDir, safeFileName);
  const publicPath = `/uploads/account/${params.userId}/${safeFileName}`;
  const buffer = Buffer.from(await params.file.arrayBuffer());

  await mkdir(diskDir, { recursive: true });

  const existingFiles = await readdir(diskDir, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    existingFiles
      .filter((entry) => entry.isFile())
      .map((entry) => unlink(path.join(diskDir, entry.name)).catch(() => undefined))
  );

  await writeFile(diskPath, buffer);

  return {
    fileName: safeFileName,
    filePath: publicPath
  };
}

export async function removeAccountAvatarFiles(userId: string) {
  await rm(path.join(uploadRoot, userId), { recursive: true, force: true });
}

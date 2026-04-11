import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@/lib/server/api";

const uploadRoot = path.join(process.cwd(), "public", "uploads", "approval-actions");
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const maxFileSizeBytes = 3 * 1024 * 1024;

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensureDecisionImage(file: File | null): asserts file is File {
  if (!file) {
    throw new HttpError(422, "File gambar catatan tidak ditemukan.");
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new HttpError(422, "Lampiran catatan reject harus berupa JPG, PNG, WEBP, atau SVG.");
  }

  if (file.size > maxFileSizeBytes) {
    throw new HttpError(422, "Ukuran gambar catatan reject maksimal 3 MB.");
  }
}

async function saveApprovalDecisionImage(params: {
  approvalActionId: string;
  file: File | null;
  index: number;
}) {
  ensureDecisionImage(params.file);

  const extension = path.extname(params.file.name) || ".png";
  const safeBaseName =
    sanitizeSegment(path.basename(params.file.name, extension)) || `review-image-${params.index + 1}`;
  const safeFileName = `${params.index + 1}-${safeBaseName}${extension.toLowerCase()}`;
  const diskDir = path.join(uploadRoot, params.approvalActionId);
  const diskPath = path.join(diskDir, safeFileName);
  const publicPath = `/uploads/approval-actions/${params.approvalActionId}/${safeFileName}`;
  const buffer = Buffer.from(await params.file.arrayBuffer());

  await mkdir(diskDir, { recursive: true });
  await writeFile(diskPath, buffer);

  return {
    fileName: safeFileName,
    filePath: publicPath
  };
}

export async function saveApprovalDecisionImages(params: {
  approvalActionId: string;
  files: File[];
}) {
  if (params.files.length > 3) {
    throw new HttpError(422, "Maksimal 3 gambar catatan reject dapat diunggah.");
  }

  const storedFiles = [];

  for (const [index, file] of params.files.entries()) {
    storedFiles.push(
      await saveApprovalDecisionImage({
        approvalActionId: params.approvalActionId,
        file,
        index
      })
    );
  }

  return storedFiles;
}

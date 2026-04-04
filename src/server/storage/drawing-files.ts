import { mkdir, writeFile, copyFile, rm, access, readdir } from "node:fs/promises";
import path from "node:path";
import { HttpError } from "@/lib/server/api";

const uploadRoot = path.join(process.cwd(), "public", "uploads", "drawings");

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function ensurePdf(file: File | null): asserts file is File {
  if (!file) {
    throw new HttpError(422, "File PDF wajib diunggah.");
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new HttpError(422, "File yang diunggah harus berformat PDF.");
  }
}

function buildPaths(drawingId: string, revisionNo: string, fileName: string) {
  const safeRevision = sanitizeSegment(revisionNo.toLowerCase()) || "a";
  const safeFileName = sanitizeSegment(fileName) || "drawing.pdf";
  const publicDir = `/uploads/drawings/${drawingId}/rev-${safeRevision}`;
  const diskDir = path.join(uploadRoot, drawingId, `rev-${safeRevision}`);

  return {
    safeFileName,
    originalPublicPath: `${publicDir}/${safeFileName}`,
    watermarkedPublicPath: `${publicDir}/watermarked-${safeFileName}`,
    originalDiskPath: path.join(diskDir, safeFileName),
    watermarkedDiskPath: path.join(diskDir, `watermarked-${safeFileName}`),
    diskDir
  };
}

export function resolvePublicFilePath(publicPath: string) {
  const normalized = publicPath.replace(/^\/+/, "");
  return path.join(process.cwd(), "public", normalized);
}

export function resolveManagedDrawingFilePath(publicPath: string) {
  const normalizedPath = publicPath.startsWith("/drawings/")
    ? publicPath.replace(/^\/drawings\//, "/uploads/drawings/")
    : publicPath;

  return resolvePublicFilePath(normalizedPath);
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findFileByBaseName(rootDir: string, baseName: string): Promise<string | null> {
  const entries = await readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      const nested = await findFileByBaseName(fullPath, baseName);
      if (nested) {
        return nested;
      }
    } else if (entry.isFile() && entry.name === baseName) {
      return fullPath;
    }
  }

  return null;
}

export async function resolveStoredDrawingFile(publicPath: string) {
  const directPath = resolvePublicFilePath(publicPath);
  if (await fileExists(directPath)) {
    return directPath;
  }

  const uploadsMappedPath = resolvePublicFilePath(publicPath.replace(/^\/drawings\//, "/uploads/drawings/"));
  if (await fileExists(uploadsMappedPath)) {
    return uploadsMappedPath;
  }

  const baseName = path.basename(publicPath);
  const discoveredPath = await findFileByBaseName(uploadRoot, baseName);

  if (discoveredPath) {
    return discoveredPath;
  }

  throw new HttpError(404, "File PDF tidak ditemukan pada storage.");
}

export function ensureWatermarkedPublicPath(publicPath: string) {
  const parts = publicPath.split("/");
  const fileName = parts.pop();

  if (!fileName) {
    throw new HttpError(422, "Path file PDF tidak valid.");
  }

  if (fileName.startsWith("watermarked-")) {
    return publicPath;
  }

  return `${parts.join("/")}/watermarked-${fileName}`;
}

export async function saveDrawingPdfFile(params: {
  drawingId: string;
  revisionNo: string;
  file: File | null;
  createWatermarkedCopy?: boolean;
}) {
  ensurePdf(params.file);

  const buffer = Buffer.from(await params.file.arrayBuffer());
  const paths = buildPaths(params.drawingId, params.revisionNo, params.file.name);

  await mkdir(paths.diskDir, { recursive: true });
  await writeFile(paths.originalDiskPath, buffer);

  if (params.createWatermarkedCopy) {
    await copyFile(paths.originalDiskPath, paths.watermarkedDiskPath);
  }

  return {
    fileName: paths.safeFileName,
    fileOriginalPath: paths.originalPublicPath,
    fileWatermarkedPath: params.createWatermarkedCopy ? paths.watermarkedPublicPath : null
  };
}

export async function removeDrawingRevisionFiles(params: {
  drawingId: string;
  revisionNo: string;
}) {
  const safeRevision = sanitizeSegment(params.revisionNo.toLowerCase()) || "a";
  const revisionDir = path.join(uploadRoot, params.drawingId, `rev-${safeRevision}`);

  await rm(revisionDir, { recursive: true, force: true });
}

export async function removeDrawingFiles(params: {
  drawingId: string;
}) {
  const drawingDir = path.join(uploadRoot, params.drawingId);

  await rm(drawingDir, { recursive: true, force: true });
}

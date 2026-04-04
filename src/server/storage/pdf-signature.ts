import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { degrees, PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  ensureWatermarkedPublicPath,
  resolveManagedDrawingFilePath,
  resolveStoredDrawingFile
} from "@/server/storage/drawing-files";

function formatSignatureDate(value: Date) {
  const pad = (input: number) => String(input).padStart(2, "0");

  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()} ${pad(
    value.getHours()
  )}:${pad(value.getMinutes())} WIB`;
}

function clampText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}

function normalizeRotation(angle: number) {
  const normalized = angle % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function getStampPlacement(params: {
  pageWidth: number;
  pageHeight: number;
  rotation: number;
  level: number;
  stampWidth: number;
  stampHeight: number;
}) {
  const margin = 24;
  const gap = 10;
  const viewportOffsetX = margin + params.level * (params.stampWidth + gap);
  const viewportOffsetY = margin;

  switch (params.rotation) {
    case 90:
      return {
        x: params.pageWidth - viewportOffsetY,
        y: viewportOffsetX,
        rotate: 90
      };
    case 180:
      return {
        x: params.pageWidth - viewportOffsetX,
        y: params.pageHeight - viewportOffsetY,
        rotate: 180
      };
    case 270:
      return {
        x: viewportOffsetY,
        y: params.pageHeight - viewportOffsetX,
        rotate: 270
      };
    default:
      return {
        x: viewportOffsetX,
        y: viewportOffsetY,
        rotate: 0
      };
  }
}

async function buildStampBytes(params: {
  stampWidth: number;
  stampHeight: number;
  signerName: string;
  signerRole: string;
  label: string;
  note?: string;
  actedAt: Date;
}) {
  const stampDoc = await PDFDocument.create();
  const page = stampDoc.addPage([params.stampWidth, params.stampHeight]);
  const boldFont = await stampDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await stampDoc.embedFont(StandardFonts.Helvetica);
  const padding = 8;

  page.drawRectangle({
    x: 0,
    y: 0,
    width: params.stampWidth,
    height: params.stampHeight,
    color: rgb(0.97, 0.98, 1),
    borderColor: rgb(0.23, 0.31, 0.59),
    borderWidth: 0.7,
    opacity: 0.4,
    borderOpacity: 0.4
  });

  page.drawRectangle({
    x: 0,
    y: params.stampHeight - 18,
    width: params.stampWidth,
    height: 18,
    color: rgb(0.23, 0.31, 0.59),
    opacity: 0.4
  });

  page.drawText(params.label, {
    x: padding,
    y: params.stampHeight - 13,
    size: 8,
    font: boldFont,
    color: rgb(1, 1, 1),
    opacity: 0.8
  });

  const lines = [
    `Nama: ${clampText(params.signerName, 18)}`,
    `Role: ${clampText(params.signerRole, 16)}`,
    `Waktu: ${formatSignatureDate(params.actedAt)}`
  ];

  if (params.note?.trim()) {
    lines.push(`Catatan: ${clampText(params.note.trim(), 18)}`);
  }

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: padding,
      y: params.stampHeight - 28 - index * 9,
      size: 7,
      font: regularFont,
      color: rgb(0.13, 0.15, 0.16),
      opacity: 0.8
    });
  });

  return stampDoc.save();
}

export async function stampApprovalPdf(params: {
  sourcePublicPath: string;
  targetPublicPath?: string | null;
  signerName: string;
  signerRole: string;
  label: string;
  note?: string;
  actedAt?: Date;
  level: number;
}) {
  const sourceDiskPath = await resolveStoredDrawingFile(params.sourcePublicPath);
  const targetPublicPath = params.targetPublicPath ?? ensureWatermarkedPublicPath(params.sourcePublicPath);
  const targetDiskPath = resolveManagedDrawingFilePath(targetPublicPath);
  const pdfBytes = await readFile(sourceDiskPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
  const actedAt = params.actedAt ?? new Date();
  const rotation = normalizeRotation(page.getRotation().angle);
  const viewportWidth = rotation === 90 || rotation === 270 ? page.getHeight() : page.getWidth();
  const stampWidth = Math.min(
    168,
    Math.max(128, Math.floor((viewportWidth - 2 * 24 - 2 * 10) / 3))
  );
  const stampHeight = 60;
  const stampBytes = await buildStampBytes({
    stampWidth,
    stampHeight,
    signerName: params.signerName,
    signerRole: params.signerRole,
    label: params.label,
    note: params.note,
    actedAt
  });
  const [embeddedStamp] = await pdfDoc.embedPdf(stampBytes, [0]);
  const placement = getStampPlacement({
    pageWidth: page.getWidth(),
    pageHeight: page.getHeight(),
    rotation,
    level: params.level,
    stampWidth,
    stampHeight
  });

  page.drawPage(embeddedStamp, {
    x: placement.x,
    y: placement.y,
    width: stampWidth,
    height: stampHeight,
    rotate: degrees(placement.rotate)
  });

  await mkdir(path.dirname(targetDiskPath), { recursive: true });
  await writeFile(targetDiskPath, await pdfDoc.save());

  return targetPublicPath;
}

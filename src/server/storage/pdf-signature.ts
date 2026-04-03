import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ensureWatermarkedPublicPath, resolvePublicFilePath } from "@/server/storage/drawing-files";

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
  const sourceDiskPath = resolvePublicFilePath(params.sourcePublicPath);
  const targetPublicPath = params.targetPublicPath ?? ensureWatermarkedPublicPath(params.sourcePublicPath);
  const targetDiskPath = resolvePublicFilePath(targetPublicPath);
  const pdfBytes = await readFile(sourceDiskPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const page = pdfDoc.getPages()[0];
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const actedAt = params.actedAt ?? new Date();

  const stampWidth = Math.min(168, page.getWidth() - 40);
  const stampHeight = 60;
  const padding = 8;
  const margin = 24;
  const stackOffset = params.level * (stampHeight + 8);
  const x = page.getWidth() - stampWidth - margin;
  const y = Math.max(margin, page.getHeight() - stampHeight - margin - stackOffset);

  page.drawRectangle({
    x,
    y,
    width: stampWidth,
    height: stampHeight,
    color: rgb(0.97, 0.98, 1),
    borderColor: rgb(0.23, 0.31, 0.59),
    borderWidth: 0.7,
    opacity: 0.4,
    borderOpacity: 0.4
  });

  page.drawRectangle({
    x,
    y: y + stampHeight - 18,
    width: stampWidth,
    height: 18,
    color: rgb(0.23, 0.31, 0.59),
    opacity: 0.4
  });

  page.drawText(params.label, {
    x: x + padding,
    y: y + stampHeight - 13,
    size: 8,
    font: boldFont,
    color: rgb(1, 1, 1),
    opacity: 0.8
  });

  const lines = [
    `Nama: ${clampText(params.signerName, 18)}`,
    `Role: ${clampText(params.signerRole, 16)}`,
    `Waktu: ${formatSignatureDate(actedAt)}`
  ];

  if (params.note?.trim()) {
    lines.push(`Catatan: ${clampText(params.note.trim(), 18)}`);
  }

  lines.forEach((line, index) => {
    page.drawText(line, {
      x: x + padding,
      y: y + stampHeight - 28 - index * 9,
      size: 7,
      font: regularFont,
      color: rgb(0.13, 0.15, 0.16),
      opacity: 0.8
    });
  });

  await mkdir(path.dirname(targetDiskPath), { recursive: true });
  await writeFile(targetDiskPath, await pdfDoc.save());

  return targetPublicPath;
}

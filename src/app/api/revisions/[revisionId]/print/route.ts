import { readFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { apiError } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { resolveStoredDrawingFile } from "@/server/storage/drawing-files";
import { authorizeRevisionDownload, getRevisionDetail } from "@/server/services/revision.service";

export const runtime = "nodejs";

function toSafeFileName(fileName: string) {
  const normalized = fileName.trim().replace(/[^a-zA-Z0-9._-]+/g, "-");
  return normalized || "drawing.pdf";
}

async function buildPlaceholderPdf(params: {
  drawingNumber: string;
  drawingName: string;
  revisionNo: string;
  fileName: string;
}) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]);
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const textFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({
    x: 28,
    y: 28,
    width: page.getWidth() - 56,
    height: page.getHeight() - 56,
    borderColor: rgb(0.82, 0.84, 0.87),
    borderWidth: 1
  });

  page.drawText(params.drawingNumber, {
    x: 48,
    y: page.getHeight() - 78,
    size: 20,
    font: titleFont,
    color: rgb(0.13, 0.15, 0.16)
  });

  page.drawText(params.drawingName, {
    x: 48,
    y: page.getHeight() - 110,
    size: 14,
    font: textFont,
    color: rgb(0.25, 0.27, 0.31)
  });

  page.drawText(`Revision: ${params.revisionNo}`, {
    x: 48,
    y: page.getHeight() - 150,
    size: 11,
    font: textFont,
    color: rgb(0.23, 0.31, 0.59)
  });

  page.drawText(`File: ${params.fileName}`, {
    x: 48,
    y: page.getHeight() - 172,
    size: 11,
    font: textFont,
    color: rgb(0.25, 0.27, 0.31)
  });

  page.drawText("Dokumen final asli belum tersedia pada storage. Sistem menampilkan placeholder print.", {
    x: 48,
    y: page.getHeight() - 230,
    size: 12,
    font: textFont,
    color: rgb(0.35, 0.37, 0.4)
  });

  return Buffer.from(await pdfDoc.save());
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const session = await requireSession(request);
    const { revisionId } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<
      typeof authorizeRevisionDownload
    >[2];

    await authorizeRevisionDownload(revisionId, session.user.id, role);

    const detailRole = (session.user.role ?? "CONSUMER") as Parameters<typeof getRevisionDetail>[1];
    const { drawing, revision } = await getRevisionDetail(revisionId, detailRole, session.user.id);
    const publicPath = revision.fileWatermarkedPath ?? revision.fileOriginalPath;
    const fileName = toSafeFileName(revision.fileName);
    let fileBuffer: Buffer;

    if (publicPath.startsWith("/mock/")) {
      fileBuffer = await buildPlaceholderPdf({
        drawingNumber: drawing.drawingNumber,
        drawingName: drawing.drawingName,
        revisionNo: revision.revisionNo,
        fileName: revision.fileName
      });
    } else {
      const diskPath = await resolveStoredDrawingFile(publicPath);
      fileBuffer = await readFile(diskPath);
    }

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
        "Content-Length": String(fileBuffer.byteLength),
        "Accept-Ranges": "bytes",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    return apiError(error);
  }
}

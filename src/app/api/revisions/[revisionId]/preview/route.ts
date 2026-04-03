import { readFile } from "node:fs/promises";
import { degrees, PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { apiError } from "@/lib/server/api";
import { requireSession } from "@/lib/server/auth";
import { resolveStoredDrawingFile } from "@/server/storage/drawing-files";
import { getRevisionDetail } from "@/server/services/revision.service";

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

  page.drawText("Dokumen PDF asli belum tersedia pada storage. Sistem menampilkan placeholder preview.", {
    x: 48,
    y: page.getHeight() - 230,
    size: 12,
    font: textFont,
    color: rgb(0.35, 0.37, 0.4)
  });

  page.drawText("PLACEHOLDER PREVIEW", {
    x: 175,
    y: 165,
    size: 46,
    font: titleFont,
    color: rgb(0.23, 0.31, 0.59),
    rotate: degrees(-28),
    opacity: 0.1
  });

  return Buffer.from(await pdfDoc.save());
}

async function normalizePdfForPreview(buffer: Buffer) {
  try {
    const sourceDoc = await PDFDocument.load(buffer);
    const previewDoc = await PDFDocument.create();
    const pageIndexes = sourceDoc.getPageIndices();
    const copiedPages = await previewDoc.copyPages(sourceDoc, pageIndexes);

    copiedPages.forEach((page) => {
      previewDoc.addPage(page);
    });

    const normalized = await previewDoc.save({
      useObjectStreams: false
    });

    return Buffer.from(normalized);
  } catch {
    return buffer;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ revisionId: string }> }
) {
  try {
    const session = await requireSession(request);
    const { revisionId } = await params;
    const role = (session.user.role ?? "CONSUMER") as Parameters<typeof getRevisionDetail>[1];
    const { drawing, revision } = await getRevisionDetail(revisionId, role, session.user.id);
    const publicPath = revision.fileWatermarkedPath ?? revision.fileOriginalPath;
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
      fileBuffer = await normalizePdfForPreview(await readFile(diskPath));
    }
    const fileName = toSafeFileName(revision.fileName);
    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
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

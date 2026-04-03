import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api";
import { AppRole } from "@/lib/server/auth";
import { createAuditLog } from "@/server/services/audit.service";

const editableStatuses: ReadonlySet<string> = new Set([
  "DRAFT",
  "CHECK_REJECTED",
  "APPROVAL_1_REJECTED",
  "APPROVAL_2_REJECTED"
] as const);

export async function getRevisionDetail(revisionId: string, role: AppRole, userId: string) {
  const revision = await db.query.drawingRevisions.findFirst({
    where: eq(schema.drawingRevisions.id, revisionId)
  });

  if (!revision) {
    throw new HttpError(404, "Revisi tidak ditemukan.");
  }

  const drawing = await db.query.drawings.findFirst({
    where: eq(schema.drawings.id, revision.drawingId)
  });

  if (!drawing) {
    throw new HttpError(404, "Drawing tidak ditemukan.");
  }

  if (role === "DRAFTER" && drawing.createdBy !== userId) {
    throw new HttpError(403, "Anda tidak memiliki akses ke revisi ini.");
  }

  if (role === "CONSUMER" && revision.status !== "COMPLETED") {
    throw new HttpError(403, "Revisi belum tersedia untuk role ini.");
  }

  const approvals = await db
    .select()
    .from(schema.approvalActions)
    .where(eq(schema.approvalActions.revisionId, revision.id))
    .orderBy(desc(schema.approvalActions.actedAt));

  return { drawing, revision, approvals };
}

export async function submitRevision(revisionId: string, userId: string, role: AppRole) {
  return db.transaction(async (tx) => {
    const revision = await tx.query.drawingRevisions.findFirst({
      where: eq(schema.drawingRevisions.id, revisionId)
    });

    if (!revision) {
      throw new HttpError(404, "Revisi tidak ditemukan.");
    }

    const drawing = await tx.query.drawings.findFirst({
      where: eq(schema.drawings.id, revision.drawingId)
    });

    if (!drawing) {
      throw new HttpError(404, "Drawing tidak ditemukan.");
    }

    if (role !== "ADMIN" && drawing.createdBy !== userId) {
      throw new HttpError(403, "Anda tidak memiliki akses untuk submit revisi ini.");
    }

    if (!editableStatuses.has(revision.status)) {
      throw new HttpError(409, "Status revisi saat ini tidak dapat disubmit.");
    }

    await tx
      .update(schema.drawingRevisions)
      .set({
        status: "WAITING_CHECK",
        submittedBy: userId,
        submittedAt: new Date(),
        updatedAt: new Date(),
        fileWatermarkedPath: revision.fileWatermarkedPath ?? revision.fileOriginalPath
      })
      .where(eq(schema.drawingRevisions.id, revision.id));

    await tx
      .update(schema.drawings)
      .set({
        currentStatus: "WAITING_CHECK",
        updatedAt: new Date()
      })
      .where(eq(schema.drawings.id, drawing.id));

    await createAuditLog(
      {
        entityType: "REVISION",
        entityId: revision.id,
        action: "SUBMITTED_FOR_CHECK",
        userId,
        note: "Revisi dikirim untuk proses check."
      },
      tx
    );

    return { drawingId: drawing.id, revisionId: revision.id };
  });
}

export async function authorizeRevisionDownload(revisionId: string, userId: string, role: AppRole) {
  return db.transaction(async (tx) => {
    const revision = await tx.query.drawingRevisions.findFirst({
      where: eq(schema.drawingRevisions.id, revisionId)
    });

    if (!revision) {
      throw new HttpError(404, "Revisi tidak ditemukan.");
    }

    const drawing = await tx.query.drawings.findFirst({
      where: eq(schema.drawings.id, revision.drawingId)
    });

    if (!drawing) {
      throw new HttpError(404, "Drawing tidak ditemukan.");
    }

    if (revision.status !== "COMPLETED") {
      throw new HttpError(403, "Hanya drawing completed yang dapat diunduh.");
    }

    if (role === "CONSUMER" && revision.status !== "COMPLETED") {
      throw new HttpError(403, "Akses unduh tidak diizinkan.");
    }

    await tx.insert(schema.downloadLogs).values({
      id: crypto.randomUUID(),
      revisionId: revision.id,
      userId,
      source: "APP"
    });

    await createAuditLog(
      {
        entityType: "REVISION",
        entityId: revision.id,
        action: "DRAWING_DOWNLOADED",
        userId,
        note: "Dokumen final diunduh."
      },
      tx
    );

    return {
      drawingId: drawing.id,
      revisionId: revision.id,
      fileName: revision.fileName,
      filePath: revision.fileWatermarkedPath ?? revision.fileOriginalPath
    };
  });
}

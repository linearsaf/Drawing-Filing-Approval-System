import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api";
import { AppRole } from "@/lib/server/auth";
import {
  buildApprovalPlanMap,
  canUserApproveAssignedStep,
  getActiveApprovalLevel,
  listApprovalStepsByRevisionIds
} from "@/server/services/approval-plan.service";
import { createAuditLog } from "@/server/services/audit.service";

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

  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username
    })
    .from(schema.user)
    .where(inArray(schema.user.id, [drawing.createdBy, drawing.drawnByUserId]));
  const userById = new Map(users.map((user) => [user.id, user]));

  const approvals = await db
    .select()
    .from(schema.approvalActions)
    .where(eq(schema.approvalActions.revisionId, revision.id))
    .orderBy(desc(schema.approvalActions.actedAt));

  const approvalSteps = await listApprovalStepsByRevisionIds([revision.id]);
  const approvalPlan = buildApprovalPlanMap([revision], approvalSteps, approvals).get(revision.id) ?? [];
  const activeApprovalLevel = getActiveApprovalLevel(revision.status);
  const canCurrentUserApprove = canUserApproveAssignedStep({
    role,
    userId,
    revisionStatus: revision.status,
    approvalPlan
  });

  return {
    drawing: {
      ...drawing,
      drawnByName: userById.get(drawing.drawnByUserId)?.name ?? null,
      drawnByUsername: userById.get(drawing.drawnByUserId)?.username ?? null,
      uploadedByName: userById.get(drawing.createdBy)?.name ?? null,
      uploadedByUsername: userById.get(drawing.createdBy)?.username ?? null
    },
    revision,
    approvals,
    approvalPlan,
    activeApprovalLevel,
    canCurrentUserApprove
  };
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

    if (!["DRAFT", "CHECK_REJECTED", "APPROVAL_1_REJECTED", "APPROVAL_2_REJECTED"].includes(revision.status)) {
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
        note: "Final drawing diunduh."
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

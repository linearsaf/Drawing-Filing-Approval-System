import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { approvalDecisionValues, schema } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api";
import { AppRole } from "@/lib/server/auth";
import { createAuditLog } from "@/server/services/audit.service";
import { stampApprovalPdf } from "@/server/storage/pdf-signature";

type ApprovalDecision = (typeof approvalDecisionValues)[number];

function getTransition(status: string, decision: ApprovalDecision) {
  if (status === "WAITING_CHECK") {
    return {
      level: 0,
      approved: "WAITING_APPROVAL_1",
      rejected: "CHECK_REJECTED"
    } as const;
  }

  if (status === "WAITING_APPROVAL_1") {
    return {
      level: 1,
      approved: "WAITING_APPROVAL_2",
      rejected: "APPROVAL_1_REJECTED"
    } as const;
  }

  if (status === "WAITING_APPROVAL_2") {
    return {
      level: 2,
      approved: "COMPLETED",
      rejected: "APPROVAL_2_REJECTED"
    } as const;
  }

  throw new HttpError(409, "Status revisi tidak dapat diproses.");
}

function assertRoleForLevel(role: AppRole, level: number) {
  if (level === 0 && !["DRAFT_LEADER", "ADMIN"].includes(role)) {
    throw new HttpError(403, "Akses check tidak diizinkan.");
  }

  if (level === 1 && !["APPROVER_L1", "ADMIN"].includes(role)) {
    throw new HttpError(403, "Akses approval level 1 tidak diizinkan.");
  }

  if (level === 2 && !["HEAD", "ADMIN"].includes(role)) {
    throw new HttpError(403, "Akses final approval tidak diizinkan.");
  }
}

export async function decideApproval(params: {
  revisionId: string;
  userId: string;
  role: AppRole;
  actorName: string;
  decision: ApprovalDecision;
  note?: string;
  signPdf?: boolean;
  expectedStatus: "WAITING_CHECK" | "WAITING_APPROVAL_1" | "WAITING_APPROVAL_2";
}) {
  return db.transaction(async (tx) => {
    const revision = await tx.query.drawingRevisions.findFirst({
      where: eq(schema.drawingRevisions.id, params.revisionId)
    });

    if (!revision) {
      throw new HttpError(404, "Revisi tidak ditemukan.");
    }

    if (revision.status !== params.expectedStatus) {
      throw new HttpError(409, "Revisi tidak berada pada tahap approval yang sesuai.");
    }

    const drawing = await tx.query.drawings.findFirst({
      where: eq(schema.drawings.id, revision.drawingId)
    });

    if (!drawing) {
      throw new HttpError(404, "Drawing tidak ditemukan.");
    }

    if (params.decision === "REJECTED" && !params.note?.trim()) {
      throw new HttpError(422, "Catatan reject wajib diisi.");
    }

    const transition = getTransition(revision.status, params.decision);
    assertRoleForLevel(params.role, transition.level);

    const nextStatus = params.decision === "APPROVED" ? transition.approved : transition.rejected;
    const nextWatermarkedPath =
      params.decision === "APPROVED" && params.signPdf !== false
        ? await stampApprovalPdf({
            sourcePublicPath: revision.fileWatermarkedPath ?? revision.fileOriginalPath,
            targetPublicPath: revision.fileWatermarkedPath,
            signerName: params.actorName,
            signerRole: params.role,
            label:
              transition.level === 0
                ? "CHECK APPROVED"
                : transition.level === 1
                  ? "APPROVAL LEVEL 1"
                  : "FINAL APPROVAL",
            note: params.note,
            actedAt: new Date(),
            level: transition.level
          })
        : revision.fileWatermarkedPath ?? revision.fileOriginalPath;

    await tx
      .update(schema.drawingRevisions)
      .set({
        status: nextStatus,
        isCompleted: nextStatus === "COMPLETED",
        fileWatermarkedPath: nextWatermarkedPath,
        updatedAt: new Date()
      })
      .where(eq(schema.drawingRevisions.id, revision.id));

    await tx
      .update(schema.drawings)
      .set({
        currentStatus: nextStatus,
        latestCompletedRevisionId: nextStatus === "COMPLETED" ? revision.id : drawing.latestCompletedRevisionId,
        updatedAt: new Date()
      })
      .where(eq(schema.drawings.id, drawing.id));

    if (nextStatus === "COMPLETED") {
      await tx
        .update(schema.drawingRevisions)
        .set({
          status: "OBSOLETE",
          isCompleted: false,
          updatedAt: new Date()
        })
        .where(eq(schema.drawingRevisions.id, drawing.latestCompletedRevisionId ?? "__none__"));
    }

    await tx.insert(schema.approvalActions).values({
      id: crypto.randomUUID(),
      revisionId: revision.id,
      approvalLevel: transition.level,
      actorId: params.userId,
      actorRole: params.role,
      decision: params.decision,
      decisionNote: params.note ?? "",
      actedAt: new Date()
    });

    await createAuditLog(
      {
        entityType: "REVISION",
        entityId: revision.id,
        action: nextStatus,
        userId: params.userId,
        note:
          params.decision === "APPROVED"
            ? `Revisi disetujui pada level ${transition.level}.`
            : `Revisi ditolak pada level ${transition.level}.`
      },
      tx
    );

    return { drawingId: drawing.id, revisionId: revision.id, status: nextStatus };
  });
}

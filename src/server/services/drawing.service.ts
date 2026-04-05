import { and, asc, desc, eq, inArray, like, ne, or } from "drizzle-orm";
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
import { removeDrawingFiles } from "@/server/storage/drawing-files";

interface DrawingMutationInput {
  drawingId?: string;
  revisionId?: string;
  drawingNumber: string;
  drawingName: string;
  sacCode: string;
  area: string;
  discipline: string;
  description?: string;
  revisionNo: string;
  fileName: string;
  fileOriginalPath?: string;
  fileWatermarkedPath?: string | null;
  changeNote?: string;
  submit?: boolean;
}

interface LegacyDrawingInput {
  drawingId?: string;
  revisionId?: string;
  drawingNumber: string;
  drawingName: string;
  sacCode: string;
  area: string;
  discipline: string;
  description?: string;
  revisionNo: string;
  drawnByUserId: string;
  legacyReadyNote: string;
  fileName: string;
  fileOriginalPath?: string;
}

type DrawingRecord = typeof schema.drawings.$inferSelect;
type RevisionRecord = typeof schema.drawingRevisions.$inferSelect;
type UserRecord = Pick<typeof schema.user.$inferSelect, "id" | "name" | "username" | "role" | "isActive">;

function buildFilePaths(drawingId: string, revisionNo: string, fileName: string) {
  const normalizedRevision = revisionNo.toLowerCase().replace(/\s+/g, "-");
  const safeFileName = fileName.replace(/\s+/g, "-");

  return {
    original: `/drawings/${drawingId}/rev-${normalizedRevision}/${safeFileName}`,
    watermarked: `/drawings/${drawingId}/rev-${normalizedRevision}/watermarked-${safeFileName}`
  };
}

function nextRevisionStatus(submit?: boolean) {
  return submit ? "WAITING_CHECK" : "DRAFT";
}

const editableStatuses: ReadonlySet<string> = new Set([
  "DRAFT",
  "CHECK_REJECTED",
  "APPROVAL_1_REJECTED",
  "APPROVAL_2_REJECTED"
] as const);

function assertViewerCanSee(role: AppRole, currentStatus: string, createdBy: string, userId: string) {
  if (role === "CONSUMER" && currentStatus !== "COMPLETED") {
    throw new HttpError(403, "Drawing belum tersedia untuk role ini.");
  }

  if (role === "DRAFTER" && createdBy !== userId) {
    throw new HttpError(403, "Anda hanya dapat melihat drawing milik sendiri.");
  }
}

async function ensureDrawingNumberAvailable(
  drawingNumber: string,
  tx: {
    query: typeof db.query;
  },
  excludeDrawingId?: string
) {
  const existing = await tx.query.drawings.findFirst({
    where: excludeDrawingId
      ? and(
          eq(schema.drawings.drawingNumber, drawingNumber),
          ne(schema.drawings.id, excludeDrawingId)
        )
      : eq(schema.drawings.drawingNumber, drawingNumber)
  });

  if (existing) {
    throw new HttpError(409, "Drawing number sudah digunakan. Gunakan nomor drawing yang berbeda.");
  }
}

async function listUsersByIds(userIds: string[]) {
  if (userIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      username: schema.user.username,
      role: schema.user.role,
      isActive: schema.user.isActive
    })
    .from(schema.user)
    .where(inArray(schema.user.id, userIds));
}

function enrichDrawing(
  drawing: DrawingRecord,
  userById: Map<string, UserRecord>
) {
  const creator = userById.get(drawing.createdBy) ?? null;
  const drawnBy = userById.get(drawing.drawnByUserId) ?? null;

  return {
    ...drawing,
    drawnByUserId: drawing.drawnByUserId,
    drawnByName: drawnBy?.name ?? null,
    drawnByUsername: drawnBy?.username ?? null,
    uploadedByName: creator?.name ?? null,
    uploadedByUsername: creator?.username ?? null
  };
}

async function assertValidLegacyDrawnByUser(params: {
  drawnByUserId: string;
  actorUserId: string;
  actorRole: AppRole;
}) {
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, params.drawnByUserId)
  });

  if (!user || !user.isActive) {
    throw new HttpError(422, "Drawn by harus user aktif.");
  }

  if (user.role === "DRAFTER") {
    return user;
  }

  const actorCanUseSelf =
    (params.actorRole === "DRAFT_LEADER" || params.actorRole === "ADMIN") &&
    user.id === params.actorUserId;

  if (!actorCanUseSelf) {
    throw new HttpError(422, "Drawn by harus user aktif role Drafter atau uploader sendiri.");
  }

  return user;
}

export async function listDrawings(params: {
  role: AppRole;
  userId: string;
  search?: string;
  status?: string;
  area?: string;
  drawnBy?: string;
  revision?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}) {
  const rows = await db
    .select({
      id: schema.drawings.id,
      drawingNumber: schema.drawings.drawingNumber,
      drawingName: schema.drawings.drawingName,
      sacCode: schema.drawings.sacCode,
      area: schema.drawings.area,
      discipline: schema.drawings.discipline,
      description: schema.drawings.description,
      createdBy: schema.drawings.createdBy,
      drawnByUserId: schema.drawings.drawnByUserId,
      workflowSource: schema.drawings.workflowSource,
      legacyReadyNote: schema.drawings.legacyReadyNote,
      currentRevisionId: schema.drawings.currentRevisionId,
      currentStatus: schema.drawings.currentStatus,
      latestCompletedRevisionId: schema.drawings.latestCompletedRevisionId,
      createdAt: schema.drawings.createdAt,
      updatedAt: schema.drawings.updatedAt
    })
    .from(schema.drawings)
    .where(
      and(
        params.role === "DRAFTER" ? eq(schema.drawings.createdBy, params.userId) : undefined,
        params.role === "CONSUMER" ? eq(schema.drawings.currentStatus, "COMPLETED") : undefined,
        params.status && params.status !== "ALL"
          ? eq(schema.drawings.currentStatus, params.status as typeof schema.drawings.currentStatus._.data)
          : undefined,
        params.area ? like(schema.drawings.area, `%${params.area}%`) : undefined,
        params.drawnBy ? eq(schema.drawings.drawnByUserId, params.drawnBy) : undefined,
        params.search
          ? or(
              like(schema.drawings.drawingNumber, `%${params.search}%`),
              like(schema.drawings.drawingName, `%${params.search}%`),
              like(schema.drawings.sacCode, `%${params.search}%`),
              like(schema.drawings.area, `%${params.search}%`)
            )
          : undefined
      )
    )
    .orderBy(desc(schema.drawings.updatedAt));

  const userIds = [
    ...new Set(rows.flatMap((row) => [row.createdBy, row.drawnByUserId]))
  ];
  const users = await listUsersByIds(userIds);
  const userById = new Map(users.map((user) => [user.id, user]));

  const revisions = rows.length
    ? await db
        .select()
        .from(schema.drawingRevisions)
        .where(
          inArray(
            schema.drawingRevisions.id,
            rows.map((row) => row.currentRevisionId).filter(Boolean) as string[]
          )
        )
    : [];
  const revisionById = new Map(revisions.map((revision) => [revision.id, revision]));
  const approvalSteps = await listApprovalStepsByRevisionIds(revisions.map((revision) => revision.id));
  const approvalActions = revisions.length
    ? await db
        .select()
        .from(schema.approvalActions)
        .where(inArray(schema.approvalActions.revisionId, revisions.map((revision) => revision.id)))
        .orderBy(desc(schema.approvalActions.actedAt))
    : [];
  const approvalPlanByRevision = buildApprovalPlanMap(revisions, approvalSteps, approvalActions);

  const filteredItems = rows
    .filter((drawing) => {
      const revision = drawing.currentRevisionId
        ? revisionById.get(drawing.currentRevisionId)
        : undefined;
      const revisionMatches =
        !params.revision ||
        (revision?.revisionNo ?? "").toLowerCase().includes(params.revision.toLowerCase());

      const comparableDate = (revision?.submittedAt ?? drawing.updatedAt).toISOString().slice(0, 10);
      const fromMatches = !params.dateFrom || comparableDate >= params.dateFrom;
      const toMatches = !params.dateTo || comparableDate <= params.dateTo;

      return revisionMatches && fromMatches && toMatches;
    })
    .map((drawing) => {
      const revision = drawing.currentRevisionId
        ? revisionById.get(drawing.currentRevisionId) ?? null
        : null;

      return {
        ...enrichDrawing(drawing, userById),
        activeApprovalLevel: revision ? getActiveApprovalLevel(revision.status) : null,
        canCurrentUserApprove: revision
          ? canUserApproveAssignedStep({
              role: params.role,
              userId: params.userId,
              revisionStatus: revision.status,
              approvalPlan: approvalPlanByRevision.get(revision.id) ?? []
            })
          : false,
        currentRevision: revision
          ? {
              id: revision.id,
              revisionNo: revision.revisionNo,
              status: revision.status,
              fileName: revision.fileName,
              submittedAt: revision.submittedAt,
              updatedAt: revision.updatedAt
            }
          : null
      };
    });

  const total = filteredItems.length;
  const pageSize = Math.max(1, params.pageSize ?? 12);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), totalPages);
  const startIndex = (page - 1) * pageSize;
  const items = filteredItems.slice(startIndex, startIndex + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    summary: {
      total,
      drafts: filteredItems.filter((item) => item.currentStatus === "DRAFT").length,
      waiting: filteredItems.filter((item) =>
        ["WAITING_CHECK", "WAITING_APPROVAL_1", "WAITING_APPROVAL_2"].includes(item.currentStatus)
      ).length,
      completed: filteredItems.filter((item) => item.currentStatus === "COMPLETED").length
    }
  };
}

export async function getDrawingDetail(drawingId: string, role: AppRole, userId: string) {
  const drawing = await db.query.drawings.findFirst({
    where: eq(schema.drawings.id, drawingId)
  });

  if (!drawing) {
    throw new HttpError(404, "Drawing tidak ditemukan.");
  }

  assertViewerCanSee(role, drawing.currentStatus, drawing.createdBy, userId);

  const users = await listUsersByIds([drawing.createdBy, drawing.drawnByUserId]);
  const userById = new Map(users.map((user) => [user.id, user]));

  const revisions = await db
    .select()
    .from(schema.drawingRevisions)
    .where(eq(schema.drawingRevisions.drawingId, drawing.id))
    .orderBy(desc(schema.drawingRevisions.createdAt));

  const approvalHistory = revisions.length
    ? await db
        .select()
        .from(schema.approvalActions)
        .where(
          inArray(
            schema.approvalActions.revisionId,
            revisions.map((revision) => revision.id)
          )
        )
        .orderBy(desc(schema.approvalActions.actedAt))
    : [];
  const approvalSteps = await listApprovalStepsByRevisionIds(revisions.map((revision) => revision.id));
  const approvalPlanByRevision = buildApprovalPlanMap(revisions, approvalSteps, approvalHistory);
  const currentRevision = revisions.find((revision) => revision.id === drawing.currentRevisionId) ?? null;
  const approvalPlan = currentRevision ? approvalPlanByRevision.get(currentRevision.id) ?? [] : [];
  const activeApprovalLevel = currentRevision ? getActiveApprovalLevel(currentRevision.status) : null;
  const canCurrentUserApprove = currentRevision
    ? canUserApproveAssignedStep({
        role,
        userId,
        revisionStatus: currentRevision.status,
        approvalPlan
      })
    : false;

  const auditLogs = await db
    .select()
    .from(schema.auditLogs)
    .where(
      or(
        and(eq(schema.auditLogs.entityType, "DRAWING"), eq(schema.auditLogs.entityId, drawing.id)),
        revisions.length
          ? and(
              eq(schema.auditLogs.entityType, "REVISION"),
              inArray(
                schema.auditLogs.entityId,
                revisions.map((revision) => revision.id)
              )
            )
          : undefined
      )
    )
    .orderBy(desc(schema.auditLogs.createdAt));

  return {
    drawing: enrichDrawing(drawing, userById),
    currentRevision,
    revisions,
    approvalHistory,
    approvalPlan,
    activeApprovalLevel,
    canCurrentUserApprove,
    auditLogs
  };
}

export async function createDrawing(input: DrawingMutationInput, userId: string) {
  return db.transaction(async (tx) => {
    const drawingId = input.drawingId ?? crypto.randomUUID();
    const revisionId = input.revisionId ?? crypto.randomUUID();
    const status = nextRevisionStatus(input.submit);
    const paths = buildFilePaths(drawingId, input.revisionNo, input.fileName);

    await ensureDrawingNumberAvailable(input.drawingNumber, tx);

    await tx.insert(schema.drawings).values({
      id: drawingId,
      drawingNumber: input.drawingNumber,
      drawingName: input.drawingName,
      sacCode: input.sacCode,
      area: input.area,
      discipline: input.discipline,
      description: input.description ?? "",
      createdBy: userId,
      drawnByUserId: userId,
      workflowSource: "STANDARD",
      legacyReadyNote: null,
      currentRevisionId: revisionId,
      currentStatus: status
    });

    await tx.insert(schema.drawingRevisions).values({
      id: revisionId,
      drawingId,
      revisionNo: input.revisionNo,
      fileName: input.fileName,
      fileOriginalPath: input.fileOriginalPath ?? paths.original,
      fileWatermarkedPath:
        input.fileWatermarkedPath ?? (input.submit ? paths.watermarked : null),
      status,
      changeNote: input.changeNote ?? "",
      submittedBy: input.submit ? userId : null,
      submittedAt: input.submit ? new Date() : null,
      isLatest: true,
      isCompleted: false
    });

    await createAuditLog(
      {
        entityType: "DRAWING",
        entityId: drawingId,
        action: input.submit ? "DRAWING_CREATED_AND_SUBMITTED" : "DRAWING_CREATED",
        userId,
        note: input.submit
          ? "Drawing baru dibuat dan langsung dikirim untuk check."
          : "Drawing baru dibuat."
      },
      tx
    );

    return { drawingId, revisionId };
  });
}

export async function createLegacyDrawing(
  input: LegacyDrawingInput,
  userId: string,
  role: AppRole
) {
  if (!["DRAFT_LEADER", "ADMIN"].includes(role)) {
    throw new HttpError(403, "Akses upload old drawing tidak diizinkan.");
  }

  await assertValidLegacyDrawnByUser({
    drawnByUserId: input.drawnByUserId,
    actorUserId: userId,
    actorRole: role
  });

  return db.transaction(async (tx) => {
    const drawingId = input.drawingId ?? crypto.randomUUID();
    const revisionId = input.revisionId ?? crypto.randomUUID();
    const paths = buildFilePaths(drawingId, input.revisionNo, input.fileName);

    await ensureDrawingNumberAvailable(input.drawingNumber, tx);

    await tx.insert(schema.drawings).values({
      id: drawingId,
      drawingNumber: input.drawingNumber,
      drawingName: input.drawingName,
      sacCode: input.sacCode,
      area: input.area,
      discipline: input.discipline,
      description: input.description ?? "",
      createdBy: userId,
      drawnByUserId: input.drawnByUserId,
      workflowSource: "LEGACY_READY",
      legacyReadyNote: input.legacyReadyNote,
      currentRevisionId: revisionId,
      currentStatus: "COMPLETED",
      latestCompletedRevisionId: revisionId
    });

    await tx.insert(schema.drawingRevisions).values({
      id: revisionId,
      drawingId,
      revisionNo: input.revisionNo,
      fileName: input.fileName,
      fileOriginalPath: input.fileOriginalPath ?? paths.original,
      fileWatermarkedPath: null,
      status: "COMPLETED",
      changeNote: "Imported legacy ready drawing.",
      submittedBy: null,
      submittedAt: null,
      isLatest: true,
      isCompleted: true
    });

    await createAuditLog(
      {
        entityType: "DRAWING",
        entityId: drawingId,
        action: "LEGACY_DRAWING_IMPORTED",
        userId,
        note: "Old drawing diunggah sebagai completed karena approval historis dilakukan di luar sistem.",
        metadata: {
          revisionId,
          revisionNo: input.revisionNo,
          workflowSource: "LEGACY_READY"
        }
      },
      tx
    );

    return { drawingId, revisionId };
  });
}

export async function updateDrawing(
  drawingId: string,
  input: Partial<DrawingMutationInput>,
  userId: string,
  role: AppRole
) {
  return db.transaction(async (tx) => {
    const drawing = await tx.query.drawings.findFirst({
      where: eq(schema.drawings.id, drawingId)
    });

    if (!drawing) {
      throw new HttpError(404, "Drawing tidak ditemukan.");
    }

    if (role !== "ADMIN" && drawing.createdBy !== userId) {
      throw new HttpError(403, "Anda tidak dapat mengubah drawing ini.");
    }

    if (!drawing.currentRevisionId) {
      throw new HttpError(409, "Drawing belum memiliki revisi aktif.");
    }

    const revision = await tx.query.drawingRevisions.findFirst({
      where: eq(schema.drawingRevisions.id, drawing.currentRevisionId)
    });

    if (!revision) {
      throw new HttpError(404, "Revisi aktif tidak ditemukan.");
    }

    if (!editableStatuses.has(revision.status)) {
      throw new HttpError(409, "Drawing pada status ini tidak dapat diedit.");
    }

    const revisionNo = input.revisionNo ?? revision.revisionNo;
    const fileName = input.fileName ?? revision.fileName;
    const nextStatus = input.submit ? "WAITING_CHECK" : revision.status;

    await ensureDrawingNumberAvailable(
      input.drawingNumber ?? drawing.drawingNumber,
      tx,
      drawing.id
    );

    await tx
      .update(schema.drawings)
      .set({
        drawingNumber: input.drawingNumber ?? drawing.drawingNumber,
        drawingName: input.drawingName ?? drawing.drawingName,
        sacCode: input.sacCode ?? drawing.sacCode,
        area: input.area ?? drawing.area,
        discipline: input.discipline ?? drawing.discipline,
        description: input.description ?? drawing.description,
        currentStatus: nextStatus,
        updatedAt: new Date()
      })
      .where(eq(schema.drawings.id, drawing.id));

    await tx
      .update(schema.drawingRevisions)
      .set({
        revisionNo,
        fileName,
        fileOriginalPath: input.fileOriginalPath ?? revision.fileOriginalPath,
        fileWatermarkedPath:
          input.fileWatermarkedPath ??
          (input.submit
            ? revision.fileWatermarkedPath ?? revision.fileOriginalPath
            : revision.fileWatermarkedPath),
        changeNote: input.changeNote ?? revision.changeNote,
        status: nextStatus,
        submittedBy: input.submit ? userId : revision.submittedBy,
        submittedAt: input.submit ? new Date() : revision.submittedAt,
        updatedAt: new Date()
      })
      .where(eq(schema.drawingRevisions.id, revision.id));

    await createAuditLog(
      {
        entityType: "DRAWING",
        entityId: drawing.id,
        action: input.submit ? "DRAWING_UPDATED_AND_SUBMITTED" : "DRAWING_UPDATED",
        userId,
        note: input.submit
          ? "Drawing diperbarui dan dikirim untuk check."
          : "Metadata drawing diperbarui."
      },
      tx
    );

    return { drawingId: drawing.id, revisionId: revision.id };
  });
}

export async function createRevisionFromCompleted(drawingId: string, userId: string, role: AppRole) {
  return db.transaction(async (tx) => {
    const drawing = await tx.query.drawings.findFirst({
      where: eq(schema.drawings.id, drawingId)
    });

    if (!drawing) {
      throw new HttpError(404, "Drawing tidak ditemukan.");
    }

    if (role !== "ADMIN" && drawing.createdBy !== userId) {
      throw new HttpError(403, "Anda tidak dapat membuat revisi untuk drawing ini.");
    }

    const revisions = await tx
      .select()
      .from(schema.drawingRevisions)
      .where(eq(schema.drawingRevisions.drawingId, drawing.id))
      .orderBy(asc(schema.drawingRevisions.createdAt));

    const currentRevision = revisions.find((item) => item.id === drawing.currentRevisionId);
    if (!currentRevision || currentRevision.status !== "COMPLETED") {
      throw new HttpError(409, "Revisi baru hanya dapat dibuat dari drawing completed.");
    }

    const currentRevisionNo = currentRevision.revisionNo;
    const nextRevisionNo = String.fromCharCode(currentRevisionNo.toUpperCase().charCodeAt(0) + 1);
    const revisionId = crypto.randomUUID();
    const fileName = `${drawing.drawingNumber}-rev-${nextRevisionNo}.pdf`;
    const paths = buildFilePaths(drawing.id, nextRevisionNo, fileName);

    await tx
      .update(schema.drawingRevisions)
      .set({ isLatest: false, updatedAt: new Date() })
      .where(eq(schema.drawingRevisions.drawingId, drawing.id));

    await tx.insert(schema.drawingRevisions).values({
      id: revisionId,
      drawingId: drawing.id,
      revisionNo: nextRevisionNo,
      fileName,
      fileOriginalPath: paths.original,
      fileWatermarkedPath: null,
      status: "DRAFT",
      changeNote: "Revisi baru dibuat.",
      isLatest: true,
      isCompleted: false
    });

    await tx
      .update(schema.drawings)
      .set({
        currentRevisionId: revisionId,
        currentStatus: "DRAFT",
        updatedAt: new Date()
      })
      .where(eq(schema.drawings.id, drawing.id));

    await createAuditLog(
      {
        entityType: "REVISION",
        entityId: revisionId,
        action: "REVISION_CREATED",
        userId,
        note: "Revisi baru dibuat dari drawing completed."
      },
      tx
    );

    return { drawingId: drawing.id, revisionId };
  });
}

export async function deleteDrawing(drawingId: string, userId: string, role: AppRole) {
  const result = await db.transaction(async (tx) => {
    const drawing = await tx.query.drawings.findFirst({
      where: eq(schema.drawings.id, drawingId)
    });

    if (!drawing) {
      throw new HttpError(404, "Drawing tidak ditemukan.");
    }

    if (role !== "ADMIN") {
      throw new HttpError(403, "Anda tidak memiliki akses untuk menghapus drawing.");
    }

    const revisions = await tx
      .select({
        id: schema.drawingRevisions.id
      })
      .from(schema.drawingRevisions)
      .where(eq(schema.drawingRevisions.drawingId, drawing.id));

    const revisionIds = revisions.map((revision) => revision.id);
    const auditLogFilter = revisionIds.length
      ? or(
          and(
            eq(schema.auditLogs.entityType, "DRAWING"),
            eq(schema.auditLogs.entityId, drawing.id)
          ),
          and(
            eq(schema.auditLogs.entityType, "REVISION"),
            inArray(schema.auditLogs.entityId, revisionIds)
          )
        )
      : and(
          eq(schema.auditLogs.entityType, "DRAWING"),
          eq(schema.auditLogs.entityId, drawing.id)
        );

    await tx.delete(schema.auditLogs).where(auditLogFilter);
    await tx.delete(schema.drawings).where(eq(schema.drawings.id, drawing.id));

    await createAuditLog(
      {
        entityType: "DRAWING",
        entityId: drawing.id,
        action: "DRAWING_DELETED",
        userId,
        note: `Drawing ${drawing.drawingNumber} dihapus oleh admin.`
      },
      tx
    );

    return {
      drawingId: drawing.id,
      drawingNumber: drawing.drawingNumber
    };
  });

  try {
    await removeDrawingFiles({ drawingId });
  } catch (error) {
    console.error(`Gagal membersihkan file drawing ${drawingId} setelah penghapusan.`, error);
  }

  return result;
}

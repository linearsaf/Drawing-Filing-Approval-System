import { and, desc, eq, inArray } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { HttpError } from "@/lib/server/api";
import { AppRole } from "@/lib/server/auth";
import { createAuditLog } from "@/server/services/audit.service";
import {
  notifyAssignedDrafterDrawingRequest,
  notifyDraftLeadersDrawingRequestPendingReview,
  notifyDraftLeadersDrawingRequestReturned,
  notifyRequesterDrawingRequestAccepted,
  notifyRequesterDrawingRequestRejected
} from "@/server/services/notification.service";
import { removeDrawingFiles, saveGeneratedDrawingPdfFile } from "@/server/storage/drawing-files";

type DrawingRequestStatus = typeof schema.drawingRequests.status._.data;

function canCreateDrawingRequest(role: AppRole) {
  return !["DRAFTER", "DRAFT_LEADER"].includes(role);
}

function buildRequestNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `DRQ-${datePart}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function parseReferenceImagePaths(
  request: Pick<
    typeof schema.drawingRequests.$inferSelect,
    "referenceImagePath" | "referenceImagePaths"
  >
) {
  if (request.referenceImagePaths) {
    try {
      const parsed = JSON.parse(request.referenceImagePaths) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
      }
    } catch {
      return request.referenceImagePath ? [request.referenceImagePath] : [];
    }
  }

  return request.referenceImagePath ? [request.referenceImagePath] : [];
}

async function assertActiveDrafterUser(userId: string) {
  const drafter = await db.query.user.findFirst({
    where: and(eq(schema.user.id, userId), eq(schema.user.role, "DRAFTER"), eq(schema.user.isActive, true))
  });

  if (!drafter) {
    throw new HttpError(422, "Drafter tujuan tidak valid atau tidak aktif.");
  }

  return drafter;
}

async function getRequestOrThrow(requestId: string) {
  const request = await db.query.drawingRequests.findFirst({
    where: eq(schema.drawingRequests.id, requestId)
  });

  if (!request) {
    throw new HttpError(404, "Drawing request tidak ditemukan.");
  }

  return request;
}

function assertCanViewRequest(
  role: AppRole,
  userId: string,
  request: typeof schema.drawingRequests.$inferSelect
) {
  if (role === "DRAFT_LEADER") {
    return;
  }

  if (role === "DRAFTER") {
    if (request.assignedDrafterId !== userId) {
      throw new HttpError(403, "Anda tidak memiliki akses ke drawing request ini.");
    }

    return;
  }

  if (request.requestedByUserId !== userId) {
    throw new HttpError(403, "Anda tidak memiliki akses ke drawing request ini.");
  }
}

async function buildPlaceholderPdfBuffer(requestNumber: string) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  page.drawText(`Placeholder draft for ${requestNumber}`, { x: 48, y: 770, size: 18 });
  page.drawText("Dokumen ini dibuat otomatis saat Drafter menerima assignment.", {
    x: 48,
    y: 742,
    size: 12
  });
  page.drawText("Silakan ganti file PDF ini dari halaman Edit Draft sebelum submit ke Check.", {
    x: 48,
    y: 722,
    size: 12
  });
  return Buffer.from(await doc.save());
}

async function enrichRequests(
  items: Array<typeof schema.drawingRequests.$inferSelect>
) {
  if (items.length === 0) {
    return [];
  }

  const userIds = [
    ...new Set(
      items.flatMap((item) =>
        [item.requestedByUserId, item.reviewedByDraftLeaderId, item.assignedDrafterId].filter(Boolean) as string[]
      )
    )
  ];
  const drawingIds = [...new Set(items.map((item) => item.drawingId).filter(Boolean) as string[])];

  const users = userIds.length
    ? await db
        .select({
          id: schema.user.id,
          name: schema.user.name,
          username: schema.user.username,
          role: schema.user.role
        })
        .from(schema.user)
        .where(inArray(schema.user.id, userIds))
    : [];

  const drawings = drawingIds.length
    ? await db
        .select({
          id: schema.drawings.id,
          drawingNumber: schema.drawings.drawingNumber,
          drawingName: schema.drawings.drawingName
        })
        .from(schema.drawings)
        .where(inArray(schema.drawings.id, drawingIds))
    : [];

  const userById = new Map(users.map((item) => [item.id, item]));
  const drawingById = new Map(drawings.map((item) => [item.id, item]));

  return items.map((item) => {
    const requester = userById.get(item.requestedByUserId) ?? null;
    const reviewer = item.reviewedByDraftLeaderId
      ? userById.get(item.reviewedByDraftLeaderId) ?? null
      : null;
    const drafter = item.assignedDrafterId ? userById.get(item.assignedDrafterId) ?? null : null;
    const drawing = item.drawingId ? drawingById.get(item.drawingId) ?? null : null;

    return {
      ...item,
      referenceImagePaths: parseReferenceImagePaths(item),
      requestedByName: requester?.name ?? null,
      requestedByUsername: requester?.username ?? null,
      reviewedByName: reviewer?.name ?? null,
      reviewedByUsername: reviewer?.username ?? null,
      assignedDrafterName: drafter?.name ?? null,
      assignedDrafterUsername: drafter?.username ?? null,
      linkedDrawingNumber: drawing?.drawingNumber ?? null,
      linkedDrawingName: drawing?.drawingName ?? null
    };
  });
}

export async function createDrawingRequest(
  input: {
    requestId?: string;
    sacCode: string;
    area: string;
    description: string;
    purpose: string;
    referenceImagePaths?: string[];
  },
  actor: {
    userId: string;
    role: AppRole;
  }
) {
  if (!canCreateDrawingRequest(actor.role)) {
    throw new HttpError(403, "Role ini tidak dapat membuat request drawing baru.");
  }

  const requestId = input.requestId ?? crypto.randomUUID();
  const requestNumber = buildRequestNumber();
  const createdAt = new Date();

  await db.transaction(async (tx) => {
    await tx.insert(schema.drawingRequests).values({
      id: requestId,
      requestNumber,
      requestedByUserId: actor.userId,
      sacCode: input.sacCode.trim(),
      area: input.area.trim(),
      description: input.description.trim(),
      purpose: input.purpose.trim(),
      referenceImagePath: input.referenceImagePaths?.[0] ?? null,
      referenceImagePaths:
        input.referenceImagePaths && input.referenceImagePaths.length > 0
          ? JSON.stringify(input.referenceImagePaths)
          : null,
      status: "PENDING_REVIEW",
      createdAt,
      updatedAt: createdAt
    });

    await createAuditLog(
      {
        entityType: "DRAWING_REQUEST",
        entityId: requestId,
        action: "DRAWING_REQUEST_CREATED",
        userId: actor.userId,
        note: "Request drawing baru diajukan dan menunggu review Draft Leader."
      },
      tx
    );

    await notifyDraftLeadersDrawingRequestPendingReview(
      {
        requestId,
        requestNumber,
        sacCode: input.sacCode.trim(),
        area: input.area.trim(),
        purpose: input.purpose.trim(),
        createdAt
      },
      tx
    );
  });

  return { requestId };
}

export async function listDrawingRequests(params: {
  role: AppRole;
  userId: string;
  status?: DrawingRequestStatus | "ALL";
  page?: number;
  pageSize?: number;
}) {
  const pageSize = Math.max(1, params.pageSize ?? 8);
  const requestedPage = Math.max(1, params.page ?? 1);

  const rows = await db
    .select()
    .from(schema.drawingRequests)
    .orderBy(desc(schema.drawingRequests.updatedAt));

  const visible = rows.filter((item) => {
    if (params.role === "DRAFT_LEADER") {
      if (!["PENDING_REVIEW", "DRAFTER_REJECTED"].includes(item.status)) {
        return false;
      }

      return params.status && params.status !== "ALL" ? item.status === params.status : true;
    }

    if (params.role === "DRAFTER") {
      if (item.assignedDrafterId !== params.userId || item.status !== "WAITING_DRAFTER_ACCEPTANCE") {
        return false;
      }

      return params.status && params.status !== "ALL" ? item.status === params.status : true;
    }

    if (item.requestedByUserId !== params.userId) {
      return false;
    }

    return params.status && params.status !== "ALL" ? item.status === params.status : true;
  });

  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const pagedItems = visible.slice((page - 1) * pageSize, page * pageSize);

  const items = await enrichRequests(pagedItems);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    stats: {
      pendingReviewCount: visible.filter((item) => item.status === "PENDING_REVIEW").length,
      waitingAcceptanceCount: visible.filter((item) => item.status === "WAITING_DRAFTER_ACCEPTANCE").length,
      rejectedCount: visible.filter((item) =>
        ["REVIEW_REJECTED", "DRAFTER_REJECTED"].includes(item.status)
      ).length,
      closedCount: visible.filter((item) => item.status === "CLOSED").length
    }
  };
}

export async function getDrawingRequestDetail(requestId: string, role: AppRole, userId: string) {
  const request = await getRequestOrThrow(requestId);
  assertCanViewRequest(role, userId, request);

  const [item] = await enrichRequests([request]);
  const auditRows = await db
    .select({
      id: schema.auditLogs.id,
      action: schema.auditLogs.action,
      note: schema.auditLogs.note,
      createdAt: schema.auditLogs.createdAt,
      userId: schema.auditLogs.userId
    })
    .from(schema.auditLogs)
    .where(and(eq(schema.auditLogs.entityType, "DRAWING_REQUEST"), eq(schema.auditLogs.entityId, requestId)))
    .orderBy(desc(schema.auditLogs.createdAt));

  const actorIds = [...new Set(auditRows.map((row) => row.userId).filter(Boolean) as string[])];
  const actors = actorIds.length
    ? await db
        .select({
          id: schema.user.id,
          name: schema.user.name,
          username: schema.user.username,
          role: schema.user.role
        })
        .from(schema.user)
        .where(inArray(schema.user.id, actorIds))
    : [];
  const actorById = new Map(actors.map((actor) => [actor.id, actor]));

  return {
    request: item,
    timeline: auditRows.map((row) => {
      const actor = row.userId ? actorById.get(row.userId) ?? null : null;

      return {
        id: row.id,
        action: row.action,
        note: row.note,
        createdAt: row.createdAt.toISOString(),
        actorId: row.userId ?? null,
        actorName: actor?.name ?? null,
        actorUsername: actor?.username ?? null,
        actorRole: actor?.role ?? null
      };
    })
  };
}

export async function reviewDrawingRequest(
  requestId: string,
  input: {
    action: "APPROVE_ASSIGN" | "REJECT";
    assignedDrafterId?: string;
    note?: string;
  },
  actor: {
    userId: string;
    role: AppRole;
  }
) {
  if (actor.role !== "DRAFT_LEADER") {
    throw new HttpError(403, "Hanya Draft Leader yang dapat mereview drawing request.");
  }

  const request = await getRequestOrThrow(requestId);

  if (!["PENDING_REVIEW", "DRAFTER_REJECTED"].includes(request.status)) {
    throw new HttpError(409, "Drawing request ini tidak berada pada status review yang dapat diproses.");
  }

  const note = input.note?.trim() ?? "";
  const reviewedAt = new Date();

  if (input.action === "REJECT") {
    if (!note) {
      throw new HttpError(422, "Alasan reject wajib diisi.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.drawingRequests)
        .set({
          status: "REVIEW_REJECTED",
          reviewedByDraftLeaderId: actor.userId,
          draftLeaderReviewNote: note,
          closedReason: note,
          reviewedAt,
          closedAt: reviewedAt,
          updatedAt: reviewedAt
        })
        .where(eq(schema.drawingRequests.id, requestId));

      await createAuditLog(
        {
          entityType: "DRAWING_REQUEST",
          entityId: requestId,
          action: "DRAWING_REQUEST_REJECTED_BY_DRAFT_LEADER",
          userId: actor.userId,
          note
        },
        tx
      );

      await notifyRequesterDrawingRequestRejected(
        {
          recipientUserId: request.requestedByUserId,
          requestId,
          requestNumber: request.requestNumber,
          reason: note,
          createdAt: reviewedAt
        },
        tx
      );
    });

    return { requestId };
  }

  if (!input.assignedDrafterId) {
    throw new HttpError(422, "Drafter tujuan wajib dipilih.");
  }

  const drafter = await assertActiveDrafterUser(input.assignedDrafterId);

  await db.transaction(async (tx) => {
    await tx
      .update(schema.drawingRequests)
      .set({
        status: "WAITING_DRAFTER_ACCEPTANCE",
        reviewedByDraftLeaderId: actor.userId,
        assignedDrafterId: drafter.id,
        draftLeaderReviewNote: note || request.draftLeaderReviewNote,
        reviewedAt,
        assignedAt: reviewedAt,
        updatedAt: reviewedAt
      })
      .where(eq(schema.drawingRequests.id, requestId));

    await createAuditLog(
      {
        entityType: "DRAWING_REQUEST",
        entityId: requestId,
        action: request.status === "DRAFTER_REJECTED"
          ? "DRAWING_REQUEST_REASSIGNED_TO_DRAFTER"
          : "DRAWING_REQUEST_APPROVED_AND_ASSIGNED",
        userId: actor.userId,
        note: note || `Request didelegasikan ke ${drafter.name}.`,
        metadata: {
          assignedDrafterId: drafter.id,
          assignedDrafterName: drafter.name
        }
      },
      tx
    );

    await notifyAssignedDrafterDrawingRequest(
      {
        recipientUserId: drafter.id,
        requestId,
        requestNumber: request.requestNumber,
        area: request.area,
        purpose: request.purpose,
        createdAt: reviewedAt
      },
      tx
    );
  });

  return { requestId };
}

export async function decideDrawingRequestByDrafter(
  requestId: string,
  input: {
    action: "ACCEPT" | "REJECT";
    note?: string;
  },
  actor: {
    userId: string;
    role: AppRole;
  }
) {
  if (actor.role !== "DRAFTER") {
    throw new HttpError(403, "Hanya Drafter yang dapat memproses assignment request ini.");
  }

  const request = await getRequestOrThrow(requestId);

  if (request.status !== "WAITING_DRAFTER_ACCEPTANCE" || request.assignedDrafterId !== actor.userId) {
    throw new HttpError(409, "Drawing request ini tidak tersedia untuk Anda proses.");
  }

  const note = input.note?.trim() ?? "";
  const decidedAt = new Date();

  if (input.action === "REJECT") {
    if (!note) {
      throw new HttpError(422, "Alasan reject wajib diisi.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.drawingRequests)
        .set({
          status: "DRAFTER_REJECTED",
          drafterDecisionNote: note,
          updatedAt: decidedAt
        })
        .where(eq(schema.drawingRequests.id, requestId));

      await createAuditLog(
        {
          entityType: "DRAWING_REQUEST",
          entityId: requestId,
          action: "DRAWING_REQUEST_REJECTED_BY_DRAFTER",
          userId: actor.userId,
          note
        },
        tx
      );

      await notifyDraftLeadersDrawingRequestReturned(
        {
          requestId,
          requestNumber: request.requestNumber,
          reason: note,
          createdAt: decidedAt
        },
        tx
      );
    });

    return { requestId };
  }

  const drawingId = crypto.randomUUID();
  const revisionId = crypto.randomUUID();
  const revisionNo = "0";
  const drawingNumber = `REQ-${request.requestNumber}`;
  const drawingName = request.description.slice(0, 120) || `Request ${request.requestNumber}`;
  const discipline = "Pending";
  const fileName = `request-${request.requestNumber.toLowerCase()}.pdf`;
  const pdfBuffer = await buildPlaceholderPdfBuffer(request.requestNumber);

  const storedFile = await saveGeneratedDrawingPdfFile({
    drawingId,
    revisionNo,
    fileName,
    buffer: pdfBuffer
  });

  try {
    await db.transaction(async (tx) => {
      await tx.insert(schema.drawings).values({
        id: drawingId,
        drawingNumber,
        drawingName,
        sacCode: request.sacCode,
        area: request.area,
        discipline,
        description: request.description,
        createdBy: actor.userId,
        drawnByUserId: actor.userId,
        workflowSource: "STANDARD",
        legacyReadyNote: null,
        currentRevisionId: revisionId,
        currentStatus: "DRAFT",
        latestCompletedRevisionId: null,
        createdAt: decidedAt,
        updatedAt: decidedAt
      });

      await tx.insert(schema.drawingRevisions).values({
        id: revisionId,
        drawingId,
        revisionNo,
        fileName: storedFile.fileName,
        fileOriginalPath: storedFile.fileOriginalPath,
        fileWatermarkedPath: null,
        status: "DRAFT",
        changeNote: `Draft dibuat dari drawing request ${request.requestNumber}.`,
        submittedBy: null,
        submittedAt: null,
        isLatest: true,
        isCompleted: false,
        createdAt: decidedAt,
        updatedAt: decidedAt
      });

      await tx
        .update(schema.drawingRequests)
        .set({
          status: "CLOSED",
          drawingId,
          drafterDecisionNote: note || null,
          closedReason: "Request diterima dan dikonversi menjadi draft drawing.",
          closedAt: decidedAt,
          updatedAt: decidedAt
        })
        .where(eq(schema.drawingRequests.id, requestId));

      await createAuditLog(
        {
          entityType: "DRAWING",
          entityId: drawingId,
          action: "DRAWING_CREATED_FROM_REQUEST",
          userId: actor.userId,
          note: `Draft baru dibuat dari request ${request.requestNumber}.`,
          metadata: {
            requestId,
            requestNumber: request.requestNumber
          }
        },
        tx
      );

      await createAuditLog(
        {
          entityType: "DRAWING_REQUEST",
          entityId: requestId,
          action: "DRAWING_REQUEST_ACCEPTED_AND_CONVERTED",
          userId: actor.userId,
          note: "Request diterima Drafter dan diubah menjadi draft drawing.",
          metadata: {
            drawingId,
            drawingNumber
          }
        },
        tx
      );

      await notifyRequesterDrawingRequestAccepted(
        {
          recipientUserId: request.requestedByUserId,
          requestId,
          requestNumber: request.requestNumber,
          drawingId,
          drawingNumber,
          drawingName,
          createdAt: decidedAt
        },
        tx
      );
    });
  } catch (error) {
    await removeDrawingFiles({
      drawingId
    });
    throw error;
  }

  return { requestId, drawingId };
}

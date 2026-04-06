import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import {
  AccessRequestStatus,
  NotificationFilter,
  NotificationItem,
  NotificationLifecycleStatus,
  NotificationType
} from "@/lib/types";
import { HttpError } from "@/lib/server/api";

type DbExecutor = Pick<typeof db, "select" | "insert" | "update" | "delete"> & {
  query: typeof db.query;
};

type NotificationEntityType = "DRAWING" | "REVISION" | "USER" | "ACCESS_REQUEST";

interface NotificationCreateInput {
  recipientUserId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: NotificationEntityType;
  entityId: string;
  actionUrl: string;
  sourceKey: string;
  createdAt?: Date;
}

type NotificationRow = typeof schema.notifications.$inferSelect;

type RevisionContext = {
  id: string;
  drawingId: string;
  revisionNo: string;
  status: string;
};

type DrawingContext = {
  id: string;
  drawingNumber: string;
  drawingName: string;
  currentRevisionId: string | null;
  workflowSource: "STANDARD" | "LEGACY_READY";
};

type AccessRequestContext = {
  id: string;
  name: string;
  email: string;
  status: AccessRequestStatus;
};

function isActionableType(type: NotificationType) {
  return type !== "DRAWING_COMPLETED";
}

function buildSourceKey(parts: Array<string | number>) {
  return parts.join(":");
}

async function listActiveUserIdsByRole(roles: Array<"ADMIN" | "DRAFT_LEADER">, tx: DbExecutor = db) {
  const users = await tx
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(and(inArray(schema.user.role, roles), eq(schema.user.isActive, true)));

  return users.map((user) => user.id);
}

async function insertNotifications(
  notifications: NotificationCreateInput[],
  tx: DbExecutor = db
) {
  if (notifications.length === 0) {
    return;
  }

  await tx.insert(schema.notifications).values(
    notifications.map((notification) => ({
      id: crypto.randomUUID(),
      recipientUserId: notification.recipientUserId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      entityType: notification.entityType,
      entityId: notification.entityId,
      actionUrl: notification.actionUrl,
      sourceKey: notification.sourceKey,
      createdAt: notification.createdAt ?? new Date()
    }))
  );
}

export async function notifyDraftLeadersWaitingCheck(
  input: {
    drawingId: string;
    drawingNumber: string;
    drawingName: string;
    revisionId: string;
    revisionNo: string;
    createdAt?: Date;
  },
  tx: DbExecutor = db
) {
  const recipients = await listActiveUserIdsByRole(["DRAFT_LEADER"], tx);
  const createdAt = input.createdAt ?? new Date();

  await insertNotifications(
    recipients.map((recipientUserId) => ({
      recipientUserId,
      type: "WAITING_CHECK",
      title: "Drawing baru menunggu check",
      body: `${input.drawingNumber} / Rev ${input.revisionNo} siap ditinjau pada tahap check.`,
      entityType: "REVISION",
      entityId: input.revisionId,
      actionUrl: `/drawings/${input.drawingId}/check`,
      sourceKey: buildSourceKey([
        "notification",
        "waiting-check",
        input.revisionId,
        createdAt.getTime(),
        recipientUserId
      ]),
      createdAt
    })),
    tx
  );
}

export async function notifyAssignedApprover(
  input: {
    drawingId: string;
    drawingNumber: string;
    drawingName: string;
    revisionId: string;
    revisionNo: string;
    approvalLevel: 1 | 2;
    assignedUserId: string | null;
    assignedAt?: Date | null;
  },
  tx: DbExecutor = db
) {
  if (!input.assignedUserId) {
    return;
  }

  const assignedAt = input.assignedAt ?? new Date();
  const type = input.approvalLevel === 1 ? "WAITING_APPROVAL_1" : "WAITING_APPROVAL_2";
  const title =
    input.approvalLevel === 1
      ? "Drawing baru menunggu approval level 1"
      : "Drawing baru menunggu final approval";
  const body =
    input.approvalLevel === 1
      ? `${input.drawingNumber} / Rev ${input.revisionNo} telah ditugaskan ke Anda untuk approval level 1.`
      : `${input.drawingNumber} / Rev ${input.revisionNo} telah ditugaskan ke Anda untuk final approval.`;

  await insertNotifications(
    [
      {
        recipientUserId: input.assignedUserId,
        type,
        title,
        body,
        entityType: "REVISION",
        entityId: input.revisionId,
        actionUrl: `/drawings/${input.drawingId}/approve`,
        sourceKey: buildSourceKey([
          "notification",
          type.toLowerCase(),
          input.revisionId,
          input.assignedUserId,
          assignedAt.getTime()
        ]),
        createdAt: assignedAt
      }
    ],
    tx
  );
}

export async function notifyDrafterRejectedRevision(
  input: {
    drawingId: string;
    drawingNumber: string;
    drawingName: string;
    revisionId: string;
    revisionNo: string;
    drawnByUserId: string;
    status: "CHECK_REJECTED" | "APPROVAL_1_REJECTED" | "APPROVAL_2_REJECTED";
    createdAt?: Date;
  },
  tx: DbExecutor = db
) {
  const stageLabel =
    input.status === "CHECK_REJECTED"
      ? "check"
      : input.status === "APPROVAL_1_REJECTED"
        ? "approval level 1"
        : "final approval";
  const createdAt = input.createdAt ?? new Date();

  await insertNotifications(
    [
      {
        recipientUserId: input.drawnByUserId,
        type: input.status,
        title: "Drawing memerlukan revisi",
        body: `${input.drawingNumber} / Rev ${input.revisionNo} dikembalikan dari tahap ${stageLabel}.`,
        entityType: "REVISION",
        entityId: input.revisionId,
        actionUrl: `/drawings/${input.drawingId}/edit`,
        sourceKey: buildSourceKey([
          "notification",
          input.status.toLowerCase(),
          input.revisionId,
          createdAt.getTime(),
          input.drawnByUserId
        ]),
        createdAt
      }
    ],
    tx
  );
}

export async function notifyDrafterCompletedDrawing(
  input: {
    drawingId: string;
    drawingNumber: string;
    drawingName: string;
    revisionId: string;
    revisionNo: string;
    drawnByUserId: string;
    workflowSource: "STANDARD" | "LEGACY_READY";
    createdAt?: Date;
  },
  tx: DbExecutor = db
) {
  if (input.workflowSource !== "STANDARD") {
    return;
  }

  const createdAt = input.createdAt ?? new Date();

  await insertNotifications(
    [
      {
        recipientUserId: input.drawnByUserId,
        type: "DRAWING_COMPLETED",
        title: "Drawing telah selesai",
        body: `${input.drawingNumber} / Rev ${input.revisionNo} sudah mencapai status completed dan siap dipakai sebagai final drawing.`,
        entityType: "REVISION",
        entityId: input.revisionId,
        actionUrl: `/drawings/${input.drawingId}`,
        sourceKey: buildSourceKey([
          "notification",
          "drawing-completed",
          input.revisionId,
          createdAt.getTime(),
          input.drawnByUserId
        ]),
        createdAt
      }
    ],
    tx
  );
}

export async function notifyAdminsAccessRequestPending(
  input: {
    requestId: string;
    name: string;
    email: string;
    createdAt?: Date;
  },
  tx: DbExecutor = db
) {
  const recipients = await listActiveUserIdsByRole(["ADMIN"], tx);
  const createdAt = input.createdAt ?? new Date();

  await insertNotifications(
    recipients.map((recipientUserId) => ({
      recipientUserId,
      type: "ACCESS_REQUEST_PENDING",
      title: "Ada permintaan user baru",
      body: `${input.name} (${input.email}) mengirim request access baru dan menunggu review.`,
      entityType: "ACCESS_REQUEST",
      entityId: input.requestId,
      actionUrl: "/admin/users",
      sourceKey: buildSourceKey([
        "notification",
        "access-request-pending",
        input.requestId,
        createdAt.getTime(),
        recipientUserId
      ]),
      createdAt
    })),
    tx
  );
}

export async function markRevisionNotificationsReadForUser(
  input: {
    recipientUserId: string;
    revisionId: string;
    types: NotificationType[];
    readAt?: Date;
  },
  tx: DbExecutor = db
) {
  if (input.types.length === 0) {
    return;
  }

  await tx
    .update(schema.notifications)
    .set({
      isRead: true,
      readAt: input.readAt ?? new Date()
    })
    .where(
      and(
        eq(schema.notifications.recipientUserId, input.recipientUserId),
        eq(schema.notifications.entityType, "REVISION"),
        eq(schema.notifications.entityId, input.revisionId),
        inArray(schema.notifications.type, input.types),
        eq(schema.notifications.isRead, false)
      )
    );
}

export async function markAccessRequestNotificationsReadForUser(
  input: {
    recipientUserId: string;
    requestId: string;
    readAt?: Date;
  },
  tx: DbExecutor = db
) {
  await tx
    .update(schema.notifications)
    .set({
      isRead: true,
      readAt: input.readAt ?? new Date()
    })
    .where(
      and(
        eq(schema.notifications.recipientUserId, input.recipientUserId),
        eq(schema.notifications.entityType, "ACCESS_REQUEST"),
        eq(schema.notifications.entityId, input.requestId),
        eq(schema.notifications.type, "ACCESS_REQUEST_PENDING"),
        eq(schema.notifications.isRead, false)
      )
    );
}

async function getNotificationRowsForUser(userId: string) {
  return db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.recipientUserId, userId))
    .orderBy(desc(schema.notifications.createdAt));
}

async function enrichNotifications(
  rows: NotificationRow[],
  recipientUserId: string
): Promise<NotificationItem[]> {
  if (rows.length === 0) {
    return [];
  }

  const revisionIds = rows
    .filter((row) => row.entityType === "REVISION")
    .map((row) => row.entityId);
  const accessRequestIds = rows
    .filter((row) => row.entityType === "ACCESS_REQUEST")
    .map((row) => row.entityId);

  const revisions: RevisionContext[] = revisionIds.length
    ? await db
        .select({
          id: schema.drawingRevisions.id,
          drawingId: schema.drawingRevisions.drawingId,
          revisionNo: schema.drawingRevisions.revisionNo,
          status: schema.drawingRevisions.status
        })
        .from(schema.drawingRevisions)
        .where(inArray(schema.drawingRevisions.id, revisionIds))
    : [];
  const revisionById = new Map(revisions.map((revision) => [revision.id, revision]));

  const drawingIds = [...new Set(revisions.map((revision) => revision.drawingId))];
  const drawings: DrawingContext[] = drawingIds.length
    ? await db
        .select({
          id: schema.drawings.id,
          drawingNumber: schema.drawings.drawingNumber,
          drawingName: schema.drawings.drawingName,
          currentRevisionId: schema.drawings.currentRevisionId,
          workflowSource: schema.drawings.workflowSource
        })
        .from(schema.drawings)
        .where(inArray(schema.drawings.id, drawingIds))
    : [];
  const drawingById = new Map(drawings.map((drawing) => [drawing.id, drawing]));

  const steps = revisionIds.length
    ? await db
        .select({
          revisionId: schema.revisionApprovalSteps.revisionId,
          approvalLevel: schema.revisionApprovalSteps.approvalLevel,
          assignedUserId: schema.revisionApprovalSteps.assignedUserId
        })
        .from(schema.revisionApprovalSteps)
        .where(inArray(schema.revisionApprovalSteps.revisionId, revisionIds))
    : [];
  const stepByKey = new Map(
    steps.map((step) => [`${step.revisionId}:${step.approvalLevel}`, step.assignedUserId ?? null])
  );

  const accessRequests: AccessRequestContext[] = accessRequestIds.length
    ? await db
        .select({
          id: schema.userAccessRequests.id,
          name: schema.userAccessRequests.name,
          email: schema.userAccessRequests.email,
          status: schema.userAccessRequests.status
        })
        .from(schema.userAccessRequests)
        .where(inArray(schema.userAccessRequests.id, accessRequestIds))
    : [];
  const accessRequestById = new Map(accessRequests.map((request) => [request.id, request]));

  return rows.map((row) => {
    const revision = row.entityType === "REVISION" ? revisionById.get(row.entityId) ?? null : null;
    const drawing = revision ? drawingById.get(revision.drawingId) ?? null : null;
    const accessRequest =
      row.entityType === "ACCESS_REQUEST" ? accessRequestById.get(row.entityId) ?? null : null;
    const lifecycleStatus = deriveLifecycleStatus(
      row,
      recipientUserId,
      revision,
      drawing,
      accessRequest,
      stepByKey
    );

    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      entityType: row.entityType,
      entityId: row.entityId,
      actionUrl: row.actionUrl,
      isRead: row.isRead,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      isActionable: lifecycleStatus === "ACTIVE" && isActionableType(row.type),
      lifecycleStatus,
      context: {
        drawingId: drawing?.id ?? null,
        drawingNumber: drawing?.drawingNumber ?? null,
        drawingName: drawing?.drawingName ?? null,
        revisionId: revision?.id ?? null,
        revisionNo: revision?.revisionNo ?? null,
        accessRequestId: accessRequest?.id ?? null,
        accessRequestName: accessRequest?.name ?? null,
        accessRequestEmail: accessRequest?.email ?? null,
        accessRequestStatus: accessRequest?.status ?? null
      }
    } satisfies NotificationItem;
  });
}

function deriveLifecycleStatus(
  row: NotificationRow,
  recipientUserId: string,
  revision: RevisionContext | null,
  drawing: DrawingContext | null,
  accessRequest: AccessRequestContext | null,
  stepByKey: Map<string, string | null>
): NotificationLifecycleStatus {
  if (row.type === "ACCESS_REQUEST_PENDING") {
    return accessRequest?.status === "PENDING" ? "ACTIVE" : "RESOLVED";
  }

  if (!revision || !drawing) {
    return "RESOLVED";
  }

  if (row.type === "WAITING_CHECK") {
    return revision.status === "WAITING_CHECK" ? "ACTIVE" : "RESOLVED";
  }

  if (row.type === "WAITING_APPROVAL_1") {
    if (revision.status !== "WAITING_APPROVAL_1") {
      return "RESOLVED";
    }

    return stepByKey.get(`${revision.id}:1`) === recipientUserId ? "ACTIVE" : "SUPERSEDED";
  }

  if (row.type === "WAITING_APPROVAL_2") {
    if (revision.status !== "WAITING_APPROVAL_2") {
      return "RESOLVED";
    }

    return stepByKey.get(`${revision.id}:2`) === recipientUserId ? "ACTIVE" : "SUPERSEDED";
  }

  if (row.type === "CHECK_REJECTED") {
    return revision.status === "CHECK_REJECTED" ? "ACTIVE" : "RESOLVED";
  }

  if (row.type === "APPROVAL_1_REJECTED") {
    return revision.status === "APPROVAL_1_REJECTED" ? "ACTIVE" : "RESOLVED";
  }

  if (row.type === "APPROVAL_2_REJECTED") {
    return revision.status === "APPROVAL_2_REJECTED" ? "ACTIVE" : "RESOLVED";
  }

  if (row.type === "DRAWING_COMPLETED") {
    return revision.status === "COMPLETED" &&
      drawing.currentRevisionId === revision.id &&
      drawing.workflowSource === "STANDARD"
      ? "ACTIVE"
      : "RESOLVED";
  }

  return "RESOLVED";
}

function paginateNotifications(items: NotificationItem[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages
  };
}

export async function listNotifications(params: {
  userId: string;
  filter: NotificationFilter;
  page: number;
  pageSize: number;
}) {
  const rows = await getNotificationRowsForUser(params.userId);
  const unreadCount = rows.filter((row) => !row.isRead).length;
  const enriched = await enrichNotifications(rows, params.userId);

  const filtered =
    params.filter === "UNREAD"
      ? enriched.filter((item) => !item.isRead)
      : params.filter === "ACTIONABLE"
        ? enriched.filter((item) => item.isActionable)
        : enriched;

  return {
    ...paginateNotifications(filtered, params.page, params.pageSize),
    unreadCount
  };
}

export async function getUnreadNotificationCount(userId: string) {
  const [{ unreadCount }] = await db
    .select({ unreadCount: count() })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.recipientUserId, userId), eq(schema.notifications.isRead, false)));

  return { unreadCount };
}

export async function openNotification(notificationId: string, userId: string) {
  const existing = await db.query.notifications.findFirst({
    where: and(
      eq(schema.notifications.id, notificationId),
      eq(schema.notifications.recipientUserId, userId)
    )
  });

  if (!existing) {
    throw new HttpError(404, "Notifikasi tidak ditemukan.");
  }

  if (!existing.isRead) {
    await db
      .update(schema.notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(schema.notifications.id, notificationId));
  }

  const refreshed = await db.query.notifications.findFirst({
    where: eq(schema.notifications.id, notificationId)
  });

  if (!refreshed) {
    throw new HttpError(404, "Notifikasi tidak ditemukan.");
  }

  const [item] = await enrichNotifications([refreshed], userId);

  return item;
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(schema.notifications)
    .set({
      isRead: true,
      readAt: new Date()
    })
    .where(and(eq(schema.notifications.recipientUserId, userId), eq(schema.notifications.isRead, false)));

  return getUnreadNotificationCount(userId);
}

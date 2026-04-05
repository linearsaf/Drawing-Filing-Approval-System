import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { schema } from "@/lib/db/schema";
import { AppRole } from "@/lib/server/auth";
import {
  buildApprovalPlanMap,
  canUserApproveAssignedStep,
  listApprovalActionsByRevisionIds,
  listApprovalStepsByRevisionIds
} from "@/server/services/approval-plan.service";

export async function getDashboardSummaryForRole(role: AppRole, userId: string) {
  const drawings = await db
    .select({
      id: schema.drawings.id,
      drawingNumber: schema.drawings.drawingNumber,
      drawingName: schema.drawings.drawingName,
      area: schema.drawings.area,
      discipline: schema.drawings.discipline,
      currentStatus: schema.drawings.currentStatus,
      currentRevisionId: schema.drawings.currentRevisionId,
      createdBy: schema.drawings.createdBy,
      drawnByUserId: schema.drawings.drawnByUserId,
      workflowSource: schema.drawings.workflowSource,
      updatedAt: schema.drawings.updatedAt
    })
    .from(schema.drawings);

  const visible = drawings.filter((drawing) => {
    if (role === "DRAFTER") {
      return drawing.createdBy === userId;
    }

    if (role === "CONSUMER") {
      return drawing.currentStatus === "COMPLETED";
    }

    return true;
  });

  const visibleDrawingIds = visible.map((drawing) => drawing.id);

  const revisionIds = await db
    .select({
      id: schema.drawingRevisions.id,
      drawingId: schema.drawingRevisions.drawingId,
      revisionNo: schema.drawingRevisions.revisionNo,
      status: schema.drawingRevisions.status,
      fileName: schema.drawingRevisions.fileName,
      submittedAt: schema.drawingRevisions.submittedAt,
      updatedAt: schema.drawingRevisions.updatedAt
    })
    .from(schema.drawingRevisions)
    .where(
      visible.length === 0
        ? eq(schema.drawingRevisions.drawingId, "__none__")
        : inArray(schema.drawingRevisions.drawingId, visibleDrawingIds)
    );

  const recentActivity = visible.length
    ? await db
        .select({
          id: schema.auditLogs.id,
          entityType: schema.auditLogs.entityType,
          entityId: schema.auditLogs.entityId,
          action: schema.auditLogs.action,
          userId: schema.auditLogs.userId,
          note: schema.auditLogs.note,
          createdAt: schema.auditLogs.createdAt
        })
        .from(schema.auditLogs)
        .where(
          or(
            and(
              eq(schema.auditLogs.entityType, "DRAWING"),
              inArray(schema.auditLogs.entityId, visibleDrawingIds)
            ),
            revisionIds.length
              ? and(
                  eq(schema.auditLogs.entityType, "REVISION"),
                  inArray(
                    schema.auditLogs.entityId,
                    revisionIds.map((revision) => revision.id)
                  )
                )
              : undefined
          )
        )
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(8)
    : [];

  const actorIds = [...new Set(recentActivity.map((item) => item.userId).filter(Boolean) as string[])];
  const drawingUserIds = [...new Set(visible.flatMap((item) => [item.createdBy, item.drawnByUserId]))];
  const userIds = [...new Set([...actorIds, ...drawingUserIds])];
  const actors = userIds.length
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
  const actorById = new Map(actors.map((user) => [user.id, user]));

  const drawingLookup = new Map(
    visible.map((drawing) => [
      drawing.id,
      {
        drawingId: drawing.id,
        drawingNumber: drawing.drawingNumber,
        drawingName: drawing.drawingName,
        currentStatus: drawing.currentStatus
      }
    ])
  );

  const revisionLookup = new Map(revisionIds.map((revision) => [revision.id, revision]));
  const approvalSteps = await listApprovalStepsByRevisionIds(revisionIds.map((revision) => revision.id));
  const approvalActions = await listApprovalActionsByRevisionIds(revisionIds.map((revision) => revision.id));
  const approvalPlanByRevision = buildApprovalPlanMap(revisionIds, approvalSteps, approvalActions);

  const rejectedStatuses: ReadonlySet<string> = new Set([
    "CHECK_REJECTED",
    "APPROVAL_1_REJECTED",
    "APPROVAL_2_REJECTED"
  ] as const);

  const queue = visible
    .filter((drawing) =>
      matchesRoleQueue(
        role,
        drawing.currentStatus,
        drawing.currentRevisionId ? revisionLookup.get(drawing.currentRevisionId) ?? null : null,
        drawing.currentRevisionId
          ? approvalPlanByRevision.get(drawing.currentRevisionId) ?? []
          : [],
        userId
      )
    )
    .sort((left, right) => {
      const priorityDelta =
        getQueuePriority(role, left.currentStatus) - getQueuePriority(role, right.currentStatus);

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    })
    .slice(0, 6)
    .map((drawing) => {
      const uploader = actorById.get(drawing.createdBy) ?? null;
      const drawnBy = actorById.get(drawing.drawnByUserId) ?? null;
      const currentRevision = drawing.currentRevisionId
        ? revisionLookup.get(drawing.currentRevisionId) ?? null
        : null;

      return {
        id: drawing.id,
        drawingNumber: drawing.drawingNumber,
        drawingName: drawing.drawingName,
        area: drawing.area,
        discipline: drawing.discipline,
        drawnByName: drawnBy?.name ?? null,
        drawnByUsername: drawnBy?.username ?? null,
        uploadedByName: uploader?.name ?? null,
        uploadedByUsername: uploader?.username ?? null,
        workflowSource: drawing.workflowSource,
        currentStatus: drawing.currentStatus,
        updatedAt: drawing.updatedAt,
        currentRevision: currentRevision
          ? {
              id: currentRevision.id,
              revisionNo: currentRevision.revisionNo,
              status: currentRevision.status,
              fileName: currentRevision.fileName,
              submittedAt: currentRevision.submittedAt,
              updatedAt: currentRevision.updatedAt
            }
          : null
      };
    });

  return {
    summary: {
      totalDrawings: visible.length,
      waitingCheck: visible.filter((item) => item.currentStatus === "WAITING_CHECK").length,
      waitingApproval1: visible.filter((item) => {
        const revision = item.currentRevisionId ? revisionLookup.get(item.currentRevisionId) ?? null : null;

        if (!revision || revision.status !== "WAITING_APPROVAL_1") {
          return false;
        }

        if (role !== "APPROVER_L1") {
          return true;
        }

        return canUserApproveAssignedStep({
          role,
          userId,
          revisionStatus: revision.status,
          approvalPlan: approvalPlanByRevision.get(revision.id) ?? []
        });
      }).length,
      waitingApproval2: visible.filter((item) => {
        const revision = item.currentRevisionId ? revisionLookup.get(item.currentRevisionId) ?? null : null;

        if (!revision || revision.status !== "WAITING_APPROVAL_2") {
          return false;
        }

        if (role !== "HEAD") {
          return true;
        }

        return canUserApproveAssignedStep({
          role,
          userId,
          revisionStatus: revision.status,
          approvalPlan: approvalPlanByRevision.get(revision.id) ?? []
        });
      }).length,
      rejected: visible.filter((item) => rejectedStatuses.has(item.currentStatus)).length,
      completed: visible.filter((item) => item.currentStatus === "COMPLETED").length,
      drafts: visible.filter((item) => item.currentStatus === "DRAFT").length
    },
    queue,
    recentActivity: recentActivity.map((item) => {
      const revision = item.entityType === "REVISION" ? revisionLookup.get(item.entityId) ?? null : null;
      const drawing = drawingLookup.get(revision?.drawingId ?? item.entityId);
      const actor = item.userId ? actorById.get(item.userId) ?? null : null;

      return {
        ...item,
        drawingId: revision?.drawingId ?? item.entityId,
        drawingNumber: drawing?.drawingNumber ?? null,
        drawingName: drawing?.drawingName ?? null,
        revisionNo: revision?.revisionNo ?? null,
        actorName: actor?.name ?? null,
        actorRole: actor?.role ?? null,
        currentStatus: drawing?.currentStatus ?? null
      };
    })
  };
}

function matchesRoleQueue(
  role: AppRole,
  status: string,
  revision: {
    id: string;
    status: string;
  } | null,
  approvalPlan: Array<{ approvalLevel: 1 | 2; assignedUserId: string | null }>,
  userId: string
) {
  if (role === "DRAFTER") {
    return ["DRAFT", "CHECK_REJECTED", "APPROVAL_1_REJECTED", "APPROVAL_2_REJECTED"].includes(status);
  }

  if (role === "DRAFT_LEADER") {
    return status === "WAITING_CHECK";
  }

  if (role === "APPROVER_L1") {
    return Boolean(
      revision &&
        canUserApproveAssignedStep({
          role,
          userId,
          revisionStatus: revision.status,
          approvalPlan
        })
    );
  }

  if (role === "HEAD") {
    return Boolean(
      revision &&
        canUserApproveAssignedStep({
          role,
          userId,
          revisionStatus: revision.status,
          approvalPlan
        })
    );
  }

  if (role === "CONSUMER") {
    return status === "COMPLETED";
  }

  return [
    "DRAFT",
    "WAITING_CHECK",
    "CHECK_REJECTED",
    "WAITING_APPROVAL_1",
    "APPROVAL_1_REJECTED",
    "WAITING_APPROVAL_2",
    "APPROVAL_2_REJECTED",
    "COMPLETED"
  ].includes(status);
}

function getQueuePriority(role: AppRole, status: string) {
  if (role === "DRAFTER") {
    if (status === "APPROVAL_2_REJECTED") return 0;
    if (status === "APPROVAL_1_REJECTED") return 1;
    if (status === "CHECK_REJECTED") return 2;
    if (status === "DRAFT") return 3;
    return 9;
  }

  if (role === "DRAFT_LEADER" && status === "WAITING_CHECK") {
    return 0;
  }

  if (role === "APPROVER_L1" && status === "WAITING_APPROVAL_1") {
    return 0;
  }

  if (role === "HEAD" && status === "WAITING_APPROVAL_2") {
    return 0;
  }

  if (role === "CONSUMER" && status === "COMPLETED") {
    return 0;
  }

  if (role === "ADMIN") {
    if (status === "WAITING_CHECK") return 0;
    if (status === "WAITING_APPROVAL_1") return 1;
    if (status === "WAITING_APPROVAL_2") return 2;
    if (status === "CHECK_REJECTED") return 3;
    if (status === "APPROVAL_1_REJECTED") return 4;
    if (status === "APPROVAL_2_REJECTED") return 5;
    if (status === "DRAFT") return 6;
    if (status === "COMPLETED") return 7;
  }

  return 9;
}
